"use client";
import React, { useState } from "react";
import ProductForm from "@/app/component/ProductForm";
import Applayout from "@/app/component/Applayout";

const NewProduct = () => {
  return (
    <Applayout>
      <h1>New Product</h1>
    <ProductForm/>
    </Applayout>
  )
};

export default NewProduct;
