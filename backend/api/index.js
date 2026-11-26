// Vercel serverless entry for the Campus Connect backend.
//
// The backend Vercel project has its root directory set to `backend/`, so
// this file becomes the serverless function at /api/index. The project's
// vercel.json rewrites every request to it, and the Express app handles the
// routing from the original URL.
//
// Differences from local dev (backend/server.js):
//   - No app.listen — Vercel invokes this handler per request.
//   - No Socket.io — serverless functions have no persistent connection.
//     The app is built with a no-op `io` (see app.js): DM/notification REST
//     endpoints still work, only the real-time push is skipped.
//   - The MongoDB connection is cached across warm invocations (see db.js).
//   - Env vars come from the Vercel dashboard, not a .env file.
import { createApp, noopIo } from "../app.js";
import { connectDB } from "../db.js";

// Build the app once per function instance (reused on warm starts).
const app = createApp({ io: noopIo, onlineUsers: new Map() });

export default async function handler(req, res) {
  try {
    await connectDB(process.env.MONGO_URI);
  } catch (err) {
    console.error("Database connection failed:", err.message);
    return res.status(500).json({
      message:
        "Database is not configured. Set MONGO_URI in the Vercel dashboard " +
        "(backend project) to a MongoDB Atlas connection string.",
    });
  }

  // Hand the request to Express.
  return app(req, res);
}
