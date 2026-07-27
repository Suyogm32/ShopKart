/**
 * @jest-environment node
 */
import { POST } from "../route";

// --- Mocks -----------------------------------------------------------------
// Everything the route touches externally is mocked: the point of these tests
// is the cancellation *rules*, not Mongo or Stripe.

jest.mock("@/lib/mongoose", () => ({ mongooseConnect: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/lib/rateLimit", () => ({ rateLimit: jest.fn(() => ({ allowed: true })) }));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/models/Order", () => ({ Order: { findOne: jest.fn() } }));
jest.mock("@/models/Backorders", () => ({
  backOrders: { find: jest.fn(), updateMany: jest.fn().mockResolvedValue({}) },
}));

// The mock fn is created inside the factory: jest.mock is hoisted above the
// imports, and the route requires stripe at module load, so anything declared
// out here with const would still be in its temporal dead zone.
jest.mock("stripe", () => {
  const refundCreate = jest.fn();
  const factory = jest.fn(() => ({ refunds: { create: refundCreate } }));
  factory.refundCreate = refundCreate;
  return factory;
});

const mockRefundCreate = jest.requireMock("stripe").refundCreate;

import { auth } from "@/auth";
import { Order } from "@/models/Order";
import { backOrders } from "@/models/Backorders";
import { rateLimit } from "@/lib/rateLimit";

// --- Helpers ---------------------------------------------------------------

const VALID_ID = "6a63b693ed16374f546ae036";

const makeRequest = (body = {}) => ({
  headers: { get: () => "127.0.0.1" },
  json: async () => ({ orderId: VALID_ID, email: "buyer@example.com", ...body }),
});

const makeOrder = (overrides = {}) => ({
  _id: VALID_ID,
  Email: "buyer@example.com",
  Paid: true,
  status: "placed",
  paymentIntentId: "pi_123",
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const setItems = (items) => backOrders.find.mockResolvedValue(items);

beforeEach(() => {
  jest.clearAllMocks();
  rateLimit.mockReturnValue({ allowed: true });
  auth.mockResolvedValue(null); // guest by default
  mockRefundCreate.mockResolvedValue({ id: "re_123" });
});

// --- Tests -----------------------------------------------------------------

describe("POST /api/orders/cancel — validation", () => {
  it("rejects a malformed order id", async () => {
    const res = await POST(makeRequest({ orderId: "not-an-objectid" }));
    expect(res.status).toBe(400);
  });

  it("rejects when rate limited", async () => {
    rateLimit.mockReturnValue({ allowed: false });
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 404 when no order matches the id and email", async () => {
    Order.findOne.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });
});

describe("POST /api/orders/cancel — eligibility rules", () => {
  it("refuses to cancel an order that has already shipped", async () => {
    Order.findOne.mockResolvedValue(makeOrder());
    setItems([{ trackingNumber: "9400111899223", delivered: false }]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toMatch(/already shipped/i);
    expect(mockRefundCreate).not.toHaveBeenCalled();
  });

  it("refuses to cancel an order that is already delivered", async () => {
    Order.findOne.mockResolvedValue(makeOrder());
    setItems([{ trackingNumber: null, delivered: true }]);

    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
    expect(mockRefundCreate).not.toHaveBeenCalled();
  });

  it("refuses to cancel an order that is already cancelled", async () => {
    Order.findOne.mockResolvedValue(makeOrder({ status: "cancelled" }));

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toMatch(/already cancelled/i);
    expect(mockRefundCreate).not.toHaveBeenCalled();
  });

  it("treats a partially shipped order as shipped", async () => {
    // One item has a label, one doesn't — cancelling would strand the shipped half.
    Order.findOne.mockResolvedValue(makeOrder());
    setItems([{ trackingNumber: "940011", delivered: false }, { trackingNumber: null }]);

    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });
});

describe("POST /api/orders/cancel — refund behaviour", () => {
  it("refunds and cancels an unshipped paid order", async () => {
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);
    setItems([{ trackingNumber: null, delivered: false }]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockRefundCreate).toHaveBeenCalledWith({ payment_intent: "pi_123" });
    expect(order.status).toBe("cancelled");
    expect(order.refundId).toBe("re_123");
    expect(order.save).toHaveBeenCalled();
    expect(backOrders.updateMany).toHaveBeenCalledWith(
      { orderId: order._id },
      { $set: { cancelled: true } }
    );
    expect(body.refunded).toBe(true);
  });

  it("cancels an unpaid order without attempting a refund", async () => {
    const order = makeOrder({ Paid: false, paymentIntentId: null });
    Order.findOne.mockResolvedValue(order);
    setItems([{ trackingNumber: null, delivered: false }]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockRefundCreate).not.toHaveBeenCalled();
    expect(order.status).toBe("cancelled");
    expect(body.refunded).toBe(false);
  });

  it("refuses to cancel a paid order that has no payment intent on file", async () => {
    // Legacy orders predate storing payment_intent — cancelling them would
    // mark the order cancelled while keeping the customer's money.
    const order = makeOrder({ paymentIntentId: null });
    Order.findOne.mockResolvedValue(order);
    setItems([{ trackingNumber: null, delivered: false }]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.message).toMatch(/contact support/i);
    expect(order.status).toBe("placed");
    expect(order.save).not.toHaveBeenCalled();
  });

  it("does not mark the order cancelled if the refund fails", async () => {
    // Refund first, persist second — the reverse would risk a cancelled order
    // with the money still taken.
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);
    setItems([{ trackingNumber: null, delivered: false }]);
    mockRefundCreate.mockRejectedValue(new Error("card_declined"));

    // The route logs this failure by design; silence it so real errors stand out.
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeRequest());
    logSpy.mockRestore();

    expect(res.status).toBe(500);
    expect(order.status).toBe("placed");
    expect(order.save).not.toHaveBeenCalled();
    expect(backOrders.updateMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders/cancel — ownership", () => {
  it("matches a signed-in customer on customerId, not email", async () => {
    auth.mockResolvedValue({ user: { id: "cust1", email: "buyer@example.com" } });
    Order.findOne.mockResolvedValue(makeOrder());
    setItems([{ trackingNumber: null, delivered: false }]);

    await POST(makeRequest({ email: undefined }));

    expect(Order.findOne).toHaveBeenCalledWith({ _id: VALID_ID, customerId: "cust1" });
  });

  it("falls back to id + email matching for guests", async () => {
    auth.mockResolvedValue(null);
    Order.findOne.mockResolvedValue(makeOrder());
    setItems([{ trackingNumber: null, delivered: false }]);

    await POST(makeRequest());

    const query = Order.findOne.mock.calls[0][0];
    expect(query._id).toBe(VALID_ID);
    expect(query.Email).toBeInstanceOf(RegExp);
    expect(query.customerId).toBeUndefined();
  });
});
