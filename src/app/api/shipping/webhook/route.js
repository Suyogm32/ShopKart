import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongoose";
import { backOrders } from "@/models/Backorders";

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (token !== process.env.SHIPPO_WEBHOOK_TOKEN) {
    console.error("Shippo webhook: invalid or missing token");
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  if (payload.event !== "track_updated") {
    // Acknowledge and ignore event types we don't act on (yet).
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const trackingNumber = payload.data?.tracking_number;
  const status = payload.data?.tracking_status?.status;

  if (!trackingNumber || !status) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    await mongooseConnect();
    const update = { shippingStatus: status };
    if (status === "DELIVERED") {
      update.delivered = true;
    }
    await backOrders.updateOne({ trackingNumber }, { $set: update });
  } catch (error) {
    console.error("Shippo webhook processing error:", error);
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}