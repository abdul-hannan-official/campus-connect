import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import User from "../Models/User.js";
import dotenv from "dotenv";
dotenv.config();

// Salt rounds for bcrypt. The original code passed the raw env string
// (e.g. "10") to bcrypt.hash, which bcryptjs rejects as an invalid salt.
const SALT_ROUNDS = parseInt(process.env.HASHING || "10", 10) || 10;

// Helper for JWT creation
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

// Admin allow-list (Keshav pattern, adapted for Campus Connect).
// ADMIN_EMAILS: comma-separated admin emails.
// ADMIN_TITLES: comma-separated titles aligned with ADMIN_EMAILS,
//   each one of "Head CR", "Head GR", "HOD" (same platform access).
// A user can only become admin by being on this list; requesting
// role "admin" in a signup body is ignored otherwise.
export const adminTitleForEmail = (email) => {
  const emails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const titles = (process.env.ADMIN_TITLES || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const idx = emails.indexOf((email || "").toLowerCase());
  if (idx === -1) return null;
  const title = titles[idx];
  return ["Head CR", "Head GR", "HOD"].includes(title) ? title : null;
};

export const checkAdminRole = (email, requestedRole) => {
  const title = adminTitleForEmail(email);
  if (title) return { role: "admin", adminTitle: title };
  // Prevent a manual "admin" role request when not whitelisted.
  return { role: requestedRole === "admin" ? "student" : requestedRole || "student", adminTitle: null };
};

// Unique username derived from an email prefix (for OAuth signups).
const uniqueUsernameForEmail = async (email) => {
  const base = (email.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30) || "user";
  let candidate = base;
  let n = 1;
  while (await User.exists({ username: candidate })) {
    candidate = `${base}${n}`;
    n += 1;
  }
  return candidate;
};

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check username
    const existingUserName = await User.findOne({ username });
    if (existingUserName)
      return res.status(400).json({ message: "Username already in use" });

    // Check email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail)
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const { role, adminTitle } = checkAdminRole(normalizedEmail, "student");

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashed,
      bio: "",
      avatarUrl: "",
      createdAt: new Date(),
      lastLogin: new Date(),
      karma: 0,
      role,
      adminTitle,
      authProvider: "local",
    });

    const token = createToken({ id: user._id, role: user.role });
    res.cookie("auth", token, cookieOptions());

    user.password = undefined;

    res.status(200).json({ message: "User created", user });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email: (email || "").trim().toLowerCase() });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // OAuth accounts have no local password.
    if (user.authProvider !== "local" || !user.password) {
      return res.status(400).json({
        message: `This account signs in with ${user.authProvider}. Please use "Continue with ${user.authProvider === "google" ? "Google" : "GitHub"}" instead.`,
      });
    }

    // CHECK IF PASSWORD IS HASHED
    let isHashed = false;

    if (typeof user.password === "string") {
      isHashed =
        user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$");
    }

    if (!isHashed) {
      console.log("Plaintext password detected. Auto-hashing now...");

      if (!user.password) {
        return res.status(500).json({
          message: "User password is missing in the database."
        });
      }

      const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
      user.password = hashed;
      await user.save();
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    // Re-apply the admin allow-list on every login (Keshav pattern).
    const { role, adminTitle } = checkAdminRole(user.email, user.role);
    if (role !== user.role || adminTitle !== user.adminTitle) {
      user.role = role;
      user.adminTitle = adminTitle;
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save();

    const token = createToken({ id: user._id, role: user.role });

    res.cookie("auth", token, cookieOptions());

    user.password = undefined;

    res.status(200).json({ message: "Logged in", user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("auth");
  res.json({ message: "Logged out" });
};

// ---------------------------------------------------------------------------
// GOOGLE SIGN-IN — ported from Keshav833/CampusConnect auth.controller.js
// (google-auth-library ID-token verification). No Passport, no domain check:
// any Google account may sign up. New users are created as students.
// ---------------------------------------------------------------------------
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export const googleAuth = async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(501).json({
        message: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID.",
      });
    }

    const { token: googleToken } = req.body;
    if (!googleToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;
    const normalizedEmail = (email || "").toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const { role, adminTitle } = checkAdminRole(normalizedEmail, "student");
      user = await User.create({
        username: await uniqueUsernameForEmail(normalizedEmail),
        email: normalizedEmail,
        bio: "",
        avatarUrl: picture || "",
        createdAt: new Date(),
        lastLogin: new Date(),
        karma: 0,
        role,
        adminTitle,
        authProvider: "google",
        googleId,
      });
    } else {
      // Link the Google identity to an existing account with the same email.
      if (!user.googleId) {
        user.googleId = googleId;
        if (user.authProvider === "local") user.authProvider = "google";
      }
      const { role, adminTitle } = checkAdminRole(user.email, user.role);
      user.role = role;
      user.adminTitle = adminTitle;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = createToken({ id: user._id, role: user.role });
    res.cookie("auth", token, cookieOptions());

    user.password = undefined;
    res.status(200).json({ message: "Logged in with Google", user });
  } catch (error) {
    console.error("Google Auth error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// ---------------------------------------------------------------------------
// GITHUB SIGN-IN — ported from Keshav833/CampusConnect auth.controller.js
// (plain axios OAuth flow). No Passport, no domain check: any verified
// GitHub email may sign up. New users are created as students.
// ---------------------------------------------------------------------------
export const githubAuth = (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CALLBACK_URL) {
    return res.status(501).json({
      message: "GitHub sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CALLBACK_URL.",
    });
  }
  const rootUrl = "https://github.com/login/oauth/authorize";
  const options = {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "user:email",
    state: "github_auth_state", // In production, use a dynamic secure state
  };

  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
};

export const githubCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=No code provided`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error("GitHub access token not found");
    }

    // 2. Fetch user profile
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { login: ghLogin, name, id: githubId, avatar_url } = userRes.data;

    // 3. Fetch primary verified email
    const emailsRes = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const primaryEmail =
      emailsRes.data.find((e) => e.primary && e.verified)?.email ||
      emailsRes.data[0]?.email;

    if (!primaryEmail) {
      throw new Error("GitHub primary email not found");
    }

    const normalizedEmail = primaryEmail.toLowerCase();

    // 4. Find or create the user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const { role, adminTitle } = checkAdminRole(normalizedEmail, "student");
      user = await User.create({
        username: await uniqueUsernameForEmail(normalizedEmail),
        email: normalizedEmail,
        bio: "",
        avatarUrl: avatar_url || "",
        createdAt: new Date(),
        lastLogin: new Date(),
        karma: 0,
        role,
        adminTitle,
        authProvider: "github",
        githubId: String(githubId),
      });
    } else {
      if (!user.githubId) {
        user.githubId = String(githubId);
      }
      const { role, adminTitle } = checkAdminRole(user.email, user.role);
      user.role = role;
      user.adminTitle = adminTitle;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = createToken({ id: user._id, role: user.role });
    res.cookie("auth", token, cookieOptions());
    return res.redirect(`${frontendUrl}/?github=success`);
  } catch (error) {
    console.error("GitHub Auth error:", error.message);
    res.redirect(`${frontendUrl}/login?error=GitHub authentication failed`);
  }
};
