import mongoose from "mongoose";

// Cached MongoDB connection.
//
// Local dev (`node server.js`) connects once at boot. On Vercel serverless
// the function instance may be reused across invocations ("warm" starts),
// so the connection (and its in-flight promise) is cached on globalThis to
// avoid opening a new connection — and a new Atlas connection pool — on
// every request.
const cache = globalThis.__campusConnectMongoose || {
  conn: null,
  promise: null,
};
globalThis.__campusConnectMongoose = cache;

export async function connectDB(uri) {
  if (cache.conn) return cache.conn;

  if (!uri) {
    throw new Error(
      "MONGO_URI is not set. Set it to your MongoDB Atlas connection " +
        "string (backend/.env locally, or the Vercel dashboard for the " +
        "deployed backend)."
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri)
      .then((m) => m)
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectDB;
