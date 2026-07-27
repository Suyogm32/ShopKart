"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CartContextProvider from "@/app/components/CartContext";
import { GlobalStyles } from "@/app/page";

const STATUS_STEPS = ["Placed", "Shipped", "Delivered"];

const OrderCard = ({ order, onChanged }) => {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const currentStep = order.isDelivered ? 2 : order.hasShipped ? 1 : 0;

  const cancel = async () => {
    if (!window.confirm("Cancel this order? Your payment will be refunded.")) return;
    setCancelling(true);
    setError("");
    try {
      await axios.post("/api/orders/cancel", { orderId: order._id });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="font-semibold text-gray-900 mb-0.5">
            Order #{String(order._id).slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-gray-400">
            {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">${order.total}</p>
          <p className="text-xs text-gray-400">
            {order.items.length} item{order.items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {order.isCancelled ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 mb-4">
          Cancelled — any payment has been refunded.
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4">
          {STATUS_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                    i <= currentStep ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-[11px] ${i <= currentStep ? "text-gray-900" : "text-gray-400"}`}
                >
                  {step}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <span className={`flex-1 h-px ${i < currentStep ? "bg-gray-900" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100 pt-2">
        {order.items.map((item) => (
          <div key={item._id} className="py-2">
            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-900">
                {item.productName} <span className="text-gray-400">× {item.quantity}</span>
              </span>
              <span className="text-sm text-gray-600">${item.price * item.quantity}</span>
            </div>
            {item.trackingNumber && (
              <p className="text-xs text-gray-500 mt-1">
                {item.carrier} {item.service} · {item.trackingNumber}
                {item.shippingStatus ? ` · ${item.shippingStatus}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">{order.address}</p>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {order.canCancel && (
        <button
          onClick={cancel}
          disabled={cancelling}
          className="mt-4 px-4 py-2 rounded-full border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {cancelling ? "Cancelling…" : "Cancel order"}
        </button>
      )}
    </div>
  );
};

const GuestLookup = () => {
  const [form, setForm] = useState({ orderId: "", email: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await axios.post("/api/orders/lookup", form);
      setResult(resp.data);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Could not look up that order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-center">
        <p className="text-sm text-gray-700 mb-1">Sign in to see all your orders</p>
        <p className="text-xs text-gray-500 mb-4">
          Or look up a single order below using its ID.
        </p>
        <Link
          href="/login?next=/track"
          className="inline-block px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Sign in
        </Link>
      </div>

      <form
        onSubmit={lookup}
        className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row gap-3 mb-6"
      >
        <input
          type="text"
          required
          placeholder="Order ID"
          value={form.orderId}
          onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          className="flex-1 h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
        />
        <input
          type="email"
          required
          placeholder="Email used at checkout"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="flex-1 h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

      {result && (
        <OrderCard
          order={{
            _id: result.order._id,
            placedAt: result.order.placedAt,
            address: result.order.address,
            items: result.items,
            total: result.summary.total,
            hasShipped: result.summary.hasShipped,
            isDelivered: result.summary.isDelivered,
            isCancelled: result.summary.isCancelled,
            canCancel: false,
          }}
          onChanged={() => {}}
        />
      )}
    </>
  );
};

const TrackPage = () => {
  const { status } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios
      .get("/api/orders/mine")
      .then((resp) => setOrders(resp.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "authenticated") load();
    if (status === "unauthenticated") setLoading(false);
  }, [status]);

  // "Active" means still in flight — not delivered and not cancelled.
  const active = orders.filter((o) => !o.isDelivered && !o.isCancelled);
  const past = orders.filter((o) => o.isDelivered || o.isCancelled);

  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900">Your orders</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your orders</h1>

        {status === "unauthenticated" ? (
          <GuestLookup />
        ) : loading ? (
          <p className="text-sm text-gray-400">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-900 mb-1">No orders yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Your orders will show up here once you buy something.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                In progress{" "}
                <span className="text-gray-400 font-normal normal-case">({active.length})</span>
              </h2>
              {active.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing on its way right now.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {active.map((order) => (
                    <OrderCard key={order._id} order={order} onChanged={load} />
                  ))}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  Past orders{" "}
                  <span className="text-gray-400 font-normal normal-case">({past.length})</span>
                </h2>
                <div className="flex flex-col gap-4">
                  {past.map((order) => (
                    <OrderCard key={order._id} order={order} onChanged={load} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Footer />
    </CartContextProvider>
  );
};

export default TrackPage;