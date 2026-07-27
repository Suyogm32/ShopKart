import { Order } from "@/models/Order";
import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";

const stripe = require("stripe")(process.env.STRIPE_SK);

export const POST = async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`cancel:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const { orderId, email } = await req.json();
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId.trim())) {
      return NextResponse.json({ message: "A valid order ID is required." }, { status: 400 });
    }

    await mongooseConnect();

    // Signed-in customers are matched on ownership; guests fall back to the
    // order-ID + email pair.
    const session = await auth();
    const order = session?.user?.id
      ? await Order.findOne({ _id: orderId.trim(), customerId: session.user.id })
      : await Order.findOne({
          _id: orderId.trim(),
          Email: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ message: "This order is already cancelled." }, { status: 409 });
    }

    const items = await backOrders.find({ orderId: order._id });

    if (items.some((i) => !!i.trackingNumber)) {
      return NextResponse.json(
        { message: "This order has already shipped and can no longer be cancelled." },
        { status: 409 }
      );
    }

    if (items.length > 0 && items.every((i) => i.delivered)) {
      return NextResponse.json(
        { message: "This order has already been delivered." },
        { status: 409 }
      );
    }

    // Refund first — if Stripe fails we don't want a cancelled order with the
    // customer's money still taken.
    let refundId = null;
    if (order.Paid) {
      if (!order.paymentIntentId) {
        return NextResponse.json(
          {
            message:
              "This order can't be refunded automatically. Please contact support to cancel it.",
          },
          { status: 422 }
        );
      }
      const refund = await stripe.refunds.create({ payment_intent: order.paymentIntentId });
      refundId = refund.id;
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    if (refundId) order.refundId = refundId;
    await order.save();

    await backOrders.updateMany({ orderId: order._id }, { $set: { cancelled: true } });

    return NextResponse.json({
      message: order.Paid
        ? "Order cancelled. Your refund is on its way and usually lands within 5-10 business days."
        : "Order cancelled.",
      refunded: !!refundId,
    });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json({ message: "Error cancelling order." }, { status: 500 });
  }
};
