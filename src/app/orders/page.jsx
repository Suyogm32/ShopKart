"use client";
import Applayout from "@/app/component/Applayout";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StatusPill from "@/app/component/StatusPill";

const STATUS_LABEL = {
  unpaid: "Unpaid",
  processing: "Processing",
  delivered: "Delivered",
};

const GRID_COLS =
  "grid grid-cols-[90px_140px_130px_1fr_50px_80px_90px_120px_140px_50px] items-center gap-2";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    unpaid: 0,
    processing: 0,
    delivered: 0,
  });
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [shippingOrder, setShippingOrder] = useState(null);
  const [rates, setRates] = useState([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [buyingLabel, setBuyingLabel] = useState(false);
  const shippingPanelOpen = !!shippingOrder;

  const fetchOrders = () => {
    const statusParam = statusFilter === "all" ? "" : `&status=${statusFilter}`;
    axios
      .get(`/api/orders?page=${page}${statusParam}`)
      .then((resp) => {
        setOrders(resp.data.data);
        setTotalPages(resp.data.pagination.totalPages);
        setStatusCounts(resp.data.statusCounts);
      })
      .catch((error) => console.error("Failed to fetch orders:", error));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  useEffect(() => {
    axios.get("/api/delivery-agents").then((resp) => setAgents(resp.data.data));
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeShippingPanel();
    };
    if (shippingPanelOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [shippingPanelOpen]);

  const updateOrder = async (order, updates) => {
    setOpenMenuId(null);
    try {
      await axios.put("/api/orders", { _id: order._id, ...updates });
      toast.success("Order updated.");
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order.");
    }
  };

  const openShippingPanel = (order) => {
    setOpenMenuId(null);
    setShippingOrder(order);
    setRates([]);
    setSelectedRateId("");
    setRatesError("");
    fetchRates(order._id);
  };

  const closeShippingPanel = () => {
    setShippingOrder(null);
    setRates([]);
    setSelectedRateId("");
    setRatesError("");
  };

  const fetchRates = async (orderId) => {
    setLoadingRates(true);
    setRatesError("");
    try {
      const resp = await axios.post("/api/shipping/rates", { orderId });
      setRates(resp.data.rates || []);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch shipping rates.";
      setRatesError(message);
    } finally {
      setLoadingRates(false);
    }
  };

  const buyLabel = async () => {
    const rate = rates.find((r) => r.rateId === selectedRateId);
    if (!rate || !shippingOrder) return;
    setBuyingLabel(true);
    try {
      await axios.post("/api/shipping/buy-label", {
        orderId: shippingOrder._id,
        rateId: rate.rateId,
        provider: rate.provider,
        service: rate.service,
      });
      toast.success("Shipping label purchased.");
      closeShippingPanel();
      fetchOrders();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to purchase shipping label.";
      toast.error(message);
    } finally {
      setBuyingLabel(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Applayout>
      <div className="flex items-center justify-end mb-4 flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by product name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs mb-0"
        />
      </div>
      
      <div className="flex gap-2 mb-4">
        {["all", "unpaid", "processing", "delivered"].map((key) => (
          <button
            key={key}
            onClick={() => {
              setStatusFilter(key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
              statusFilter === key
                ? "bg-primary text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
            }`}
          >
            {key === "all" ? "All" : STATUS_LABEL[key]}
            <span
              className={`text-xs px-1.5 rounded-full ${
                statusFilter === key ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {statusCounts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg overflow-x-auto">
        <div className="min-w-[1180px]">
          <div
            className={`${GRID_COLS} px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}
          >
            <span>Order ID</span>
            <span>Product</span>
            <span>Customer</span>
            <span>Address</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
            <span>Payment</span>
            <span>Delivery</span>
            <span>Agent</span>
            <span></span>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
            {filteredOrders.map((order) => {
              const addressLine =
                order.address ||
                [order.orderId?.Address, order.orderId?.City, order.orderId?.State, order.orderId?.Country]
                  .filter(Boolean)
                  .join(", ");
              return (
                <div
                  key={order._id}
                  className={`${GRID_COLS} px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {order.productName}
                  </span>
                  <span
                    className="text-sm text-gray-700 dark:text-gray-300 truncate"
                    title={order.orderId?.Email}
                  >
                    {order.orderId?.Name || "—"}
                  </span>
                  <span className="relative group min-w-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate block">
                      {addressLine || "—"}
                    </span>
                    {addressLine && (
                      <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md px-3 py-2 shadow-lg max-w-xs whitespace-normal">
                        {addressLine}
                      </div>
                    )}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {order.quantity}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-right">
                    Rs. {order.price}
                  </span>
                  <span>
                    <StatusPill
                      label={order.paid ? "Paid" : "Unpaid"}
                      tone={order.paid ? "green" : "amber"}
                    />
                  </span>
                  <span className="flex flex-col gap-1">
                    <StatusPill
                      label={order.delivered ? "Delivered" : "Processing"}
                      tone={order.delivered ? "blue" : "gray"}
                    />
                    {order.trackingNumber ? (
                      <a
                        href={order.labelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline truncate"
                        title={`${order.shippingCarrier} ${order.shippingService} — ${order.trackingNumber}`}
                      >
                        {order.shippingCarrier} · {order.trackingNumber.slice(-8)}
                      </a>
                     ) : order.delivered ? null : order.deliveryAgent ? null : order.paid ? (
                      <button
                        type="button"
                        onClick={() => openShippingPanel(order)}
                        className="text-[11px] text-primary hover:underline text-left"
                      >
                        Ship order
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        Awaiting payment
                      </span>
                    )}
                  </span>
                  <span>
                    {order.trackingNumber ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Shipped via courier
                      </span>
                    ) : (
                      <select
                        value={order.deliveryAgent?._id || ""}
                        onChange={(e) => updateOrder(order, { deliveryAgent: e.target.value })}
                        className="!mb-0 !p-1 !text-xs !w-full"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </span>
                  <span className="relative text-right">
                    <button
                      className="btn-default"
                      onClick={() => setOpenMenuId(openMenuId === order._id ? null : order._id)}
                    >
                      ⋯
                    </button>
                    {openMenuId === order._id && (
                      <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-md z-10 w-48 overflow-hidden text-left">
                        {!order.paid && (
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => updateOrder(order, { paid: true })}
                          >
                            Mark as paid
                          </button>
                        )}
                        {!order.delivered && (order.trackingNumber || order.deliveryAgent) && (
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => updateOrder(order, { delivered: true })}
                          >
                            Mark as delivered
                          </button>
                        )}
                      </div>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center text-gray-700 dark:text-gray-300">
          <button className="btn-default" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-default"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Shipping overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          shippingPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeShippingPanel}
      />

      {/* Shipping panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-gray-50 dark:bg-gray-900 shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          shippingPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!shippingPanelOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0">
            {shippingOrder ? `Ship "${shippingOrder.productName}"` : "Ship order"}
          </h2>
          <button
            className="btn-icon-edit"
            onClick={closeShippingPanel}
            aria-label="Close panel"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {shippingOrder && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-1">
                <span className="text-gray-400 dark:text-gray-500">To: </span>
                {shippingOrder.orderId?.Name || "—"}
              </p>
              <p className="mb-0">
                <span className="text-gray-400 dark:text-gray-500">Address: </span>
                {[shippingOrder.address].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          )}

          {loadingRates && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Fetching shipping rates…</p>
          )}

          {!loadingRates && ratesError && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              {ratesError}
            </div>
          )}

          {!loadingRates && !ratesError && rates.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No rates available.</p>
          )}

          {!loadingRates && rates.length > 0 && (
            <div className="flex flex-col gap-2">
              {rates.map((rate) => (
                <label
                  key={rate.rateId}
                  className={`flex items-center justify-between gap-3 border rounded-lg p-3 cursor-pointer ${
                    selectedRateId === rate.rateId
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="rate"
                      checked={selectedRateId === rate.rateId}
                      onChange={() => setSelectedRateId(rate.rateId)}
                      className="!w-4 !h-4 !mb-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0">
                        {rate.provider} — {rate.service}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Est. {rate.estimatedDays} day{rate.estimatedDays === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {rate.currency} {rate.amount}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            className="btn-primary"
            type="button"
            disabled={!selectedRateId || buyingLabel}
            onClick={buyLabel}
          >
            {buyingLabel ? "Purchasing…" : "Buy label"}
          </button>
          <button className="btn-default" type="button" onClick={closeShippingPanel}>
            Cancel
          </button>
        </div>
      </div>
    </Applayout>
  );
};
export default Order;