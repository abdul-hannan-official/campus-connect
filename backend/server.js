// Local-dev entry point: `node server.js` (or `npm run dev`).
// Builds the shared Express app (see app.js), connects to MongoDB, attaches
// real Socket.io for DMs/notifications, and listens on PORT.
// The Vercel serverless entry (api/index.js) uses the same app without
// app.listen and without Socket.io.
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import { createApp } from "./app.js";
import { connectDB } from "./db.js";

// load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;

// mongo — refuse to boot without a database URL, with a clear message.
if (!process.env.MONGO_URI) {
  console.error(
    "ERROR: MONGO_URI is not set. Create backend/.env from .env.example " +
      "and set MONGO_URI to your MongoDB Atlas (or local) connection string."
  );
  process.exit(1);
}

await connectDB(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.log("MongoDB connection error:", err);
    process.exit(1);
  });

// http server + Socket.io (persistent connections work in local dev).
const server = http.createServer();

export const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "http://localhost:5173"
        : true,
    credentials: true,
  },
});

// online users map
export const onlineUsers = new Map();

// The shared app, wired with the real Socket.io instance.
const app = createApp({ io, onlineUsers });
server.on("request", app);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} is offline`);
        break;
      }
    }
  });
});

// start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
