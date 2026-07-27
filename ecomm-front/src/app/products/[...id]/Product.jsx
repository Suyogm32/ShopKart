"use client";
import React, { useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CartContext } from "@/app/components/CartContext";

const Product = ({ prod }) => {
  const [idx, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useContext(CartContext);

  const images = prod?.productImages || [];

  const handleAdd = () => {
    // CartContext stores one entry per unit, so adding N means N pushes.
    for (let i = 0; i < qty; i++) addToCart(prod._id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!prod?._id) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">Loading product…</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{prod.productName}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="flex gap-4">
          {images.length > 1 && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setIndex(index)}
                  className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden bg-gray-50 transition-colors ${
                    idx === index ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${prod.productName} thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 aspect-square bg-gray-50 rounded-xl border border-gray-100">
            {images[idx] && (
              <Image
                src={images[idx]}
                alt={prod.productName}
                fill
                sizes="(max-width: 768px) 90vw, 45vw"
                className="object-contain p-6"
                priority
              />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{prod.productName}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">${prod.price}</span>
            <span className="text-sm text-gray-500">Inclusive of all taxes</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-gray-200 rounded-full">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 h-11 px-6 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              {added ? (
                "Added to cart ✓"
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                  </svg>
                  Add to cart
                </>
              )}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">About this item</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {prod.description || "No description provided for this product."}
            </p>
          </div>

          {prod.properties && Object.keys(prod.properties).length > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Specifications</h2>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                {Object.entries(prod.properties).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <dt className="text-gray-500 capitalize">{key}</dt>
                    <dd className="text-gray-900">{String(value)}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-900">🚚</span> Free shipping over $80
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-900">↩️</span> 30-day returns
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
