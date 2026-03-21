"use client";
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Center from "../components/Center";
import axios from "axios";
import ProductBox from "../components/ProductBox";
import { ProductsGrid, Title } from "../components/NewProducts";
import { GlobalStyles } from "../page";
import CartContextProvider from "@/app/components/CartContext";
const Products = () => {
  const [Products, setProducts] = useState([]);
  useEffect(() => {
    axios
      .get("/api")
      .then((resp) => {
        console.log(resp.data);
        setProducts(resp.data);
      })
      .catch((error) => console.log(error));
  }, []);
  return (
    <div>
      <GlobalStyles />
      <CartContextProvider>
        <Header />
        <Center>
          <Title>All Products</Title>
          <ProductsGrid>
            {Products?.length > 0 &&
              Products?.map((product, index) => (
                <ProductBox key={index} {...product} />
              ))}
          </ProductsGrid>
        </Center>
      </CartContextProvider>
    </div>
  );
};

export default Products;
