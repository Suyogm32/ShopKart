"use client";
import React, { createContext, useEffect, useState } from "react";

export const CartContext = createContext({});

const CartContextProvider = ({ children }) => {
  const ls = typeof window !== "undefined" ? window.localStorage : null;
  const [cartProducts, setCartProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ls && ls.getItem("cart")) {
      setCartProducts(JSON.parse(ls.getItem("cart")));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Persist unconditionally once the initial load has happened. The previous
    // version skipped writing when the cart was empty, so removing the last
    // item left the old cart in localStorage and it reappeared on refresh.
    if (!loaded) return;
    ls?.setItem("cart", JSON.stringify(cartProducts));
  }, [cartProducts, loaded]);

  const addToCart = (id) => {
    setCartProducts((prev) => [...prev, id]);
  };

  const removeFromCart = (id) => {
    setCartProducts((prev) => {
      const arr = [...prev];
      const index = arr.indexOf(id);
      if (index > -1) arr.splice(index, 1);
      return arr;
    });
  };

  const removeAllOfProduct = (id) => {
    setCartProducts((prev) => prev.filter((pid) => pid !== id));
  };

  const clearCart = () => setCartProducts([]);

  return (
    <CartContext.Provider
      value={{
        cartProducts,
        setCartProducts,
        addToCart,
        removeFromCart,
        removeAllOfProduct,
        clearCart,
        loaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContextProvider;
