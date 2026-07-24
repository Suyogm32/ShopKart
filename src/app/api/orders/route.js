import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { Order } from "@/models/Order";
import { DeliveryAgent } from "@/models/DeliveryAgent";

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit")) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    const baseFilter = { sellerId: session.user.id };
    const filter = { ...baseFilter };
    if (status === "unpaid") filter.paid = { $ne: true };
    else if (status === "processing") {
      filter.paid = true;
      filter.delivered = { $ne: true };
    } else if (status === "delivered") filter.delivered = true;

    const [orders, total, unpaidCount, processingCount, deliveredCount] = await Promise.all([
      backOrders
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderId", "Name Email Address Postalcode State Country")
        .populate("deliveryAgent", "name phone"),
      backOrders.countDocuments(baseFilter),
      backOrders.countDocuments({ ...baseFilter, paid: { $ne: true } }),
      backOrders.countDocuments({ ...baseFilter, paid: true, delivered: { $ne: true } }),
      backOrders.countDocuments({ ...baseFilter, delivered: true }),
    ]);

    return NextResponse.json(
      {
        data: orders,
        pagination: {
          page,
          limit,
          total: status ? await backOrders.countDocuments(filter) : total,
          totalPages:
            Math.ceil((status ? await backOrders.countDocuments(filter) : total) / limit) || 1,
        },
        statusCounts: {
          all: total,
          unpaid: unpaidCount,
          processing: processingCount,
          delivered: deliveredCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ message: "Error fetching orders." }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, _context, session) => {
  try {
    const { _id, paid, delivered, deliveryAgent } = await req.json();
    if (!_id) {
      return NextResponse.json({ message: "Order id is required." }, { status: 400 });
    }

    await mongooseConnect();
    const update = {};
    if (typeof paid === "boolean") update.paid = paid;
    if (typeof delivered === "boolean") update.delivered = delivered;
    if (deliveryAgent !== undefined) update.deliveryAgent = deliveryAgent || null;

    const updated = await backOrders.updateOne(
      { _id, sellerId: session.user.id },
      { $set: update }
    );

    if (updated.matchedCount === 0) {
      return NextResponse.json({ message: "Order not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ message: "Order updated." }, { status: 200 });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ message: "Error updating order." }, { status: 500 });
  }
});
