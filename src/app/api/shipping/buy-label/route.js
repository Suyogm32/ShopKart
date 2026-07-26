import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { buyLabel } from "@/lib/shipping";

export const POST = withAuth(async (req, _context, session) => {
  try {
    const { orderId, rateId, provider, service } = await req.json();
    if (!orderId || !rateId) {
      return NextResponse.json({ message: "Order id and rate id are required." }, { status: 400 });
    }

    await mongooseConnect();
    const order = await backOrders.findOne({ _id: orderId, sellerId: session.user.id });
    if (!order) {
      return NextResponse.json({ message: "Order not found or access denied." }, { status: 404 });
    }

    const label = await buyLabel({ rateId });

    order.shippingCarrier = provider || null;
    order.shippingService = service || null;
    order.trackingNumber = label.trackingNumber;
    order.labelUrl = label.labelUrl;
    order.shippoTransactionId = label.transactionId;
    order.shippingStatus = label.trackingStatus;
    await order.save();

    return NextResponse.json({
      trackingNumber: order.trackingNumber,
      carrier: order.shippingCarrier,
      service: order.shippingService,
      labelUrl: order.labelUrl,
    });
  } catch (error) {
    console.error("Buy label error:", error);
    return NextResponse.json(
      { message: error.message || "Error purchasing shipping label." },
      { status: 500 }
    );
  }
});