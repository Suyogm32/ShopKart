import { Order } from "@/models/Order";
import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const POST = async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`lookup:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many lookups. Please try again in a minute." },
        { status: 429 }
      );
    }

    const { orderId, email } = await req.json();
    if (!orderId || !email) {
      return NextResponse.json(
        { message: "Order ID and email are both required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(orderId.trim())) {
      return NextResponse.json({ message: "That order ID doesn't look right." }, { status: 400 });
    }

    await mongooseConnect();

    // Both must match — the order ID alone isn't a secret worth trusting.
    const order = await Order.findOne({
      _id: orderId.trim(),
      Email: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });

    if (!order) {
      return NextResponse.json(
        { message: "No order found with that ID and email combination." },
        { status: 404 }
      );
    }

    const items = await backOrders.find({ orderId: order._id });

    const hasShipped = items.some((i) => !!i.trackingNumber);
    const isDelivered = items.length > 0 && items.every((i) => i.delivered);
    const isCancelled = order.status === "cancelled";

    return NextResponse.json({
      order: {
        _id: order._id,
        name: order.Name,
        email: order.Email,
        paid: order.Paid,
        status: order.status || "placed",
        placedAt: order.createdAt,
        cancelledAt: order.cancelledAt,
        address: [order.Address, order.City, order.State, order.Postalcode, order.Country]
          .filter(Boolean)
          .join(", "),
      },
      items: items.map((i) => ({
        _id: i._id,
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        carrier: i.shippingCarrier,
        service: i.shippingService,
        trackingNumber: i.trackingNumber,
        shippingStatus: i.shippingStatus,
        delivered: i.delivered,
      })),
      summary: {
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        hasShipped,
        isDelivered,
        isCancelled,
        // Cancellable only while nothing has shipped and it isn't already done.
        canCancel: order.Paid && !isCancelled && !hasShipped && !isDelivered,
      },
    });
  } catch (error) {
    console.error("Order lookup error:", error);
    return NextResponse.json({ message: "Error looking up order." }, { status: 500 });
  }
};
