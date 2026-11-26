import User from "../Models/User.js";
import Membership from "../Models/Membership.js";
import Club from "../Models/Club.js";

// All role checks load the user from the DB (the JWT only carries the id),
// so a role change takes effect on the next request.

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.currentUser = user;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Moderator of a specific club (by club name in req.params.name) OR a
// platform admin. Attaches req.club and req.currentUser.
// A moderator of Club A cannot moderate Club B — enforced here, not in UI.
export const requireClubModerator = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.role === "admin") {
      req.currentUser = user;
      req.isPlatformAdmin = true;
      next();
      return;
    }

    const clubName = (req.params.name || req.body.clubName || "").toLowerCase();
    let club = null;
    if (clubName) {
      club = await Club.findOne({ name: clubName });
    } else if (req.body.clubId) {
      club = await Club.findById(req.body.clubId);
    }

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const membership = await Membership.findOne({
      userId: user._id,
      clubId: club._id,
    });

    if (!membership || membership.role !== "moderator") {
      return res.status(403).json({
        message: "Only a moderator of this club (or an admin) can do this",
      });
    }

    req.currentUser = user;
    req.club = club;
    next();
  } catch (err) {
    console.error("requireClubModerator error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Any logged-in user whose global role is admin OR who is a moderator of
// the club that owns the given post/comment. Used by delete/pin endpoints
// that receive a post id instead of a club name.
export const canModeratePost = async (userId, post) => {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, user: null };
  if (user.role === "admin") return { allowed: true, user };
  if (!post) return { allowed: false, user };
  const membership = await Membership.findOne({
    userId: user._id,
    clubId: post.clubId,
  });
  return { allowed: membership?.role === "moderator", user };
};
