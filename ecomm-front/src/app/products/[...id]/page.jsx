"use client";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ProductCard from "@/app/components/ProductCard";
import React, { useEffect, useState } from "react";
import CartContextProvider from "@/app/components/CartContext";
import axios from "axios";
import { usePathname } from "next/navigation";
import { GlobalStyles } from "@/app/page";
import Product from "./Product";

const ProductPage = () => {
  const [currentprod, setProd] = useState({});
  const [related, setRelated] = useState([]);

  const path = usePathname();
  const patharray = path.split("/");
  const id = patharray[patharray.length - 1];

  useEffect(() => {
    if (!id) return;
    axios
      .get("/api?id=" + id)
      .then((resp) => setProd(resp.data))
      .catch((error) => console.error("Failed to fetch product:", error));
  }, [id]);

  useEffect(() => {
    if (!currentprod?.category) return;
    axios
      .get(`/api?category=${currentprod.category}&pageSize=6`)
      .then((resp) => {
        const list = (resp.data.data || []).filter((p) => p._id !== currentprod._id);
        setRelated(list.slice(0, 5));
      })
      .catch(() => setRelated([]));
  }, [currentprod]);

  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />
      <Product prod={currentprod} />

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} {...p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </CartContextProvider>
  );
};

export default ProductPage;
