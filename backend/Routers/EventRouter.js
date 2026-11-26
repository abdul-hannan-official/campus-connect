import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  listRegistrations,
} from "../Controllers/EventController.js";

const router = express.Router();

// ?filter=upcoming (default) | past | all, optional ?clubId=
router.get("/", auth, listEvents);
router.get("/:id", auth, getEvent);

// Admins, or moderators of the event's club.
router.post("/", auth, createEvent);
router.patch("/:id", auth, updateEvent);
router.post("/:id/cancel", auth, cancelEvent);
router.delete("/:id", auth, deleteEvent);

// Students register / unregister; organisers list registrations.
router.post("/:id/register", auth, registerForEvent);
router.delete("/:id/register", auth, unregisterFromEvent);
router.get("/:id/registrations", auth, listRegistrations);

export default router;
