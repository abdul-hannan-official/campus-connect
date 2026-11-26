import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import auth from "./Middleware/AuthMiddleware.js";

import AuthRouter from "./Routers/AuthRouter.js";
import ClubRouter from "./Routers/ClubRouter.js";
import UserRouter from "./Routers/UserRouter.js";
import PostRouter from "./Routers/PostRouter.js";
import SearchRouter from "./Routers/SearchRouter.js";
import UploadRouter from "./Routers/UploadRouter.js";
import AiSummaryRouter from "./Routers/AiSummaryRouter.js";
import CommentRouter from "./Routers/CommentRouter.js";
import DMRouter from "./Routers/DMRouter.js";
import VoteRouter from "./Routers/VoteRouter.js";
import MembershipRouter from "./Routers/MembershipRouter.js";
import NotificationRouter from "./Routers/NotificationRouter.js";
import ClubRequestRouter from "./Routers/ClubRequestRouter.js";
import ReportRouter from "./Routers/ReportRouter.js";
import AnnouncementRouter from "./Routers/AnnouncementRouter.js";
import EventRouter from "./Routers/EventRouter.js";
import AdminRouter from "./Routers/AdminRouter.js";

// Load env vars (local .env; on Vercel the dashboard values take precedence).
dotenv.config();

// No-op Socket.io stand-in for serverless mode.
//
// Socket.io needs a persistent connection, which Vercel serverless
// functions do not provide (see README "Deployment"). The DM and
// notification REST endpoints still work without it: messages and
// notifications are saved to MongoDB, only the real-time push is skipped.
// Local dev passes the real `io` object; the serverless entry passes this.
export const noopIo = {
  to: () => ({ emit: () => {} }),
  emit: () => {},
};

// Build the Express app. Shared by both entries:
//   - backend/server.js   (local dev: http server + real Socket.io + listen)
//   - backend/api/index.js (Vercel serverless: no listen, noop io)
// The caller supplies `io` and `onlineUsers`; serverless passes noopIo and
// a fresh Map.
export function createApp({ io, onlineUsers }) {
  const app = express();

  // Uploaded files, served locally in dev. On Vercel the files do not
  // persist (see README); with Cloudinary configured the upload routes
  // return absolute Cloudinary URLs instead.
  app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

  // body + cookies
  app.use(express.json());
  app.use(cookieParser());

  // cors
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "http://localhost:5173"]
      : ["http://localhost:5173", "http://localhost:5174"];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  // Health check (useful for Vercel / uptime checks; no DB needed).
  app.get("/health", (req, res) => res.json({ ok: true }));

  // routes
  app.use("/authentication", AuthRouter);
  app.use("/posts", PostRouter); //internal auth
  app.use("/users", auth, UserRouter);
  app.use("/votes", auth, VoteRouter);
  app.use("/clubs", auth, ClubRouter);
  app.use("/club-requests", auth, ClubRequestRouter);
  app.use("/reports", ReportRouter);
  app.use("/announcements", AnnouncementRouter);
  app.use("/events", EventRouter);
  app.use("/admin", AdminRouter);
  app.use("/search", SearchRouter); //internal auth
  app.use("/upload", auth, UploadRouter);
  app.use("/ai-summary", auth, AiSummaryRouter);
  app.use("/comments", auth, CommentRouter);
  app.use("/memberships", auth, MembershipRouter);

  // socket-aware routes (DMs + notifications). With noopIo the REST
  // endpoints work and the real-time emit is a no-op.
  app.use("/dm", auth, DMRouter({ io, onlineUsers }));
  app.use("/notifications", auth, NotificationRouter({ io, onlineUsers }));

  return app;
}

export default createApp;
