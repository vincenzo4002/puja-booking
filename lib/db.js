import mongoose from "mongoose";

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/puja_dashboard";

// Cache the connection across hot reloads in dev and across invocations.
let cached = globalThis._mongooseCache;
if (!cached) cached = globalThis._mongooseCache = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
