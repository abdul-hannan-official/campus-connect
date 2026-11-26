import {
  login,
  logout,
  signup,
  googleAuth,
  githubAuth,
  githubCallback,
} from "../Controllers/AuthController.js";
import express from "express";
import auth from "../Middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", auth, logout);
router.post("/signup", signup);

// Google sign-in: frontend sends the Google ID token, backend verifies it
// with google-auth-library and sets the same httpOnly "auth" cookie.
router.post("/google", googleAuth);

// GitHub sign-in: redirect to GitHub, then the callback sets the cookie
// and redirects back to the frontend.
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;
