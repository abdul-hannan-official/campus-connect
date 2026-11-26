import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import { requireAdmin } from "../Middleware/requireRole.js";
import {
  listClubRequests,
  approveClubRequest,
  rejectClubRequest,
} from "../Controllers/ClubRequestController.js";

const router = express.Router();

// Students list their own requests; admins list all (?status=pending).
router.get("/", auth, listClubRequests);

// Admin approve / reject.
router.post("/:id/approve", auth, requireAdmin, approveClubRequest);
router.post("/:id/reject", auth, requireAdmin, rejectClubRequest);

export default router;
