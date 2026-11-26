import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import { requireAdmin } from "../Middleware/requireRole.js";
import {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} from "../Controllers/AnnouncementController.js";

const router = express.Router();

// Students view global announcements + their clubs' announcements.
router.get("/", auth, listAnnouncements);

// Admins publish (text, links, attachments) and delete.
router.post("/", auth, requireAdmin, createAnnouncement);
router.delete("/:id", auth, requireAdmin, deleteAnnouncement);

export default router;
