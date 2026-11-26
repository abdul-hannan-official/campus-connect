import Event from "../Models/Event.js";
import Registration from "../Models/Registration.js";
import Membership from "../Models/Membership.js";
import User from "../Models/User.js";

// Who may manage this event: platform admin, or the organiser,
// or a moderator of the event's club.
const canManageEvent = async (userId, event) => {
  const user = await User.findById(userId);
  if (!user) return false;
  if (user.role === "admin") return true;
  if (event.organizer?.toString() === userId.toString()) return true;
  if (event.club) {
    const membership = await Membership.findOne({
      userId,
      clubId: event.club,
      role: "moderator",
    });
    return !!membership;
  }
  return false;
};

const withRegistrationInfo = async (events, userId) => {
  const ids = events.map((e) => e._id);
  const counts = await Registration.aggregate([
    { $match: { eventId: { $in: ids }, status: "registered" } },
    { $group: { _id: "$eventId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  let mine = new Set();
  if (userId) {
    const regs = await Registration.find({
      userId,
      eventId: { $in: ids },
    }).select("eventId");
    mine = new Set(regs.map((r) => r.eventId.toString()));
  }
  return events.map((e) => {
    const obj = e.toObject ? e.toObject() : e;
    return {
      ...obj,
      registeredCount: countMap.get(obj._id.toString()) || 0,
      isRegistered: mine.has(obj._id.toString()),
    };
  });
};

// LIST EVENTS
// ?filter=upcoming (default) | past | all
// Upcoming: date today or later AND status scheduled, soonest first.
// Past: date in the past OR status cancelled, most recent first.
// Optional ?clubId= to filter by club.
export const listEvents = async (req, res) => {
  try {
    const filter = (req.query.filter || "upcoming").toLowerCase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const query = {};
    if (req.query.clubId) query.club = req.query.clubId;

    if (filter === "upcoming") {
      query.date = { $gte: startOfToday };
      query.status = "scheduled";
    } else if (filter === "past") {
      query.$or = [{ date: { $lt: startOfToday } }, { status: "cancelled" }];
    }

    const sort = filter === "past" ? { date: -1 } : { date: 1, time: 1 };

    const events = await Event.find(query)
      .populate("organizer", "username")
      .populate("club", "name title")
      .sort(sort);

    res.json(await withRegistrationInfo(events, req.user?.id));
  } catch (err) {
    console.error("listEvents error:", err);
    res.status(500).json({ message: "Failed to load events" });
  }
};

// GET ONE EVENT
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "username")
      .populate("club", "name title");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const [enriched] = await withRegistrationInfo([event], req.user?.id);
    res.json(enriched);
  } catch (err) {
    console.error("getEvent error:", err);
    res.status(500).json({ message: "Failed to load event" });
  }
};

// CREATE EVENT (admin, or moderator of the event's club)
export const createEvent = async (req, res) => {
  try {
    const { title, description, category, date, time, venue, image, clubId } =
      req.body || {};

    if (!title || !description || !date || !time || !venue) {
      return res
        .status(400)
        .json({ message: "title, description, date, time and venue are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    let isAllowed = user.role === "admin";
    if (!isAllowed && clubId) {
      const membership = await Membership.findOne({
        userId: user._id,
        clubId,
        role: "moderator",
      });
      isAllowed = !!membership;
    }

    if (!isAllowed) {
      return res.status(403).json({
        message: "Only admins (or a moderator of the event's club) can create events",
      });
    }

    const event = await Event.create({
      title,
      description,
      category: category || "department",
      date: new Date(date),
      time,
      venue,
      image: image || "",
      organizer: user._id,
      club: clubId || null,
    });

    const populated = await event.populate([
      { path: "organizer", select: "username" },
      { path: "club", select: "name title" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ message: "Failed to create event" });
  }
};

// UPDATE EVENT (admin, organiser, or moderator of the event's club)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!(await canManageEvent(req.user.id, event))) {
      return res.status(403).json({ message: "Not allowed to update this event" });
    }

    const { title, description, category, date, time, venue, image } =
      req.body || {};

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (category !== undefined) event.category = category;
    if (date !== undefined) event.date = new Date(date);
    if (time !== undefined) event.time = time;
    if (venue !== undefined) event.venue = venue;
    if (image !== undefined) event.image = image;

    await event.save();

    const populated = await event.populate([
      { path: "organizer", select: "username" },
      { path: "club", select: "name title" },
    ]);
    res.json(populated);
  } catch (err) {
    console.error("updateEvent error:", err);
    res.status(500).json({ message: "Failed to update event" });
  }
};

// CANCEL EVENT (admin, organiser, or moderator of the event's club)
// Sets status to "cancelled"; the event stays visible in the past view.
export const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!(await canManageEvent(req.user.id, event))) {
      return res.status(403).json({ message: "Not allowed to cancel this event" });
    }

    if (event.status === "cancelled") {
      return res.status(400).json({ message: "Event is already cancelled" });
    }

    event.status = "cancelled";
    await event.save();
    res.json({ message: "Event cancelled", event });
  } catch (err) {
    console.error("cancelEvent error:", err);
    res.status(500).json({ message: "Failed to cancel event" });
  }
};

// DELETE EVENT (admin or organiser)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const user = await User.findById(req.user.id);
    const isAdmin = user?.role === "admin";
    const isOrganizer = event.organizer?.toString() === req.user.id;

    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({ message: "Not allowed to delete this event" });
    }

    await Registration.deleteMany({ eventId: event._id });
    await Event.deleteOne({ _id: event._id });
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};

// REGISTER FOR AN EVENT (any logged-in student)
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.status === "cancelled") {
      return res.status(400).json({ message: "This event was cancelled" });
    }

    const existing = await Registration.findOne({
      eventId: event._id,
      userId: req.user.id,
    });
    if (existing) {
      return res.status(400).json({ message: "Already registered" });
    }

    const registration = await Registration.create({
      eventId: event._id,
      userId: req.user.id,
      status: "registered",
    });

    res.status(201).json(registration);
  } catch (err) {
    console.error("registerForEvent error:", err);
    res.status(500).json({ message: "Failed to register for event" });
  }
};

// UNREGISTER FROM AN EVENT
export const unregisterFromEvent = async (req, res) => {
  try {
    const deleted = await Registration.deleteOne({
      eventId: req.params.id,
      userId: req.user.id,
    });
    if (!deleted.deletedCount) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.json({ message: "Unregistered from event" });
  } catch (err) {
    console.error("unregisterFromEvent error:", err);
    res.status(500).json({ message: "Failed to unregister" });
  }
};

// LIST REGISTRATIONS FOR AN EVENT (admin or organiser)
export const listRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!(await canManageEvent(req.user.id, event))) {
      return res.status(403).json({ message: "Not allowed to view registrations" });
    }

    const registrations = await Registration.find({ eventId: event._id })
      .populate("userId", "username email avatarUrl")
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (err) {
    console.error("listRegistrations error:", err);
    res.status(500).json({ message: "Failed to load registrations" });
  }
};
