import Club from "../Models/Club.js";
import ClubRequest from "../Models/ClubRequest.js";
import Membership from "../Models/Membership.js";
import User from "../Models/User.js";

// LIST CLUB REQUESTS
// Admins see all requests (optionally filtered with ?status=pending).
// Students see only their own requests.
// NOTE: the plain `auth` middleware only sets req.user (the JWT payload);
// req.currentUser is only set by requireRole, so the admin check must be
// done here against the database.
export const listClubRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("role");
    const isAdmin = user?.role === "admin";
    const filter = {};
    if (!isAdmin) {
      filter.user = req.user.id;
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await ClubRequest.find(filter)
      .populate("user", "username email")
      .populate("club", "name title description createdAt status")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("listClubRequests error:", err);
    res.status(500).json({ message: "Failed to load club requests" });
  }
};

// APPROVE A CLUB REQUEST (admin only)
// The club becomes "approved" (visible in Explore) and the requester
// stays its moderator, as set at creation time.
export const approveClubRequest = async (req, res) => {
  try {
    const request = await ClubRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Club request not found" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Request was already ${request.status}` });
    }

    request.status = "approved";
    await request.save();

    await Club.findByIdAndUpdate(request.club, { status: "approved" });

    return res.json({ message: "Club approved", request });
  } catch (err) {
    console.error("approveClubRequest error:", err);
    res.status(500).json({ message: "Failed to approve club request" });
  }
};

// REJECT A CLUB REQUEST (admin only)
// The club is marked "rejected" (hidden) and the requester's membership
// is removed, so the name can be requested again later.
export const rejectClubRequest = async (req, res) => {
  try {
    const request = await ClubRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Club request not found" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Request was already ${request.status}` });
    }

    request.status = "rejected";
    await request.save();

    await Club.findByIdAndUpdate(request.club, { status: "rejected" });
    await Membership.deleteMany({
      clubId: request.club,
      userId: request.user,
    });

    return res.json({ message: "Club request rejected", request });
  } catch (err) {
    console.error("rejectClubRequest error:", err);
    res.status(500).json({ message: "Failed to reject club request" });
  }
};
