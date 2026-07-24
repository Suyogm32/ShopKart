"use client";
import Applayout from "@/app/component/Applayout";
import axios from "axios";
import React, { useEffect, useState } from "react";
import StatusPill from "@/app/component/StatusPill";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios
      .get(`/api/orders?page=${page}`)
      .then((resp) => {
        setOrders(resp.data.data);
        setTotalPages(resp.data.pagination.totalPages);
      })
      .catch((error) => console.error("Failed to fetch orders:", error));
  }, [page]);

  return (
    <Applayout>
      <h1>Orders</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <table className="basic">
          <thead>
            <tr>
              <td>Product</td>
              <td>Quantity</td>
              <td>Price</td>
              <td>Address</td>
              <td>Status</td>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order, index) => (
              <tr key={index}>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.price}</td>
                <td>
                  {order.address},{order.postalCode}
                </td>
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
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center text-gray-700 dark:text-gray-300">
          <button
            className="btn-default"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
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
