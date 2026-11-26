import express from "express";
import { getMyJoinedClubs } from "../Controllers/MembershipController.js";

const router = express.Router();

router.get("/me", getMyJoinedClubs);

export default router;
