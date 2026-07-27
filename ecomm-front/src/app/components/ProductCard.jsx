"use client";
import React, { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartContext } from "./CartContext";

const ProductCard = ({ _id, productName, productImages, price }) => {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <Link href={`/products/${_id}`} className="block relative aspect-square bg-gray-50 p-4">
        {productImages?.[0] ? (
          <Image
            src={productImages[0]}
            alt={productName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 20.25H6a2.25 2.25 0 0 1-2.25-2.25V6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25ZM12.75 8.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
              />
            </svg>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link
          href={`/products/${_id}`}
          className="text-sm text-gray-700 hover:text-gray-900 line-clamp-2 leading-snug"
          title={productName}
        >
          {productName}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-lg font-bold text-gray-900">${price}</span>
          <button
            onClick={() => addToCart(_id)}
            className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label={`Add ${productName} to cart`}
            title="Add to cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
