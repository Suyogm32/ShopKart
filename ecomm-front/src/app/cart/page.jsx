"use client";
import React, { useContext } from "react";
import Header from "../components/Header";
import CartContextProvider, { CartContext } from "../components/CartContext";
import styled from "styled-components";
import { GlobalStyles } from "../page";
import MyCart from "./Cart";

const Cart = () => {
  const { cartProducts, setCartProducts } = useContext(CartContext);
  console.log("length of CartProducts ",cartProducts?.length);
  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />
      <MyCart/>
    </CartContextProvider>
  );
};

export default Cart;
