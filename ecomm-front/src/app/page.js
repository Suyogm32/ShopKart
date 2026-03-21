"use client";
import Header from "./components/Header";
import { createGlobalStyle } from "styled-components";
import FeaturedProduct from "./components/featured";
import { useEffect, useState } from "react";
import NewProducts from "./components/NewProducts";
import CartContextProvider from "./components/CartContext";
export const GlobalStyles = createGlobalStyle`
  body{
    font-family:'Roboto',sans-serif;
    background-color:#eee ;
  }
`;
export default function Home() {
  const [prod, setProd] = useState({});
  useEffect(() => {
    fetch("/api?id=6609476edd5a4e1706fb57ab", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((resp) => resp.json()) // Parse response body as JSON
      .then((data) => {
        setProd(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);
  return (
    <div>
      <GlobalStyles />
      <CartContextProvider>
        <Header />
        <FeaturedProduct product={prod} />
        <NewProducts />
      </CartContextProvider>
    </div>
  );
}
