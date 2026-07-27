import { Order } from "@/models/Order";
import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not signed in." }, { status: 401 });
    }

    await mongooseConnect();

    const orders = await Order.find({ customerId: session.user.id }).sort({ _id: -1 }).limit(50);
    const items = await backOrders.find({ orderId: { $in: orders.map((o) => o._id) } });

    const data = orders.map((order) => {
      const orderItems = items.filter((i) => String(i.orderId) === String(order._id));
      const hasShipped = orderItems.some((i) => !!i.trackingNumber);
      const isDelivered = orderItems.length > 0 && orderItems.every((i) => i.delivered);
      const isCancelled = order.status === "cancelled";

      return {
        _id: order._id,
        placedAt: order.createdAt,
        paid: order.Paid,
        status: order.status || "placed",
        address: [order.Address, order.City, order.State, order.Postalcode, order.Country]
          .filter(Boolean)
          .join(", "),
        items: orderItems.map((i) => ({
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
        total: orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        hasShipped,
        isDelivered,
        isCancelled,
        canCancel: order.Paid && !isCancelled && !hasShipped && !isDelivered,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch customer orders error:", error);
    return NextResponse.json({ message: "Error fetching orders." }, { status: 500 });
  }
};
