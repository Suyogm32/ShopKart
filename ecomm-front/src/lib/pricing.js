/**
 * Single source of truth for order totals.
 *
 * Both the quote endpoint (what the customer is shown) and the checkout
 * endpoint (what Stripe actually charges) call this, so the two can't drift
 * apart. Never trust totals sent from the browser — they're always recomputed
 * server-side from product prices in the database.
 */

// Flat sales-tax rate. Real US sales tax varies by state and product type;
// this is a deliberate simplification for a demo store.
export const TAX_RATE = Number(process.env.TAX_RATE ?? 0.0875);

export const round2 = (n) => Number(Number(n).toFixed(2));

export const computeTotals = ({ items, shippingAmount = 0 }) => {
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // Tax applies to goods only, not shipping.
  const tax = round2(subtotal * TAX_RATE);
  const shipping = round2(shippingAmount);
  const total = round2(subtotal + tax + shipping);

  return { subtotal: round2(subtotal), tax, shipping, total, taxRate: TAX_RATE };
};

/**
 * The cart stores one array entry per unit, so [a, a, b] means 2× a and 1× b.
 * Turns that into products paired with quantities.
 */
export const buildItems = (productIds, products) => {
  const uniqueIds = [...new Set(productIds.map(String))];
  return uniqueIds
    .map((id) => {
      const product = products.find((p) => String(p._id) === id);
      if (!product) return null;
      return {
        product,
        quantity: productIds.filter((pid) => String(pid) === id).length,
      };
    })
    .filter(Boolean);
};
