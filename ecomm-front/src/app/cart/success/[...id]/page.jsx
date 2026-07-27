"use client";
import React, { useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalStyles } from "@/app/page";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CartContextProvider, { CartContext } from "@/app/components/CartContext";

const SuccessContent = () => {
  const { clearCart, loaded } = useContext(CartContext);
  const pathname = usePathname();
  const orderId = pathname.split("/").filter(Boolean).pop();

  useEffect(() => {
    // Wait for the provider to finish loading from localStorage — clearing
    // before that just gets overwritten when the load effect runs.
    if (loaded) clearCart();
  }, [loaded]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment successful</h1>
      <p className="text-sm text-gray-500 mb-6">
        Your order has been placed. A confirmation email is on its way.
      </p>

      {orderId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 inline-block">
          <p className="text-xs text-gray-500 mb-1">Your order ID</p>
          <p className="font-mono text-sm text-gray-900 break-all">{orderId}</p>
          <p className="text-xs text-gray-400 mt-2">Save this to track or cancel your order.</p>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/track"
          className="px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Track your order
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
};

const Success = () => (
  <CartContextProvider>
    <GlobalStyles />
    <Header />
    <SuccessContent />
    <Footer />
  </CartContextProvider>
);

export default Success;
