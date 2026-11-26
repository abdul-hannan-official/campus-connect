import Club from "../Models/Club.js";
import Membership from "../Models/Membership.js";
import Post from "../Models/Post.js";
import ClubRequest from "../Models/ClubRequest.js";
import User from "../Models/User.js";

const isAdminUser = async (userId) => {
  const user = await User.findById(userId).select("role");
  return user?.role === "admin";
};

// CREATE CLUB
// Admins create an approved club directly. Students create a club request:
// the club is stored with status "pending" (hidden from Explore) and a
// ClubRequest record is opened for the admins to approve or reject.
export const createClub = async (req, res) => {
  try {
    const { name, title, description, bannerUrl, iconUrl, nsfw } =
      req.body || {};

    if (!name || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Club.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Club name already exists" });
    }

    const isAdmin = await isAdminUser(req.user.id);

    const club = new Club({
      name: name.toLowerCase(),
      title: title || name,
      description,
      createdBy: req.user.id,
      createdAt: new Date(),
      nsfw: nsfw || false,
      memberCount: 1,
      bannerUrl: bannerUrl || "",
      iconUrl: iconUrl || "",
      status: isAdmin ? "approved" : "pending",
      isPublic: true,
    });

    const saved = await club.save();
    await Membership.create({
      userId: req.user.id,
      clubId: saved._id,
      role: "moderator",
      joinedAt: new Date(),
    });

    if (!isAdmin) {
      await ClubRequest.create({
        user: req.user.id,
        club: saved._id,
        status: "pending",
      });
      return res.status(201).json({
        ...saved.toObject(),
        message: "Club request submitted. An admin will approve or reject it.",
      });
    }

    return res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET CLUB BY NAME
// Pending/rejected clubs are only visible to their creator and to admins.
export const getClubByName = async (req, res) => {
  try {
    const { name } = req.params;

    const club = await Club.findOne({ name: name.toLowerCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.status !== "approved") {
      const isAdmin = await isAdminUser(req.user?.id);
      const isCreator = club.createdBy?.toString() === req.user?.id;
      if (!isAdmin && !isCreator) {
        return res.status(404).json({ message: "Club not found" });
      }
    }

    return res.json(club);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE CLUB (club moderator or platform admin)
export const deleteClub = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name } = req.params;

    const club = await Club.findOne({ name: name.toLowerCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const isAdmin = await isAdminUser(req.user.id);
    const membership = await Membership.findOne({
      userId: req.user.id,
      clubId: club._id,
    });

    if (!isAdmin && (!membership || membership.role !== "moderator")) {
      return res
        .status(403)
        .json({ message: "Only moderators or admins can delete this club" });
    }

    await Membership.deleteMany({ clubId: club._id });
    await Post.deleteMany({ clubId: club._id });
    await ClubRequest.deleteMany({ club: club._id });

    await Club.deleteOne({ _id: club._id });

    return res.json({ message: "Club deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Join Club (only approved clubs can be joined)
export const joinClub = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const club = await Club.findOne({
      name: req.params.name.toLowerCase(),
    });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.status !== "approved") {
      return res.status(403).json({ message: "This club is not approved yet" });
    }

    const exists = await Membership.findOne({
      userId: req.user.id,
      clubId: club._id,
    });

    if (exists) {
      return res.status(400).json({ message: "Already joined" });
    }

    await Membership.create({
      userId: req.user.id,
      clubId: club._id,
      role: "member",
      joinedAt: new Date(),
    });

    await Club.findByIdAndUpdate(club._id, {
      $inc: { memberCount: 1 },
    });

    res.json({ message: "Joined club" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
};

// Club search (approved clubs only)
export async function searchClubs(req, res) {
  try {
    let { q = "", page = 1, limit = 20 } = req.query;
    q = q.trim().toLowerCase();

    if (!q) return res.json({ results: [], total: 0 });

    const query = {
      status: "approved",
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    const total = await Club.countDocuments(query);

    const clubs = await Club.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ results: clubs, total });
  } catch (err) {
    console.error("searchClubs error:", err);
    res.status(500).json({ error: "Server error while searching clubs" });
  }
}

// Get top clubs
export async function getTopClubs(req, res) {
  try {
    const clubs = await Club.find({ status: "approved" })
      .sort({ memberCount: -1 }) // highest first
      .limit(5)
      .select("name memberCount iconUrl bannerUrl");

    res.json(clubs);
  } catch (err) {
    console.error("getTopClubs error:", err);
    res.status(500).json({ error: "Failed to load top clubs" });
  }
}

// Get user clubs
export async function getUserClubs(req, res) {
  try {
    const userId = req.params.id;

    const memberships = await Membership.find({ userId })
      .populate({
        path: "clubId",
        select: "name title description memberCount iconUrl bannerUrl nsfw status",
      })
      .sort({ joinedAt: -1 });

    // Extract and filter the club objects
    const results = memberships
      .map((m) => m.clubId)
      .filter((c) => c !== null);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Server error fetching clubs" });
  }
}

// Leave club
export const leaveClub = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name } = req.params;

    const club = await Club.findOne({ name: name.toLowerCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const membership = await Membership.findOne({
      userId: req.user.id,
      clubId: club._id,
    });

    if (!membership) {
      return res
        .status(400)
        .json({ message: "Not a member of this club" });
    }

    await Membership.deleteOne({ _id: membership._id });

    await Club.findByIdAndUpdate(club._id, {
      $inc: { memberCount: -1 },
    });

    return res.json({ message: "Left club successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Leave club failed" });
  }
};

// Get all clubs for explore.
// Students only see approved clubs; admins see everything (optionally
// filtered with ?status=pending|approved|rejected).
export const getAllClubs = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const query = req.query.query || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const isAdmin = userId ? await isAdminUser(userId) : false;

    const filter = { name: { $regex: query, $options: "i" } };
    if (isAdmin) {
      if (req.query.status) filter.status = req.query.status;
    } else {
      filter.status = "approved";
    }

    const [clubs, total] = await Promise.all([
      Club.find(filter)
        .sort({ memberCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Club.countDocuments(filter),
    ]);

    if (!userId) {
      return res.json({
        results: clubs.map((c) => ({
          ...c.toObject(),
          isMember: false,
        })),
        total,
      });
    }

    const memberships = await Membership.find({ userId }, { clubId: 1 });

    const memberSet = new Set(memberships.map((m) => m.clubId.toString()));
    const results = clubs.map((c) => ({
      ...c.toObject(),
      isMember: memberSet.has(c._id.toString()),
    }));

    res.json({ results, total });
  } catch (err) {
    console.error("getAllClubs error:", err);
    res.status(500).json({ message: "Failed to load clubs" });
  }
};

export const getMembershipStatus = async (req, res) => {
  try {
    const club = await Club.findOne({
      name: req.params.name.toLowerCase(),
    });

    if (!club) {
      return res.status(404).json({ isMember: false, role: null });
    }

    const membership = await Membership.findOne({
      userId: req.user.id,
      clubId: club._id,
    });

    return res.json({
      isMember: !!membership,
      role: membership?.role || null,
    });
  } catch (err) {
    console.error("getMembershipStatus error:", err);
    return res.status(500).json({ isMember: false, role: null });
  }
};

// UPDATE CLUB (club moderator or platform admin)
export const updateClub = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name } = req.params;
    const club = await Club.findOne({ name: name.toLowerCase() });

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // must be moderator or admin
    const isAdmin = await isAdminUser(req.user.id);
    const membership = await Membership.findOne({
      userId: req.user.id,
      clubId: club._id,
    });

    if (!isAdmin && (!membership || membership.role !== "moderator")) {
      return res
        .status(403)
        .json({ message: "Only moderators or admins can edit this club" });
    }

    const { newName, description, bannerUrl, iconUrl, title } = req.body || {};

    if (newName && newName.trim()) {
      const normalized = newName.trim().toLowerCase().replace(/^r\//, "");
      const exists = await Club.findOne({
        name: normalized,
        _id: { $ne: club._id },
      });

      if (exists) {
        return res
          .status(409)
          .json({ message: "Club name already exists" });
      }

      club.name = normalized;
      club.title = title || normalized;
    }

    if (typeof description === "string") club.description = description;
    if (typeof bannerUrl === "string") club.bannerUrl = bannerUrl;
    if (typeof iconUrl === "string") club.iconUrl = iconUrl;
    if (typeof title === "string") club.title = title;

    await club.save();
    return res.json({ message: "Club updated", club });
  } catch (err) {
    console.error("updateClub error:", err);
    return res.status(500).json({ message: "Failed to update club" });
  }
};

// GET CLUB MEMBERS (with their per-club role) — for the admin panel and
// the moderator-assignment UI.
export const getClubMembers = async (req, res) => {
  try {
    const club = await Club.findOne({ name: req.params.name.toLowerCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const memberships = await Membership.find({ clubId: club._id })
      .populate("userId", "username email avatarUrl role")
      .sort({ joinedAt: 1 });

    res.json(
      memberships.map((m) => ({
        userId: m.userId?._id,
        username: m.userId?.username,
        email: m.userId?.email,
        avatarUrl: m.userId?.avatarUrl,
        globalRole: m.userId?.role,
        role: m.role,
        joinedAt: m.joinedAt,
      }))
    );
  } catch (err) {
    console.error("getClubMembers error:", err);
    return res.status(500).json({ message: "Failed to load club members" });
  }
};

// ASSIGN MODERATOR (admin only). Flips a member's Membership.role to
// "moderator" for THIS club only. The member must already have joined.
export const assignModerator = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const club = await Club.findOne({ name: req.params.name.toLowerCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const membership = await Membership.findOne({
      userId,
      clubId: club._id,
    });
    if (!membership) {
      return res
        .status(400)
        .json({ message: "User must join the club first" });
    }

    membership.role = "moderator";
    await membership.save();

    return res.json({ message: "Moderator assigned", membership });
  } catch (err) {
    console.error("assignModerator error:", err);
    return res.status(500).json({ message: "Failed to assign moderator" });
  }
};

// REMOVE MODERATOR (admin only). Flips the role back to "member".
export const removeModerator = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const club = await Club.findOne({ name: req.params.name.toLowerCase() });
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const membership = await Membership.findOne({
      userId,
      clubId: club._id,
    });
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    membership.role = "member";
    await membership.save();

    return res.json({ message: "Moderator removed", membership });
  } catch (err) {
    console.error("removeModerator error:", err);
    return res.status(500).json({ message: "Failed to remove moderator" });
  }
};
