"use client";
import Applayout from "@/app/component/Applayout";
import axios from "axios";
import React, { useEffect, useState } from "react";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const ss = typeof window !== "undefined" ? window.sessionStorage : null;

  useEffect(() => {
    const id = JSON.parse(ss.getItem("user"))?.userId;
    axios
      .get('/api/orders?id='+id)
      .then((resp) => setOrders(resp.data))
      .catch((error) => console.log(error));
  }, []);
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
          {
            orders?.map((order,index)=>(
              <tr key={index}>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.price}</td>
                <td>{order.address},{order.postalCode}</td>
                <td>{order.paid? <div>Paid</div>:<div>Unpaid</div>}</td>
                <td>{order.delivered? <div>Delivered</div>:<div>Pending</div>}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Applayout>
  );
};
export default Order;
