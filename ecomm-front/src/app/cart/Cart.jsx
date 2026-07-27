"use client";
import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useSession } from "next-auth/react";
import { CartContext } from "../components/CartContext";

const EMPTY_ADDRESS = {
  label: "Home",
  address: "",
  city: "",
  postalcode: "",
  state: "",
  country: "",
};

const CartItem = ({ prod, quantity }) => {
  const { _id, productName, productImages, price } = prod;
  const { addToCart, removeFromCart, removeAllOfProduct } = useContext(CartContext);

  return (
    <div className="flex gap-4 py-5 border-b border-gray-100 last:border-0">
      <Link
        href={`/products/${_id}`}
        className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100"
      >
        {productImages?.[0] && (
          <Image
            src={productImages[0]}
            alt={productName}
            fill
            sizes="96px"
            className="object-contain p-2"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between gap-3">
          <Link
            href={`/products/${_id}`}
            className="text-sm font-medium text-gray-900 hover:underline line-clamp-2"
          >
            {productName}
          </Link>
          <button
            onClick={() => removeAllOfProduct(_id)}
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            aria-label={`Remove ${productName} from cart`}
            title="Remove"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-1">${price} each</p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center border border-gray-200 rounded-full">
            <button
              onClick={() => removeFromCart(_id)}
              className="w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => addToCart(_id)}
              className="w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="text-base font-semibold text-gray-900">${price * quantity}</span>
        </div>
      </div>
    </div>
  );
};

const MyCart = () => {
  const { cartProducts, clearCart } = useContext(CartContext);
  const { data: session, status } = useSession();

  const [products, setProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...EMPTY_ADDRESS });
  const [saveToBook, setSaveToBook] = useState(true);

  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    if (cartProducts?.length > 0) {
      axios
        .post("/api/cart", { ids: cartProducts })
        .then((resp) => setProducts(resp.data))
        .catch((e) => console.error("Failed to fetch cart products:", e));
    } else {
      setProducts([]);
    }
  }, [cartProducts]);

  useEffect(() => {
    let currentPrice = 0;
    products.forEach((product) => {
      const quant = cartProducts.filter((id) => id === product._id).length;
      currentPrice += product.price * quant;
    });
    setTotalPrice(currentPrice);
  }, [cartProducts, products]);

  const loadAddresses = () => {
    axios
      .get("/api/customer/me")
      .then((resp) => {
        const list = resp.data.data?.addresses || [];
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (preferred) {
          setSelectedAddressId(String(preferred._id));
          setShowNewForm(false);
        } else {
          setShowNewForm(true);
        }
      })
      .catch(() => setShowNewForm(true));
  };

  useEffect(() => {
    if (status === "authenticated") loadAddresses();
  }, [status]);

  const chosenAddress = showNewForm
    ? newAddress
    : addresses.find((a) => String(a._id) === selectedAddressId);

  const addressComplete = !!(
    chosenAddress?.address &&
    chosenAddress?.city &&
    chosenAddress?.postalcode &&
    chosenAddress?.country
  );

  // Re-quote whenever the cart or the chosen address changes. Debounced so
  // typing a new address doesn't fire a carrier API call on every keystroke.
  useEffect(() => {
    if (status !== "authenticated" || !addressComplete || !cartProducts?.length) {
      setQuote(null);
      setQuoteError("");
      return;
    }

    const timer = setTimeout(() => {
      setQuoting(true);
      setQuoteError("");
      axios
        .post("/api/shipping/quote", {
          products: cartProducts,
          address: chosenAddress,
        })
        .then((resp) => setQuote(resp.data))
        .catch((err) => {
          setQuote(null);
          setQuoteError(err.response?.data?.message || "Could not calculate shipping.");
        })
        .finally(() => setQuoting(false));
    }, 600);

    return () => clearTimeout(timer);
  }, [
    status,
    addressComplete,
    cartProducts,
    chosenAddress?.address,
    chosenAddress?.city,
    chosenAddress?.postalcode,
    chosenAddress?.state,
    chosenAddress?.country,
  ]);

  const saveUserCart = async (e) => {
    e.preventDefault();
    setError("");

    const chosen = chosenAddress;

    if (!chosen?.address || !chosen?.city || !chosen?.postalcode || !chosen?.country) {
      setError("Please choose or enter a complete delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      // Optionally add the new address to the customer's book before checkout,
      // so it's there next time.
      if (showNewForm && saveToBook) {
        try {
          await axios.post("/api/customer/addresses", newAddress);
        } catch {
          // Non-fatal — don't block the purchase if saving the address fails.
        }
      }

      const resp = await axios.post("/api/checkout", {
        Name: session?.user?.name || "",
        Address: chosen.address,
        City: chosen.city,
        Postalcode: chosen.postalcode,
        State: chosen.state || "",
        Country: chosen.country,
        products: cartProducts,
      });

      if (resp.data.url) {
        window.location = resp.data.url;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.response?.data?.message || "Something went wrong starting checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors";

  if (!cartProducts?.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-8">
          Fill it with electronics, gadgets and everyday essentials.
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900">Cart</span>
      </nav>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-8">
        {/* Items + address */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-0">
                Cart{" "}
                <span className="text-gray-400 font-normal text-lg">({cartProducts.length})</span>
              </h1>
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear cart
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-5">
              {products.map((product) => (
                <CartItem
                  key={product._id}
                  prod={product}
                  quantity={cartProducts.filter((id) => id === product._id).length}
                />
              ))}
            </div>
          </div>

          {status === "authenticated" && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Delivery address</h2>

              <div className="flex flex-col gap-3">
                {addresses.map((a) => {
                  const id = String(a._id);
                  const selected = !showNewForm && selectedAddressId === id;
                  return (
                    <label
                      key={id}
                      className={`border rounded-xl p-4 flex gap-3 cursor-pointer transition-colors ${
                        selected
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selected}
                        onChange={() => {
                          setSelectedAddressId(id);
                          setShowNewForm(false);
                        }}
                        className="mt-1 w-4 h-4 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{a.label}</span>
                          {a.isDefault && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-900 text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {[a.address, a.city, a.state, a.postalcode, a.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </label>
                  );
                })}

                {!showNewForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm(true);
                      setNewAddress({ ...EMPTY_ADDRESS });
                    }}
                    className="border border-dashed border-gray-300 rounded-xl p-4 text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors text-left flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                    Deliver to a new address
                  </button>
                )}

                {showNewForm && (
                  <div className="border border-gray-900 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">New address</span>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewForm(false)}
                          className="text-xs text-gray-500 hover:text-gray-900"
                        >
                          Use a saved address
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <select
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className={inputClass}
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Street address"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Postal code"
                        value={newAddress.postalcode}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, postalcode: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={saveToBook}
                        onChange={(e) => setSaveToBook(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Save this address for next time
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-32 h-fit">
          <form
            onSubmit={saveUserCart}
            className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4"
          >
            <h2 className="text-lg font-bold text-gray-900">Order summary</h2>

            <div className="flex flex-col gap-2 text-sm border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${quote ? quote.subtotal.toFixed(2) : totalPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {quoting ? (
                  <span className="text-gray-400">Calculating…</span>
                ) : quote ? (
                  <span>${quote.shipping.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">Enter address</span>
                )}
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Sales tax{quote ? ` (${(quote.taxRate * 100).toFixed(2)}%)` : ""}</span>
                {quoting ? (
                  <span className="text-gray-400">—</span>
                ) : quote ? (
                  <span>${quote.tax.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              <div className="flex justify-between text-base font-bold text-gray-900 pt-2">
                <span>Total</span>
                <span>${quote ? quote.total.toFixed(2) : totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {quote?.shippingBreakdown?.length > 1 && (
              <p className="text-xs text-gray-400 -mt-2">
                Shipped in {quote.shippingBreakdown.length} parcels from different sellers.
              </p>
            )}

            {quoteError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
                {quoteError}
              </div>
            )}

            {status !== "authenticated" ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700 mb-1">Sign in to complete your order</p>
                <p className="text-xs text-gray-500 mb-4">
                  So you can track it, and check out faster next time.
                </p>
                <div className="flex gap-2 justify-center">
                  <Link
                    href="/login?next=/cart"
                    className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup?next=/cart"
                    className="px-5 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-white transition-colors"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || quoting || !quote}
                  className="h-11 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {submitting
                    ? "Redirecting to payment…"
                    : quoting
                      ? "Calculating shipping…"
                      : !quote
                        ? "Choose a delivery address"
                        : "Continue to payment"}
                </button>
              </>
            )}

            <p className="text-xs text-gray-400 text-center">Secure payment powered by Stripe.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyCart;