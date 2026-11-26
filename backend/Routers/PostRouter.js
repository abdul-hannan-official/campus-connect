import express from "express";
import auth from "../Middleware/AuthMiddleware.js";
import {
  getPostableClubs,
  createPost,
  searchPosts,
  getPostById,
  getPersonalizedFeed,
  getPopularPosts,
  getUserPosts,
  deletePost,
  getPostsByClub,
  getGuestFeed,
  editPost,
  getSavedPosts,
  savePost,
  unsavePost,
  pinPost,
  unpinPost,
} from "../Controllers/PostController.js";

import {
  getCommentsForPost,
  createComment,
} from "../Controllers/CommentController.js";

const router = express.Router();

router.get("/clubs", auth, getPostableClubs);

// Create a new post
router.post("/", auth, createPost);

router.get("/club/:name",auth, getPostsByClub);

// Get personalized feed
router.get("/feed/me",auth, getPersonalizedFeed);

router.get("/feed/guest", getGuestFeed);

router.get("/popular", getPopularPosts);

// Create a top-level comment under a post
router.post("/:postId/comments", auth, createComment);

// Get all comments for a post
router.get("/:postId/comments", auth, getCommentsForPost);

router.get("/search", auth, searchPosts);

// Get user posts
router.get("/users/:id", auth, getUserPosts);
router.get("/saved",auth,getSavedPosts);

//delete post
router.delete("/:id", auth, deletePost);

//Edit post
router.put("/:id", auth, editPost);

// Must stay last
router.get("/:postId", auth, getPostById);

//save
router.patch("/save/:id",auth,savePost);
router.patch("/unsave/:id",auth,unsavePost)

//pin / unpin (club moderator or admin)
router.post("/:id/pin", auth, pinPost);
router.post("/:id/unpin", auth, unpinPost);

export default router;
