import express from "express";
import {
  createClub,
  getClubByName,
  deleteClub,
  joinClub,
  getUserClubs,
  leaveClub,
  getAllClubs,
  getMembershipStatus,
  updateClub,
  getClubMembers,
  assignModerator,
  removeModerator,
} from "../Controllers/ClubController.js";

import auth from "../Middleware/AuthMiddleware.js";
import { requireAdmin } from "../Middleware/requireRole.js";

const router = express.Router();

router.get("/users/:id", getUserClubs);

//specific routes first
router.get("/:name/membership", getMembershipStatus);
router.post("/:name/join", joinClub);
router.delete("/:name/leave", leaveClub);
router.patch("/:name", updateClub);

// Members + moderator management (admin only for assignment)
router.get("/:name/members", auth, getClubMembers);
router.post("/:name/moderators", auth, requireAdmin, assignModerator);
router.delete("/:name/moderators", auth, requireAdmin, removeModerator);

//generic routes after
router.post("/", createClub);
router.get("/", getAllClubs);
router.get("/:name", getClubByName);
router.delete("/:name", deleteClub);

export default router;
