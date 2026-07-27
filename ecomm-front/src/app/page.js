"use client";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import CartContextProvider from "./components/CartContext";
import { createGlobalStyle } from "styled-components";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export const GlobalStyles = createGlobalStyle`
  body{
    font-family:'Roboto',sans-serif;
    background-color:#fff;
  }
`;

const TRUST_BADGES = [
  {
    title: "Free shipping",
    desc: "When you spend $80 or more",
    icon: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.334-1.086-.867-1.267C12.4 5.144 11.5 5 10.5 5c-1 0-1.9.144-2.383.348a1.35 1.35 0 0 0-.867 1.267v.958m6.75 0v9.427m-6.75-9.427v9.427m0 0H2.25V14.25M9.75 7.573h3",
  },
  {
    title: "Available 24/7",
    desc: "Need help? Contact us anytime",
    icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z",
  },
  {
    title: "Satisfied or return",
    desc: "Easy 30-day return policy",
    icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99",
  },
  {
    title: "Secure payments",
    desc: "Powered by Stripe",
    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
];

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categorySections, setCategorySections] = useState([]);

  useEffect(() => {
    // Featured is simply the newest product — the previous version hardcoded a
    // document ID, which silently blanked the hero if that product was deleted.
    fetch("/api?limit=10")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNewArrivals(list);
        setFeatured(list[0] || null);
      })
      .catch((e) => console.error("Error fetching products:", e));

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch((e) => console.error("Error fetching categories:", e));
  }, []);

  useEffect(() => {
    const withProducts = categories.filter((c) => c.productCount > 0).slice(0, 3);
    if (!withProducts.length) return;

    Promise.all(
      withProducts.map((c) =>
        fetch(`/api?category=${c._id}&pageSize=5`)
          .then((r) => r.json())
          .then((d) => ({ category: c, products: d.data || [] }))
          .catch(() => ({ category: c, products: [] }))
      )
    ).then((sections) => setCategorySections(sections.filter((s) => s.products.length)));
  }, [categories]);

  return (
    <div>
      <GlobalStyles />
      <CartContextProvider>
        <Header />

        {/* Hero */}
        <section className="bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <p className="text-sm uppercase tracking-wider text-gray-400 mb-3">Featured</p>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                {featured?.productName || "The best of home entertainment is here"}
              </h1>
              <p className="text-gray-400 mb-8 line-clamp-3 max-w-md">
                {featured?.description ||
                  "Browse a curated catalogue of electronics, gadgets and everyday essentials."}
              </p>
              <div className="flex gap-3">
                <Link
                  href={featured ? `/products/${featured._id}` : "/products"}
                  className="px-6 py-3 rounded-full bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
                >
                  Shop now
                </Link>
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-full border border-gray-600 text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Browse all
                </Link>
              </div>
            </div>
            <div className="order-1 md:order-2 relative aspect-square max-w-md mx-auto w-full">
              {featured?.productImages?.[0] && (
                <Image
                  src={featured.productImages[0]}
                  alt={featured.productName}
                  fill
                  sizes="(max-width: 768px) 90vw, 40vw"
                  className="object-contain"
                  priority
                />
              )}
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="border-b border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7 text-gray-900 flex-shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shop by category */}
        {categories.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((c) => (
                <Link
                  key={c._id}
                  href={`/products?category=${c._id}`}
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-6 text-center transition-colors"
                >
                  <p className="font-medium text-gray-900 mb-1">{c.catagoryName}</p>
                  <p className="text-xs text-gray-500">
                    {c.productCount} product{c.productCount === 1 ? "" : "s"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* New arrivals */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">New arrivals</h2>
            <Link
              href="/products"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              See more →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {newArrivals.slice(0, 5).map((p) => (
              <ProductCard key={p._id} {...p} />
            ))}
          </div>
        </section>

        {/* Per-category sections */}
        {categorySections.map(({ category, products }) => (
          <section key={category._id} className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{category.catagoryName}</h2>
              <Link
                href={`/products?category=${category._id}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                See more →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, 5).map((p) => (
                <ProductCard key={p._id} {...p} />
              ))}
            </div>
          </section>
        ))}

        {/* Newsletter */}
        <section className="bg-gray-50 mt-8">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to our newsletter</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sign up for the latest news and special offers.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                className="flex-1 h-11 px-4 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
              />
              <button
                type="submit"
                className="h-11 px-6 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        <Footer />
      </CartContextProvider>
    </div>
  );
}
