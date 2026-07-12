import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();

    // Only return orders belonging to the authenticated seller
    const orders = await backOrders.find({ sellerId: session.user.id });
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ message: "Error fetching orders." }, { status: 500 });
  }
});
