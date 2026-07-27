import { shippoProvider } from "./shippo";
import { User } from "@/models/User";

// Routes talk to this module, never to a carrier SDK directly. Swapping
// providers means adding a provider file and changing this one line.
const provider = shippoProvider;

const toCountryCode = (value) => {
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  const map = {
    us: "US",
    usa: "US",
    "united states": "US",
    "united states of america": "US",
    ca: "CA",
    canada: "CA",
    in: "IN",
    india: "IN",
  };
  if (map[key]) return map[key];
  return String(value).trim().length === 2 ? String(value).trim().toUpperCase() : "";
};

/**
 * Builds one parcel per seller from their items.
 *
 * Simplification worth knowing: real multi-item shipments need box packing
 * (how do these items actually fit together?). We approximate by summing
 * weight and taking the largest single dimension of any item, which is
 * accurate for one item and a reasonable estimate for a few.
 */
const buildParcel = (items) => {
  const weight = items.reduce((sum, i) => sum + (i.product.weight || 1) * i.quantity, 0);
  return {
    length: String(Math.max(...items.map((i) => i.product.length || 10))),
    width: String(Math.max(...items.map((i) => i.product.width || 8))),
    height: String(Math.max(...items.map((i) => i.product.height || 4))),
    distance_unit: "in",
    weight: String(Math.max(weight, 0.1).toFixed(2)),
    mass_unit: "lb",
  };
};

/**
 * Quotes shipping for a cart. Carts can contain items from several sellers,
 * each shipping from their own pickup address, so this quotes per seller and
 * sums the cheapest option from each.
 */
export const quoteShipping = async ({ items, addressTo }) => {
  const destination = {
    name: addressTo.name || "Customer",
    street1: addressTo.address,
    city: addressTo.city,
    state: addressTo.state || "",
    zip: addressTo.postalcode,
    country: toCountryCode(addressTo.country),
  };

  if (!destination.street1 || !destination.city || !destination.zip || !destination.country) {
    throw new Error("A complete delivery address is required to quote shipping.");
  }

  const bySeller = new Map();
  items.forEach((item) => {
    const key = String(item.product.sellerId);
    if (!bySeller.has(key)) bySeller.set(key, []);
    bySeller.get(key).push(item);
  });

  const sellers = await User.find({ _id: { $in: [...bySeller.keys()] } }).select(
    "name address city postalcode state country phone email"
  );
  const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));

  const breakdown = [];
  let total = 0;

  for (const [sellerId, sellerItems] of bySeller.entries()) {
    const seller = sellerMap.get(sellerId);
    const addressFrom = {
      name: seller?.name || "Seller",
      street1: seller?.address,
      city: seller?.city,
      state: seller?.state || "",
      zip: seller?.postalcode,
      country: toCountryCode(seller?.country),
      email: seller?.email || process.env.SHIP_FROM_EMAIL,
      phone: seller?.phone || process.env.SHIP_FROM_PHONE,
    };

    if (!addressFrom.street1 || !addressFrom.city || !addressFrom.zip || !addressFrom.country) {
      throw new Error("A seller in your cart hasn't set up a pickup address yet.");
    }

    const { rates, messages } = await provider.getRates({
      addressFrom,
      addressTo: destination,
      parcel: buildParcel(sellerItems),
    });

    if (!rates.length) {
      console.error("No rates returned for seller", sellerId, messages);
      throw new Error("No shipping options are available for this address.");
    }

    const cheapest = rates.reduce((min, r) => (r.amount < min.amount ? r : min), rates[0]);
    total += cheapest.amount;
    breakdown.push({
      sellerId,
      provider: cheapest.provider,
      service: cheapest.service,
      amount: cheapest.amount,
      estimatedDays: cheapest.estimatedDays,
    });
  }

  return { amount: Number(total.toFixed(2)), breakdown };
};
