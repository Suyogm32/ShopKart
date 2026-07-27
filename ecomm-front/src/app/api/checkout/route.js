import { product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { Order } from "@/models/Order";
import { backOrders } from "@/models/Backorders";
import { auth } from "@/auth";
import { quoteShipping } from "@/lib/shipping";
import { buildItems, computeTotals } from "@/lib/pricing";

const stripe = require("stripe")(process.env.STRIPE_SK);

// One backOrders row per line item, so each seller sees only their own part
// of a multi-seller order.
async function createAggregatedDocument(items, currentOrder) {
  const aggregatedDocuments = items.map(({ product: p, quantity }) => ({
    productName: p.productName,
    quantity,
    price: p.price,
    address: `${currentOrder.Address}, ${currentOrder.City}, ${currentOrder.State}, ${currentOrder.Country}`,
    city: currentOrder.City,
    postalCode: currentOrder.Postalcode,
    paid: currentOrder.Paid,
    sellerId: p.sellerId,
    orderId: currentOrder._id,
    delivered: false,
  }));

  await backOrders.insertMany(aggregatedDocuments);
}

export const POST = async (req) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Please sign in to complete checkout." }, { status: 401 });
    }

    await mongooseConnect();

    const { Name, Address, City, Postalcode, State, Country, products: productIds } =
      await req.json();

    // Email always comes from the authenticated session, never the request body —
    // otherwise a customer could place an order under someone else's email.
    const Email = session.user.email;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ message: "Your cart is empty." }, { status: 400 });
    }
    if (!Address || !City || !Postalcode || !Country) {
      return NextResponse.json({ message: "A complete address is required." }, { status: 400 });
    }

    const uniqueIds = [...new Set(productIds.map(String))];
    const productsInfo = await product.find({ _id: { $in: uniqueIds } });
    const items = buildItems(productIds, productsInfo);

    if (!items.length) {
      return NextResponse.json({ message: "No valid products in cart." }, { status: 400 });
    }

    // Shipping and tax are recalculated here rather than trusted from the
    // browser — the quote endpoint is for display, this is what gets charged.
    const shipping = await quoteShipping({
      items,
      addressTo: { address: Address, city: City, postalcode: Postalcode, state: State, country: Country, name: Name },
    });
    const totals = computeTotals({ items, shippingAmount: shipping.amount });

    const line_items = items.map(({ product: p, quantity }) => ({
      quantity,
      price_data: {
        currency: "usd",
        product_data: { name: p.productName },
        // Per-unit amount. Stripe multiplies this by quantity itself.
        unit_amount: Math.round(p.price * 100),
      },
    }));

    if (totals.shipping > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(totals.shipping * 100),
        },
      });
    }

    if (totals.tax > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: `Sales tax (${(totals.taxRate * 100).toFixed(2)}%)` },
          unit_amount: Math.round(totals.tax * 100),
        },
      });
    }

    const currentOrder = new Order({
      line_items,
      Name,
      Email,
      Address,
      City,
      Postalcode,
      State,
      Country,
      Paid: false,
      customerId: session.user.id,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
    });
    await currentOrder.save();

    const paymentsession = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      customer_email: Email,
      success_url: process.env.URL + "cart/success/" + currentOrder._id,
      cancel_url: process.env.URL + "cart/canceled",
      metadata: { orderId: currentOrder._id.toString() },
    });

    await createAggregatedDocument(items, currentOrder);

    return NextResponse.json({ url: paymentsession.url, orderId: currentOrder._id }, { status: 201 });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: error.message || "Error creating payment session." },
      { status: 500 }
    );
  }
};
