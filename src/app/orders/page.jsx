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
  "grid grid-cols-[90px_140px_130px_1fr_50px_80px_90px_100px_140px_50px] items-center gap-2";

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

  const filteredOrders = orders.filter((order) =>
    order.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Applayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="mb-0">Orders</h1>
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
        <div className="min-w-[1150px]">
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
                [order.orderId?.Address, order.orderId?.State, order.orderId?.Country]
                  .filter(Boolean)
                  .join(", ");
              return (
                <div key={order._id} className={`${GRID_COLS} px-4 py-3`}>
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
                  <span
                    className="text-sm text-gray-500 dark:text-gray-400 truncate"
                    title={addressLine}
                  >
                    {addressLine || "—"}
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
                  <span>
                    <StatusPill
                      label={order.delivered ? "Delivered" : "Processing"}
                      tone={order.delivered ? "blue" : "gray"}
                    />
                  </span>
                  <span>
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
                        {!order.delivered && (
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
    </Applayout>
  );
};
export default Order;