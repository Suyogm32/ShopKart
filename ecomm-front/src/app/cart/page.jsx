"use client";
import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartContextProvider from "../components/CartContext";
import { GlobalStyles } from "../page";
import MyCart from "./Cart";

const Cart = () => {
  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />
      <MyCart />
      <Footer />
    </CartContextProvider>
  );
};

export default Cart;
