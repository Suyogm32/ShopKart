import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, _context, session) => {
  await mongooseConnect();
  const missing = await backOrders.find({
    sellerId: session.user.id,
    createdAt: { $exists: false },
  });

  for (const order of missing) {
    const ts = order._id.getTimestamp();
    await backOrders.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: ts, updatedAt: ts } }
    );
  }

  return NextResponse.json({ fixed: missing.length });
});