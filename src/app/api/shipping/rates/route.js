import { backOrders } from "@/models/Backorders";
import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { getRates } from "@/lib/shipping";

// Demo-scale default parcel — no per-product weight/dimensions captured yet,
// so every shipment is rated as if it were this one box size.
const DEFAULT_PARCEL = {
  length: "10",
  width: "8",
  height: "4",
  distance_unit: "in",
  weight: "2",
  mass_unit: "lb",
};

// Carriers expect ISO-3166 alpha-2 codes; our address fields are free text.
const COUNTRY_CODES = {
  us: "US",
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  ca: "CA",
  canada: "CA",
  in: "IN",
  india: "IN",
};

const toCountryCode = (value) => {
  if (!value) return "";
  const key = value.trim().toLowerCase();
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key];
  return value.trim().length === 2 ? value.trim().toUpperCase() : "";
};

export const POST = withAuth(async (req, _context, session) => {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ message: "Order id is required." }, { status: 400 });
    }

    await mongooseConnect();

    const [order, seller] = await Promise.all([
      backOrders
        .findOne({ _id: orderId, sellerId: session.user.id })
        .populate("orderId", "Name Email Address City Postalcode State Country"),
      User.findById(session.user.id).select(
        "name storeName address city postalcode state country phone email"
      ),
    ]);

    if (!order) {
      return NextResponse.json({ message: "Order not found or access denied." }, { status: 404 });
    }

    const addressFrom = {
      name: seller?.storeName || seller?.name || "Seller",
      street1: seller?.address || "",
      city: seller?.city || "",
      state: seller?.state || "",
      zip: seller?.postalcode || "",
      country: toCountryCode(seller?.country),
      email: seller?.email || process.env.SHIP_FROM_EMAIL,
      phone: seller?.phone || process.env.SHIP_FROM_PHONE,
    };

    if (!addressFrom.street1 || !addressFrom.city || !addressFrom.zip || !addressFrom.country) {
      return NextResponse.json(
        {
          message:
            "Your pickup address is incomplete. Add it under Settings → Pickup address before fetching rates.",
        },
        { status: 422 }
      );
    }

    const addressTo = {
      name: order.orderId?.Name || "Customer",
      street1: order.orderId?.Address || order.address || "",
      city: order.city || order.orderId?.City || "",
      state: order.orderId?.State || "",
      zip: order.postalCode || order.orderId?.Postalcode || "",
      country: toCountryCode(order.orderId?.Country),
    };

    if (!addressTo.street1 || !addressTo.city || !addressTo.zip || !addressTo.country) {
      return NextResponse.json(
        {
          message:
            "This order's delivery address is incomplete, so shipping rates can't be fetched for it.",
        },
        { status: 422 }
      );
    }

    const { shipmentId, rates, messages, hiddenRateCount } = await getRates({
      addressFrom,
      addressTo,
      parcel: DEFAULT_PARCEL,
    });

    if (!rates.length) {
      console.error("Shippo returned no purchasable rates:", messages);
      const reason = hiddenRateCount
        ? `${hiddenRateCount} rate(s) were quoted but none of those carriers are activated on your Shippo account.`
        : messages?.length
          ? messages.join(" ")
          : "No rates available for this address.";
      return NextResponse.json({ message: `No rates available: ${reason}` }, { status: 422 });
    }

    return NextResponse.json({ shipmentId, rates, hiddenRateCount });
  } catch (error) {
    console.error("Rate shopping error:", error);
    return NextResponse.json(
      { message: error.message || "Error fetching shipping rates." },
      { status: 500 }
    );
  }
});
