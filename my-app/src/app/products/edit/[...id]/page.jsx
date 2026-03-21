"use client";
import React, { useEffect, useState } from 'react';
import Applayout from "@/app/component/Applayout";
import { usePathname } from 'next/navigation';
import axios from 'axios';
import ProductForm from '@/app/component/ProductForm';
export default function EditPage(){
  const [productInfo,setProductInfo]=useState(null);
    const pathname= usePathname();
    const patharr= pathname.split("/");
    const id=patharr[3];
    useEffect(()=>{
      if(!id){
        return;
      }
      axios.get('/api/products?id='+id).then(resp=>{
        console.log(resp.data);
        setProductInfo(resp.data);
      })
    },[id]);

    return(
        <Applayout>
            <h1>Edit Product</h1>
            {productInfo && (
                <ProductForm {...productInfo}/>
            )}
        </Applayout>
    )
}  