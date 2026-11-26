import Announcement from "../Models/Announcement.js";
import Membership from "../Models/Membership.js";

// CREATE ANNOUNCEMENT (admin only)
// Body: { title?, content, link?, attachments?[], clubId?, isGlobal?, category, expiryDate? }
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, link, attachments, clubId, isGlobal, category, expiryDate } =
      req.body || {};

    if (!content || !category) {
      return res.status(400).json({ message: "content and category are required" });
    }

    const announcement = await Announcement.create({
      title: title || "",
      sender: req.user.id,
      content,
      link: link || "",
      attachments: Array.isArray(attachments) ? attachments : [],
      club: clubId || null,
      isGlobal: clubId ? false : isGlobal !== false,
      category,
      expiryDate: expiryDate || null,
    });

    const populated = await announcement.populate([
      { path: "sender", select: "username adminTitle" },
      { path: "club", select: "name title" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ message: "Failed to create announcement" });
  }
};

// LIST ANNOUNCEMENTS (logged-in students)
// Global announcements + announcements for clubs the user has joined.
// Expired announcements (expiryDate in the past) are hidden automatically.
export const listAnnouncements = async (req, res) => {
  try {
    const userId = req.user?.id;

    const memberships = userId
      ? await Membership.find({ userId }).select("clubId")
      : [];
    const myClubIds = memberships.map((m) => m.clubId);

    const now = new Date();
    const notExpired = {
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    };

    const announcements = await Announcement.find({
      $and: [
        notExpired,
        {
          $or: [
            { isGlobal: true },
            { club: { $in: myClubIds } },
            { club: null, isGlobal: true },
          ],
        },
      ],
    })
      .populate("sender", "username adminTitle")
      .populate("club", "name title")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    console.error("listAnnouncements error:", err);
    res.status(500).json({ message: "Failed to load announcements" });
  }
};

// DELETE ANNOUNCEMENT (admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await Announcement.deleteOne({ _id: announcement._id });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};
