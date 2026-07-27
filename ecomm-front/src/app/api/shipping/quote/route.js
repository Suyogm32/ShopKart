import { product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { quoteShipping } from "@/lib/shipping";
import { buildItems, computeTotals } from "@/lib/pricing";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const POST = async (req) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Please sign in first." }, { status: 401 });
    }

    const { products: productIds, address } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ message: "Your cart is empty." }, { status: 400 });
    }
    if (!address?.address || !address?.city || !address?.postalcode || !address?.country) {
      return NextResponse.json({ message: "A complete address is required." }, { status: 400 });
    }

    await mongooseConnect();

    const uniqueIds = [...new Set(productIds.map(String))];
    const found = await product.find({ _id: { $in: uniqueIds } });
    const items = buildItems(productIds, found);

    if (!items.length) {
      return NextResponse.json({ message: "No valid products in cart." }, { status: 400 });
    }

    const shipping = await quoteShipping({
      items,
      addressTo: { ...address, name: session.user.name },
    });

    const totals = computeTotals({ items, shippingAmount: shipping.amount });

    return NextResponse.json({ ...totals, shippingBreakdown: shipping.breakdown });
  } catch (error) {
    console.error("Shipping quote error:", error);
    return NextResponse.json(
      { message: error.message || "Could not calculate shipping." },
      { status: 422 }
    );
  }
};
