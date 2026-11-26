import Report from "../Models/Report.js";
import Post from "../Models/Post.js";
import Comment from "../Models/Comment.js";
import Membership from "../Models/Membership.js";
import User from "../Models/User.js";

// FILE A REPORT (any logged-in student)
// Body: { postId, commentId?, reason, details? }
export const createReport = async (req, res) => {
  try {
    const { postId, commentId, reason, details } = req.body || {};

    if (!postId || !reason) {
      return res.status(400).json({ message: "postId and reason are required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
    }

    const existing = await Report.findOne({
      reporter: req.user.id,
      post: postId,
      status: "open",
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already reported this post" });
    }

    const report = await Report.create({
      reporter: req.user.id,
      post: postId,
      comment: commentId || null,
      reason,
      details: details || "",
    });

    res.status(201).json(report);
  } catch (err) {
    console.error("createReport error:", err);
    res.status(500).json({ message: "Failed to file report" });
  }
};

// LIST REPORTS — the moderation queue.
// Admins see everything (?status=open|resolved). Club moderators pass
// ?clubId=<id> and see only reports for posts in that club.
export const listReports = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    let reports = await Report.find(filter)
      .populate("reporter", "username")
      .populate("post", "title clubId authorId isRemoved")
      .populate("comment", "content isRemoved")
      .sort({ createdAt: -1 });

    if (user.role !== "admin") {
      // Moderator: only reports whose post belongs to a club they moderate.
      const memberships = await Membership.find({
        userId: user._id,
        role: "moderator",
      }).select("clubId");
      const clubIds = new Set(memberships.map((m) => m.clubId.toString()));

      if (req.query.clubId) {
        if (!clubIds.has(req.query.clubId)) {
          return res
            .status(403)
            .json({ message: "You do not moderate this club" });
        }
        reports = reports.filter(
          (r) => r.post?.clubId?.toString() === req.query.clubId
        );
      } else {
        reports = reports.filter((r) =>
          clubIds.has(r.post?.clubId?.toString())
        );
      }
    } else if (req.query.clubId) {
      reports = reports.filter(
        (r) => r.post?.clubId?.toString() === req.query.clubId
      );
    }

    res.json(reports);
  } catch (err) {
    console.error("listReports error:", err);
    res.status(500).json({ message: "Failed to load reports" });
  }
};

// RESOLVE A REPORT (club moderator of that post's club, or admin)
// Body: { action: "dismiss" | "remove_post" | "remove_comment" }
export const resolveReport = async (req, res) => {
  try {
    const { action } = req.body || {};

    const report = await Report.findById(req.params.id).populate("post");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.status !== "open") {
      return res.status(400).json({ message: "Report already resolved" });
    }

    const user = await User.findById(req.user.id);
    const isAdmin = user?.role === "admin";
    let isClubModerator = false;
    if (!isAdmin && report.post) {
      const membership = await Membership.findOne({
        userId: user._id,
        clubId: report.post.clubId,
        role: "moderator",
      });
      isClubModerator = !!membership;
    }

    if (!isAdmin && !isClubModerator) {
      return res
        .status(403)
        .json({ message: "Only a moderator of this club or an admin can resolve reports" });
    }

    if (action === "remove_post" && report.post) {
      await Post.findByIdAndUpdate(report.post._id, { isRemoved: true });
    } else if (action === "remove_comment" && report.comment) {
      await Comment.findByIdAndUpdate(report.comment, { isRemoved: true });
    } else if (action !== "dismiss" && action !== undefined) {
      return res.status(400).json({ message: "Invalid action" });
    }

    report.status = "resolved";
    report.resolvedBy = user._id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ message: "Report resolved", report });
  } catch (err) {
    console.error("resolveReport error:", err);
    res.status(500).json({ message: "Failed to resolve report" });
  }
};
