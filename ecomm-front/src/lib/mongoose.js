import mongoose from "mongoose";

let cachedConnection = null;

export function mongooseConnect() {
  const uri = process.env.MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  }

  if (!cachedConnection) {
    cachedConnection = mongoose.connect(uri, {
      maxPoolSize: 10,
    });
  }

  return cachedConnection;
}
