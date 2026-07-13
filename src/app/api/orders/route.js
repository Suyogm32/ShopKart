import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);

    // Pagination — defaults to page 1, 20 per page, capped at 100 to prevent abuse
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit")) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // Only return orders belonging to the authenticated seller
    const filter = { sellerId: session.user.id };
    const [orders, total] = await Promise.all([
      backOrders.find(filter).sort({ _id: -1 }).skip(skip).limit(limit),
      backOrders.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        data: orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ message: "Error fetching orders." }, { status: 500 });
  }
});
