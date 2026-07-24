"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import StatusPill from "./StatusPill";
import { useCountUp } from "@/app/hooks/useCountUp";

const StatCard = ({ label, value, format = (v) => v, trend }) => {
  const animatedValue = useCountUp(value);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex-1 min-w-[150px]">
      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-primary mt-1">{format(animatedValue)}</div>
      {trend !== undefined && trend !== null && (
        <div
          className={`text-xs mt-1 font-medium ${
            trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6 animate-pulse">
    <div className="flex flex-wrap gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20 flex-1 min-w-[150px]"
        />
      ))}
    </div>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-40" />
  </div>
);

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/api/dashboard/stats")
      .then((resp) => setStats(resp.data))
      .catch((err) => {
        console.error("Failed to load dashboard stats:", err);
        setError("Failed to load dashboard data.");
      });
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!stats) {
    return <DashboardSkeleton />;
  }

  const currentPeriodRevenue = stats.revenueByDay.reduce((sum, d) => sum + d.revenue, 0);
  const revenueTrend =
    stats.previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - stats.previousPeriodRevenue) / stats.previousPeriodRevenue) * 100
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} />
        <StatCard
          label="Total Revenue"
          value={stats.totalRevenue}
          format={(v) => `₹${v.toLocaleString()}`}
          trend={revenueTrend}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/products/new" className="btn-primary">
          Add Product
        </Link>
        <Link href="/orders" className="btn-default">
          View Orders
        </Link>
        <Link href="/catagories" className="btn-default">
          View Categories
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Revenue (Last 14 Days)
        </h3>
        {stats.revenueByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={{ stroke: "#6b7280" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={{ stroke: "#6b7280" }}
                tickLine={false}
              />
              <Tooltip contentStyle={{ background: "#1f2937", border: "none", color: "#f3f4f6" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#7c6cf9"
                strokeWidth={2}
                dot={{ r: 4, fill: "#7c6cf9" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            No paid orders in the last 14 days yet.
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Recent Orders</h3>
        {stats.recentOrders.length > 0 ? (
          <table className="basic">
            <thead>
              <tr>
                <td>Product</td>
                <td>Qty</td>
                <td>Price</td>
                <td>Status</td>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order.productName}</td>
                  <td>{order.quantity}</td>
                  <td>{order.price}</td>
                  <td className="flex gap-1">
                    <StatusPill
                      label={order.paid ? "Paid" : "Unpaid"}
                      tone={order.paid ? "green" : "amber"}
                    />
                    <StatusPill
                      label={order.delivered ? "Delivered" : "Pending"}
                      tone={order.delivered ? "blue" : "gray"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm">No orders yet.</div>
        )}
      </div>

      {stats.lowStockProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-red-400 dark:border-l-red-500 p-4">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">Low Stock</h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300">
            {stats.lowStockProducts.map((p) => (
              <li key={p._id}>
                {p.productName} — {p.stock} left
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
