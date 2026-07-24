"use client";
import React, { useEffect, useState } from "react";
import Applayout from "@/app/component/Applayout";
import Link from "next/link";
import axios from "axios";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import toast from "react-hot-toast";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(`/api/products?page=${page}`).then((resp) => {
      setProducts(resp.data.data);
      setTotalPages(resp.data.pagination.totalPages);
    });
  }, [page]);

  const handleDelete = (product, index) => {
    confirmAlert({
      title: "Confirm deletion",
      message: `Delete "${product.productName}"?`,
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            // Optimistic update — remove immediately, don't wait for the server
            setProducts((prev) => prev.filter((p) => p._id !== product._id));
            try {
              await axios.delete("/api/products?id=" + product._id);
              toast.success("Product deleted.");
            } catch (error) {
              console.error("Failed to delete product:", error);
              // Roll back — put it back where it was
              setProducts((prev) => {
                const next = [...prev];
                next.splice(index, 0, product);
                return next;
              });
              toast.error("Failed to delete product. Please try again.");
            }
          },
        },
        { label: "No", onClick: () => {} },
      ],
    });
  };

  return (
    <Applayout className="px-2">
      <div className="flex items-center justify-between mb-4">
        <h1>Products</h1>
        <Link className="btn-primary" href={"/products/new"}>
          Add new product
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {products?.map((product, index) => (
          <div
            key={product._id}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
              {product.productImages?.[0] && (
                <img
                  src={product.productImages[0]}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">{product.productName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Rs. {product.price} · {product.stock ?? 0} in stock
              </p>
            </div>
            <div className="flex gap-2">
              <Link className="btn-default" href={"/products/edit/" + product._id}>
                Edit
              </Link>
              <button className="btn-red" onClick={() => handleDelete(product, index)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center text-gray-700 dark:text-gray-300">
          <button
            className="btn-default"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-default"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </Applayout>
  );
};

export default Products;
