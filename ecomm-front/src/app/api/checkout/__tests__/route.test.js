/**
 * @jest-environment node
 */
import { POST } from "../route";

jest.mock("@/lib/mongoose", () => ({ mongooseConnect: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/shipping", () => ({ quoteShipping: jest.fn() }));
jest.mock("@/models/Product", () => ({ product: { find: jest.fn() } }));
jest.mock("@/models/Backorders", () => ({ backOrders: { insertMany: jest.fn().mockResolvedValue([]) } }));

// Order is a constructor in the route, so the mock has to behave like one.
const mockSavedOrders = [];
jest.mock("@/models/Order", () => ({
  Order: jest.fn(function (data) {
    Object.assign(this, data);
    this._id = "order123";
    this.save = jest.fn().mockResolvedValue(undefined);
    mockSavedOrders.push(this);
  }),
}));

// Created inside the factory — jest.mock is hoisted above the imports, and the
// route requires stripe at module load, so a const out here would still be in
// its temporal dead zone when the factory runs.
jest.mock("stripe", () => {
  const sessionCreate = jest.fn();
  const factory = jest.fn(() => ({ checkout: { sessions: { create: sessionCreate } } }));
  factory.sessionCreate = sessionCreate;
  return factory;
});

const mockSessionCreate = jest.requireMock("stripe").sessionCreate;

import { auth } from "@/auth";
import { product } from "@/models/Product";
import { backOrders } from "@/models/Backorders";
import { quoteShipping } from "@/lib/shipping";

const ADDRESS = {
  Name: "Test Customer",
  Address: "1092 Indian Summer Ct",
  City: "San Jose",
  Postalcode: "95122",
  State: "CA",
  Country: "US",
};

const makeRequest = (body = {}) => ({
  json: async () => ({ ...ADDRESS, products: ["p1", "p1"], ...body }),
});

const PRODUCT = {
  _id: "p1",
  productName: "Widget",
  price: 25,
  sellerId: "seller1",
  weight: 2,
  length: 10,
  width: 8,
  height: 4,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSavedOrders.length = 0;
  auth.mockResolvedValue({ user: { id: "cust1", email: "buyer@example.com", name: "Test Customer" } });
  product.find.mockResolvedValue([PRODUCT]);
  quoteShipping.mockResolvedValue({ amount: 10, breakdown: [{ sellerId: "seller1", amount: 10 }] });
  mockSessionCreate.mockResolvedValue({ url: "https://checkout.stripe.test/session" });
});

describe("POST /api/checkout — access and validation", () => {
  it("requires a signed-in customer", async () => {
    auth.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it("rejects an empty cart", async () => {
    const res = await POST(makeRequest({ products: [] }));
    expect(res.status).toBe(400);
  });

  it("rejects an incomplete address", async () => {
    const res = await POST(makeRequest({ City: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects a cart whose products no longer exist", async () => {
    product.find.mockResolvedValue([]);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });
});

describe("POST /api/checkout — Stripe line items", () => {
  const lineItems = () => mockSessionCreate.mock.calls[0][0].line_items;

  it("sends a PER-UNIT price, letting Stripe multiply by quantity", async () => {
    // Regression: unit_amount used to be quantity * price * 100, so ordering
    // two items charged four times the price.
    await POST(makeRequest({ products: ["p1", "p1"] }));

    const productLine = lineItems().find((l) => l.price_data.product_data.name === "Widget");
    expect(productLine.quantity).toBe(2);
    expect(productLine.price_data.unit_amount).toBe(2500); // $25.00, not $50.00
  });

  it("adds shipping as its own line item", async () => {
    await POST(makeRequest());
    const shipping = lineItems().find((l) => l.price_data.product_data.name === "Shipping");
    expect(shipping.price_data.unit_amount).toBe(1000);
    expect(shipping.quantity).toBe(1);
  });

  it("adds sales tax as its own line item", async () => {
    await POST(makeRequest());
    const tax = lineItems().find((l) => /Sales tax/.test(l.price_data.product_data.name));
    expect(tax).toBeDefined();
    expect(tax.price_data.unit_amount).toBeGreaterThan(0);
  });

  it("omits the shipping line when shipping is free", async () => {
    quoteShipping.mockResolvedValue({ amount: 0, breakdown: [] });
    await POST(makeRequest());
    expect(lineItems().some((l) => l.price_data.product_data.name === "Shipping")).toBe(false);
  });

  it("charges in USD", async () => {
    await POST(makeRequest());
    lineItems().forEach((l) => expect(l.price_data.currency).toBe("usd"));
  });
});

describe("POST /api/checkout — trust boundaries", () => {
  it("takes the email from the session, never the request body", async () => {
    await POST(makeRequest({ Email: "attacker@example.com" }));
    expect(mockSavedOrders[0].Email).toBe("buyer@example.com");
  });

  it("recalculates totals server-side, ignoring browser-supplied amounts", async () => {
    await POST(makeRequest({ total: 1, subtotal: 1, tax: 0, shipping: 0 }));

    const order = mockSavedOrders[0];
    expect(order.subtotal).toBe(50); // 2 x $25
    expect(order.shipping).toBe(10);
    expect(order.total).toBe(order.subtotal + order.tax + order.shipping);
  });

  it("quotes shipping from the database, not from the client", async () => {
    await POST(makeRequest());
    const args = quoteShipping.mock.calls[0][0];
    expect(args.items[0].product.price).toBe(25);
    expect(args.items[0].quantity).toBe(2);
  });
});

describe("POST /api/checkout — order records", () => {
  it("creates one backOrders row per line item with the real product price", async () => {
    await POST(makeRequest({ products: ["p1", "p1"] }));

    const rows = backOrders.insertMany.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      productName: "Widget",
      quantity: 2,
      price: 25, // per-unit, not the Stripe line total
      sellerId: "seller1",
      paid: false,
      delivered: false,
    });
  });

  it("links the order to the signed-in customer", async () => {
    await POST(makeRequest());
    expect(mockSavedOrders[0].customerId).toBe("cust1");
  });

  it("passes the order id to Stripe as metadata for the webhook", async () => {
    await POST(makeRequest());
    expect(mockSessionCreate.mock.calls[0][0].metadata).toEqual({ orderId: "order123" });
  });

  it("surfaces a shipping quote failure instead of charging the customer", async () => {
    quoteShipping.mockRejectedValue(new Error("No shipping options are available."));

    // The route logs this failure by design; silence it so real errors stand out.
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeRequest());
    logSpy.mockRestore();

    expect(res.status).toBe(500);
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });
});
