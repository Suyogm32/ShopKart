"use client";
import React from "react";
import Link from "next/link";
import { GlobalStyles } from "@/app/page";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CartContextProvider from "@/app/components/CartContext";

const Canceled = () => {
  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment cancelled</h1>
        <p className="text-sm text-gray-500 mb-8">
          Your order wasn&apos;t completed and you haven&apos;t been charged. Your cart is still
          saved if you&apos;d like to try again.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/cart"
            className="px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Back to cart
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Continue shopping
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">Need help? Contact ecomm.support@gmail.com</p>
      </div>

      <Footer />
    </CartContextProvider>
  );
};

export default Canceled;
