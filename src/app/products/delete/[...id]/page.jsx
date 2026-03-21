"use client";
import Applayout from "@/app/component/Applayout";
import React,{useState,useEffect} from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
const DeleteProduct = () => {
  const [productInfo, setProductInfo] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const patharr = pathname.split("/");
  const id = patharr[3];
  console.log(id);
  useEffect(() => {
    if (!id) {
      return;
    }
    axios.get("/api/products?id=" + id).then((resp) => {
      console.log(resp.data);
      setProductInfo(resp.data);
    });
  }, [id]);

  function goBack() {
    router.push("/products");
  }
  const deleteProduct=async()=>{
    await axios.delete("/api/products?id=" + id);
    goBack();
  }
  return (
    <Applayout>
      <h1 className="text-center">Do you really want to delete {productInfo?.productName}?</h1>
      <div className="flex gap-2 justify-center">
        <button className="btn-red" onClick={deleteProduct}>Yes</button>
        <button className='btn-default' onClick={goBack}>No</button>
      </div>
    </Applayout>
  );
};

export default DeleteProduct;
