"use client";
import React, { useEffect, useState } from "react";
import Applayout from "@/app/component/Applayout";
import ProductForm from "@/app/component/ProductForm";
import axios from "axios";
import { confirmToast } from "@/lib/confirmToast";
import toast from "react-hot-toast";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [panelProduct, setPanelProduct] = useState(null);
  const panelOpen = panelProduct !== null;

  const fetchProducts = () => {
    axios.get(`/api/products?page=${page}`).then((resp) => {
      setProducts(resp.data.data);
      setTotalPages(resp.data.pagination.totalPages);
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setPanelProduct(null);
    };
    if (panelOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [panelOpen]);

  const handleDelete = (product, index) => {
    confirmToast(`Delete "${product.productName}"?`, async () => {
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      try {
        await axios.delete("/api/products?id=" + product._id);
        toast.success("Product deleted.");
      } catch (error) {
        console.error("Failed to delete product:", error);
        setProducts((prev) => {
          const next = [...prev];
          next.splice(index, 0, product);
          return next;
        });
        toast.error("Failed to delete product. Please try again.");
      }
    });
  };

  const closePanel = () => setPanelProduct(null);
  const handleSaved = () => {
    closePanel();
    fetchProducts();
  };

  return (
    <Applayout className="px-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-0">Products</h1>
        <button className="btn-primary" onClick={() => setPanelProduct({})}>
          Add new product
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products?.map((product, index) => (
          <div
            key={product._id}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm flex flex-col"
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
              {product.productImages?.[0] ? (
                <img
                  src={product.productImages[0]}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
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
            </div>
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p
                className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate"
                title={product.productName}
              >
                {product.productName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Rs. {product.price} · {product.stock ?? 0} in stock
              </p>
              <div className="flex gap-2 mt-auto pt-2">
                <button
                  className="btn-icon-edit"
                  onClick={() => setPanelProduct(product)}
                  aria-label="Edit product"
                  title="Edit"
                >
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
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
                <button
                  className="btn-icon-delete"
                  onClick={() => handleDelete(product, index)}
                  aria-label="Delete product"
                  title="Delete"
                >
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
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
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

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          panelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closePanel}
      />

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-gray-50 dark:bg-gray-900 shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!panelOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0">
            {panelProduct?._id ? `Edit "${panelProduct.productName}"` : "Add product"}
          </h2>
          <button
            className="btn-icon-edit"
            onClick={closePanel}
            aria-label="Close panel"
            title="Close"
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
        <div className="flex-1 overflow-y-auto">
          {panelOpen && (
            <ProductForm
              _id={panelProduct._id}
              productName={panelProduct.productName}
              description={panelProduct.description}
              price={panelProduct.price}
              stock={panelProduct.stock}
              productImages={panelProduct.productImages}
              category={panelProduct.category}
              properties={panelProduct.properties}
              onSuccess={handleSaved}
              hideInternalActions
            />
          )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button className="btn-primary" type="submit" form="product-form">
            Save
          </button>
          <button className="btn-default" type="button" onClick={closePanel}>
            Cancel
          </button>
        </div>
      </div>
    </Applayout>
  );
};

export default Products;
