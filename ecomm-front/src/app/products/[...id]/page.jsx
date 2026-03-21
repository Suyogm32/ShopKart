"use client";
import Header from "@/app/components/Header";
import React, { useEffect, useState,useContext } from "react";
import CartContextProvider from "@/app/components/CartContext";
import Center from "@/app/components/Center";
import axios from "axios";
import { usePathname } from "next/navigation";
import { GlobalStyles } from "@/app/page";
import Product from "./Product";

const ProductPage = () => {

  const [currentprod, setProd] = useState({});
  
  const path = usePathname();
  let patharray = path.split("/");
  const id = patharray[patharray.length - 1];
  useEffect(() => {
    axios
      .get("/api?id=" + id)
      .then((resp) => {
        console.log(resp.data);
        setProd(resp.data);
      })
      .catch((error) => console.log(error));
  }, []);
  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />
      <Center>
        <Product prod={currentprod}/>
      </Center>
    </CartContextProvider>
  );
};

export default ProductPage;
