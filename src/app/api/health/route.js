import { mongooseConnect } from "@/lib/mongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// Never cache a health check — a cached "ok" is worse than no check at all.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await mongooseConnect();
    // readyState 1 === connected. Being able to import mongoose isn't the same
    // as being able to reach the database.
    const dbUp = mongoose.connection.readyState === 1;

    if (!dbUp) {
      return NextResponse.json(
        { status: "degraded", database: "disconnected" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "connected",
      uptimeSeconds: Math.round(process.uptime()),
      responseMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}