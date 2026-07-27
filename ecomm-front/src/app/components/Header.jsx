"use client";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CartContext } from "./CartContext";

const Header = () => {
  const [showNav, setShowNav] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const { cartProducts } = useContext(CartContext);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = cartProducts?.length || 0;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => setCategories([]));
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    setShowNav(false);
  };

  const topCategories = categories.filter((c) => !c.parentCatagory).slice(0, 6);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Utility bar */}
      <div className="bg-gray-900 text-gray-300 text-xs">
        <div className="max-w-6xl mx-auto px-4 h-11 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <span>
            24/7 customer service <strong className="text-white">1-800-234-5678</strong>
          </span>
          <Link href="/track" className="hidden sm:block hover:text-white transition-colors">
            Track your order
          </Link>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 flex-shrink-0"
          >
            <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">
              S
            </span>
            <span className="hidden sm:inline">Shopkart</span>
          </Link>

          <form onSubmit={onSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for products…"
                className="w-full h-10 pl-4 pr-10 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center"
                aria-label="Search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1 ml-auto">
            <Link
              href={status === "authenticated" ? "/account" : "/login"}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={status === "authenticated" ? "Your account" : "Sign in"}
              title={status === "authenticated" ? session?.user?.name || "Account" : "Sign in"}
            >
              {status === "authenticated" ? (
                <span className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center">
                  {(session?.user?.name || "?").trim()[0]?.toUpperCase()}
                </span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setShowNav((p) => !p)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={showNav ? "Close menu" : "Open menu"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                {showNav ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div className="hidden lg:block border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-11 flex items-center gap-6 overflow-x-auto">
          <Link
            href="/products"
            className={`text-sm font-medium whitespace-nowrap transition-colors ${
              pathname === "/products" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All products
          </Link>
          {topCategories.map((c) => (
            <Link
              key={c._id}
              href={`/products?category=${c._id}`}
              className="text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap transition-colors"
            >
              {c.catagoryName}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      {showNav && (
        <div className="lg:hidden border-b border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            <form onSubmit={onSearch}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for products…"
                className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
              />
            </form>
            <Link
              href="/products"
              onClick={() => setShowNav(false)}
              className="px-2 py-2 text-sm font-medium text-gray-900"
            >
              All products
            </Link>
            {topCategories.map((c) => (
              <Link
                key={c._id}
                href={`/products?category=${c._id}`}
                onClick={() => setShowNav(false)}
                className="px-2 py-2 text-sm text-gray-600"
              >
                {c.catagoryName}
              </Link>
            ))}
            <Link
              href={status === "authenticated" ? "/account" : "/login"}
              onClick={() => setShowNav(false)}
              className="px-2 py-2 text-sm text-gray-600"
            >
              {status === "authenticated" ? "Your account" : "Sign in"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
