import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import { searchPosts } from "../Controllers/PostController.js";
import {
  searchClubs,
  getTopClubs,
} from "../Controllers/ClubController.js";
import { searchUsers } from "../Controllers/UserController.js";

const router = express.Router();

router.get("/posts",auth,  searchPosts);
router.get("/clubs",auth,  searchClubs);
router.get("/users",auth, searchUsers);

router.get("/top-clubs", getTopClubs);

export default router;
