import { NextResponse } from "next/server";
import { getRates } from "@/lib/shippo";

// Temporary — proves Shippo connectivity. Delete once the real rate endpoint exists.
export async function GET() {
  try {
    const shipment = await getRates({
      addressFrom: {
        name: "Shopkart Warehouse",
        street1: "215 Clayton St",
        city: "San Francisco",
        state: "CA",
        zip: "94117",
        country: "US",
      },
      addressTo: {
        name: "Test Customer",
        street1: "1092 Indian Summer Ct",
        city: "San Jose",
        state: "CA",
        zip: "95122",
        country: "US",
      },
      parcel: {
        length: "10",
        width: "8",
        height: "4",
        distance_unit: "in",
        weight: "2",
        mass_unit: "lb",
      },
    });

    return NextResponse.json({
      status: shipment.status,
      rateCount: shipment.rates?.length ?? 0,
      rates: shipment.rates?.map((r) => ({
        provider: r.provider,
        service: r.servicelevel?.name,
        amount: r.amount,
        currency: r.currency,
        estimatedDays: r.estimated_days,
      })),
    });
  } catch (error) {
    console.error("Shippo test error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}