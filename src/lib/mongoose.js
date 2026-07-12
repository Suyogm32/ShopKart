import mongoose from "mongoose";
import dns from "dns";

// See src/lib/mongodb.js for why this is needed.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export function mongooseConnect() {
  const uri = process.env.MONGODB_URI;
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  } else {
    return mongoose.connect(uri);
  }
}
