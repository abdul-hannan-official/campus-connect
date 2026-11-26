import User from "../Models/User.js";
import Club from "../Models/Club.js";
import ClubRequest from "../Models/ClubRequest.js";
import Report from "../Models/Report.js";
import Event from "../Models/Event.js";
import Announcement from "../Models/Announcement.js";
import { checkAdminRole } from "./AuthController.js";

// GET /admin/overview — counts for the admin dashboard.
export const getOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalClubs,
      pendingClubs,
      pendingRequests,
      openReports,
      upcomingEvents,
      totalAnnouncements,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Club.countDocuments(),
      Club.countDocuments({ status: "pending" }),
      ClubRequest.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "open" }),
      Event.countDocuments({
        status: "scheduled",
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Announcement.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalClubs,
      pendingClubs,
      pendingRequests,
      openReports,
      upcomingEvents,
      totalAnnouncements,
    });
  } catch (err) {
    console.error("getOverview error:", err);
    res.status(500).json({ message: "Failed to load admin overview" });
  }
};

// GET /admin/users — list all users (admin only).
export const listUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const filter = q
      ? {
          $or: [
            { username: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
};

// PATCH /admin/users/:id/role — change a user's platform role.
// role "admin" is only honoured for emails on the ADMIN_EMAILS allow-list
// (checkAdminRole); otherwise the request is demoted to "student".
export const updateUserRole = async (req, res) => {
  try {
    const { role, adminTitle } = req.body || {};

    if (!["student", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (adminTitle && !["Head CR", "Head GR", "HOD"].includes(adminTitle)) {
      return res.status(400).json({ message: "Invalid adminTitle" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Never let an admin demote themselves out of the admin panel by accident.
    if (user._id.toString() === req.user.id && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const checked = checkAdminRole(user.email, role);
    user.role = checked.role;
    user.adminTitle =
      checked.role === "admin" ? checked.adminTitle || adminTitle || null : null;
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    res.json({ message: "User role updated", user: safe });
  } catch (err) {
    console.error("updateUserRole error:", err);
    res.status(500).json({ message: "Failed to update user role" });
  }
};
