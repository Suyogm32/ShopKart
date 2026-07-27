import { buildItems, computeTotals, round2, TAX_RATE } from "../pricing";

const makeProduct = (id, price, extra = {}) => ({
  _id: id,
  productName: `Product ${id}`,
  price,
  sellerId: "seller1",
  ...extra,
});

describe("buildItems", () => {
  // The cart stores one array entry per unit — [a, a, b] means 2x a, 1x b.
  // Getting this wrong is what caused the historic overcharge bug.
  it("collapses repeated ids into quantities", () => {
    const products = [makeProduct("a", 10), makeProduct("b", 25)];
    const items = buildItems(["a", "a", "b"], products);

    expect(items).toHaveLength(2);
    expect(items.find((i) => i.product._id === "a").quantity).toBe(2);
    expect(items.find((i) => i.product._id === "b").quantity).toBe(1);
  });

  it("handles a single item", () => {
    const items = buildItems(["a"], [makeProduct("a", 10)]);
    expect(items).toEqual([{ product: expect.objectContaining({ _id: "a" }), quantity: 1 }]);
  });

  it("returns an empty array for an empty cart", () => {
    expect(buildItems([], [makeProduct("a", 10)])).toEqual([]);
  });

  it("drops ids with no matching product rather than throwing", () => {
    // A product deleted while sitting in someone's cart shouldn't break checkout.
    const items = buildItems(["a", "ghost"], [makeProduct("a", 10)]);
    expect(items).toHaveLength(1);
    expect(items[0].product._id).toBe("a");
  });

  it("matches ids regardless of string/ObjectId-like type", () => {
    const products = [makeProduct({ toString: () => "a" }, 10)];
    const items = buildItems(["a"], products);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });
});

describe("computeTotals", () => {
  it("multiplies price by quantity in the subtotal", () => {
    const items = [{ product: makeProduct("a", 10), quantity: 3 }];
    const totals = computeTotals({ items, shippingAmount: 0 });
    expect(totals.subtotal).toBe(30);
  });

  it("sums across multiple line items", () => {
    const items = [
      { product: makeProduct("a", 10), quantity: 2 },
      { product: makeProduct("b", 5.5), quantity: 4 },
    ];
    expect(computeTotals({ items }).subtotal).toBe(42);
  });

  it("applies tax to goods but not to shipping", () => {
    const items = [{ product: makeProduct("a", 100), quantity: 1 }];
    const totals = computeTotals({ items, shippingAmount: 20 });

    expect(totals.tax).toBe(round2(100 * TAX_RATE));
    // Tax must not have been charged on the $20 shipping.
    expect(totals.tax).not.toBe(round2(120 * TAX_RATE));
  });

  it("total equals subtotal + tax + shipping", () => {
    const items = [{ product: makeProduct("a", 49.99), quantity: 2 }];
    const totals = computeTotals({ items, shippingAmount: 7.25 });

    expect(totals.total).toBe(round2(totals.subtotal + totals.tax + totals.shipping));
  });

  it("defaults shipping to zero when not supplied", () => {
    const items = [{ product: makeProduct("a", 10), quantity: 1 }];
    expect(computeTotals({ items }).shipping).toBe(0);
  });

  it("returns zeroes for an empty cart", () => {
    const totals = computeTotals({ items: [], shippingAmount: 0 });
    expect(totals).toMatchObject({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
  });

  it("rounds money to two decimals rather than leaking float error", () => {
    const items = [{ product: makeProduct("a", 0.1), quantity: 3 }];
    const totals = computeTotals({ items, shippingAmount: 0.2 });

    // 0.1 * 3 = 0.30000000000000004 in floating point.
    expect(totals.subtotal).toBe(0.3);
    expect(Number.isInteger(totals.total * 100)).toBe(true);
  });

  it("exposes the tax rate used, so the UI can label it", () => {
    const totals = computeTotals({ items: [{ product: makeProduct("a", 10), quantity: 1 }] });
    expect(totals.taxRate).toBe(TAX_RATE);
  });
});

describe("round2", () => {
  it("rounds to two decimal places", () => {
    expect(round2(1.005)).toBe(1.0);
    expect(round2(1.006)).toBe(1.01);
    expect(round2(10)).toBe(10);
  });
});
