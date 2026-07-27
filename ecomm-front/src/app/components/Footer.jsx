import React from "react";
import Link from "next/link";

const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 mt-16">
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 text-white text-lg font-bold mb-3">
          <span className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center text-sm">
            S
          </span>
          Shopkart
        </div>
        <p className="text-sm leading-relaxed">
          Electronics, gadgets and everyday essentials — delivered fast, tracked end to end.
        </p>
      </div>

      <div>
        <h3 className="text-white text-sm font-semibold mb-3">Shop</h3>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/products" className="hover:text-white transition-colors">
              All products
            </Link>
          </li>
          <li>
            <Link href="/cart" className="hover:text-white transition-colors">
              Your cart
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-white text-sm font-semibold mb-3">Need help?</h3>
        <ul className="flex flex-col gap-2 text-sm">
          <li>Order tracking</li>
          <li>Returns &amp; refunds</li>
          <li>Shipping policy</li>
          <li>FAQs</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white text-sm font-semibold mb-3">Contact</h3>
        <ul className="flex flex-col gap-2 text-sm">
          <li>215 Clayton St, San Francisco, CA</li>
          <li>support@shopkart.example</li>
          <li>1-800-234-5678</li>
        </ul>
      </div>
    </div>

    <div className="border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-center">
        © {new Date().getFullYear()} Shopkart. Built as a portfolio project.
      </div>
    </div>
  </footer>
);

export default Footer;
