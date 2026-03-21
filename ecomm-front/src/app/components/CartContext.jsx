"use client";
import React,{Children, createContext, useEffect, useState} from "react";

export const CartContext=createContext({});

const CartContextProvider = ({children}) => {
  const ls=typeof window !== "undefined" ? window.localStorage : null;
    const [cartProducts,setCartProducts]=useState([]);
    useEffect(()=>{
      if(ls && ls.getItem('cart')){
        console.log(JSON.parse(ls.getItem('cart')));
        setCartProducts(JSON.parse(ls.getItem('cart')));
      }
    },[]);
    useEffect(()=>{
      if(cartProducts?.length>0){
        ls?.setItem('cart',JSON.stringify(cartProducts));
      }
    },[cartProducts]);
    
    const addToCart=(id)=>{
      setCartProducts(prev=>[...prev,id]);
      console.log("Products in cart are ", cartProducts);
    }
  return (
    <CartContext.Provider value={{cartProducts,setCartProducts,addToCart}}>{children}</CartContext.Provider>
  )
}

export default CartContextProvider