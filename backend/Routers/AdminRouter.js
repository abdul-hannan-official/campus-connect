import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import { requireAdmin } from "../Middleware/requireRole.js";
import {
  getOverview,
  listUsers,
  updateUserRole,
} from "../Controllers/AdminController.js";

const router = express.Router();

// All routes here are admin-only (Head CR, Head GR, HOD share access).
router.use(auth, requireAdmin);

router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);

export default router;
