import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { backOrders } from "@/models/Backorders";
import { sendOrderConfirmationEmail } from "../success/SendMail";

const stripe = require("stripe")(process.env.STRIPE_SK);

export const POST = async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      try {
        await mongooseConnect();
        await Order.updateOne({ _id: orderId }, { Paid: true });
        await backOrders.updateMany({ orderId }, { $set: { paid: true } });

        const order = await Order.findById(orderId);
        if (order) {
          await sendOrderConfirmationEmail(order.Email, order._id, order.Name, order.line_items);
        }
      } catch (error) {
        console.error("Error processing checkout.session.completed webhook:", error);
        return NextResponse.json({ message: "Error updating order" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
};
