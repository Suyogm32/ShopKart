"use client";
import Applayout from "@/app/component/Applayout";
import axios from "axios";
import React, { useEffect, useState } from "react";

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
      <table className="basic mt-4">
        <thead>
          <tr>
            <td>Product</td>
            <td>Quantity</td>
            <td>Price</td>
            <td>Address</td>
            <td>Payment Status</td>
            <td>Delivered</td>
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
              <td>{order.paid ? <div>Paid</div> : <div>Unpaid</div>}</td>
              <td>{order.delivered ? <div>Delivered</div> : <div>Pending</div>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center">
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
