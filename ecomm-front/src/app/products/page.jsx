"use client";
import React, { Suspense, useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GlobalStyles } from "../page";
import CartContextProvider from "@/app/components/CartContext";

const ProductsInner = () => {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reset to page 1 whenever the filter changes, otherwise you can land on
  // page 4 of a result set that only has 1 page.
  useEffect(() => {
    setPage(1);
  }, [category, search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    if (search) params.set("search", search);

    axios
      .get(`/api?${params.toString()}`)
      .then((resp) => {
        setProducts(resp.data.data || []);
        setTotalPages(resp.data.pagination?.totalPages || 1);
        setTotal(resp.data.pagination?.total || 0);
      })
      .catch((error) => console.error("Failed to fetch products:", error))
      .finally(() => setLoading(false));
  }, [page, category, search]);

  useEffect(() => {
    axios
      .get("/api/categories")
      .then((resp) => setCategories(resp.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  const activeCategory = categories.find((c) => c._id === category);
  const heading = search
    ? `Results for “${search}”`
    : activeCategory
      ? activeCategory.catagoryName
      : "All products";

  return (
    <>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900">{heading}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Categories</h2>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
              <Link
                href="/products"
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  !category ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All products
              </Link>
              {categories.map((c) => (
                <Link
                  key={c._id}
                  href={`/products?category=${c._id}`}
                  className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap flex items-center justify-between gap-2 transition-colors ${
                    category === c._id
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{c.catagoryName}</span>
                  <span
                    className={`text-xs ${category === c._id ? "text-gray-300" : "text-gray-400"}`}
                  >
                    {c.productCount}
                  </span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
              {!loading && (
                <span className="text-sm text-gray-500">
                  {total} product{total === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-72" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-900 font-medium mb-1">No products found</p>
                <p className="text-sm text-gray-500 mb-6">
                  {search
                    ? `Nothing matched “${search}”. Try a different search.`
                    : "There are no products in this category yet."}
                </p>
                <Link
                  href="/products"
                  className="inline-block px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} {...product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

const Products = () => (
  <div>
    <GlobalStyles />
    <CartContextProvider>
      <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
        <ProductsInner />
      </Suspense>
    </CartContextProvider>
  </div>
);

export default Products;
