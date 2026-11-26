import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import {
  createReport,
  listReports,
  resolveReport,
} from "../Controllers/ReportController.js";

const router = express.Router();

// File a report against a post (optionally a comment under it).
router.post("/", auth, createReport);

// Moderation queue: admins see all, club moderators see their clubs'
// reports (?clubId=...&status=open).
router.get("/", auth, listReports);

// Resolve: { action: "dismiss" | "remove_post" | "remove_comment" }
router.post("/:id/resolve", auth, resolveReport);

export default router;
