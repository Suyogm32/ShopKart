import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

let cachedConnection = null;

export function mongooseConnect() {
  const uri = process.env.MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  }

  // Cache the in-flight connection promise itself, not just the readyState —
  // otherwise many concurrent requests (e.g. during a load test) can each
  // start their own connect() call instead of sharing one.
  if (!cachedConnection) {
    cachedConnection = mongoose.connect(uri, {
      maxPoolSize: 10,
    });
  }

  return cachedConnection;
}
