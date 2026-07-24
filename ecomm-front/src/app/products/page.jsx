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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios
      .get(`/api?page=${page}`)
      .then((resp) => {
        setProducts(resp.data.data);
        setTotalPages(resp.data.pagination.totalPages);
      })
      .catch((error) => console.error("Failed to fetch products:", error));
  }, [page]);

  return (
    <div>
      <GlobalStyles />
      <CartContextProvider>
        <Header />
        <Center>
          <Title>All Products</Title>
          <ProductsGrid>
            {Products?.length > 0 &&
              Products?.map((product, index) => <ProductBox key={index} {...product} />)}
          </ProductsGrid>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", alignItems: "center" }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </Center>
      </CartContextProvider>
    </div>
  );
};

export default Products;
