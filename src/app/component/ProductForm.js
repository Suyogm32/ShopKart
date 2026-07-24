"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { ReactSortable } from "react-sortablejs";
import toast from "react-hot-toast";

const ProductForm = ({
  _id,
  productName: existingProductName,
  description: existingDescription,
  price: existingPrice,
  stock: existingStock,
  productImages: existingProductImages,
  category: assignedCategory,
  properties: existingProperties,
  onSuccess,
  hideInternalActions,
}) => {
  const [productName, setProductName] = useState(existingProductName || "");
  const [description, setDescription] = useState(existingDescription || "");
  const [price, setPrice] = useState(existingPrice || 0);
  const [productImages, setProductImages] = useState(existingProductImages || []);
  const [goToProducts, setGoToProducts] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState(assignedCategory || "");
  const [categories, setCatagories] = useState([]);
  const [productProperties, setProductProperties] = useState(existingProperties || {});
  const [stock, setStock] = useState(existingStock ?? 0);
  const router = useRouter();

  useEffect(() => {
    axios.get("/api/catagories").then((resp) => setCatagories(resp.data.data));
  }, []);

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      const currentData = {
        productName,
        description,
        price,
        stock,
        productImages,
        category,
        properties: productProperties,
      };
      if (_id) {
        await axios.put("/api/products", { ...currentData, _id });
        toast.success("Product updated.");
      } else {
        await axios.post("/api/products", currentData);
        toast.success("Product created.");
      }
      setProductName("");
      setDescription("");
      setPrice("");
      setError("");
      if (onSuccess) {
        onSuccess();
      } else {
        setGoToProducts(true);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setError("Failed to create product. Please try again later.");
      toast.error("Failed to save product.");
    }
  };

  useEffect(() => {
    if (goToProducts) {
      router.push("/products");
    }
  }, [goToProducts, router]);

  const uploadImages = async (e) => {
    const files = e.target?.files;
    setIsUploading(true);
    if (files?.length > 0) {
      const data = new FormData();
      for (let i = 0; i < files.length; i++) {
        data.append("files", files[i]);
      }
      const resp = await axios.post("/api/upload", data);
      setProductImages((oldImages) => {
        return [...oldImages, ...resp.data.pImageLink];
      });
    }
    setIsUploading(false);
  };

  const updateImagesOrder = (images) => {
    setProductImages(images);
  };

  let propertiesToFill = [];
  if (categories.length > 0 && category) {
    let selectedCatProps = categories.find(({ _id }) => _id === category);
    if (selectedCatProps?.properties.length > 0) {
      propertiesToFill.push(...selectedCatProps?.properties);
    }
    while (selectedCatProps?.parentCatagory?._id) {
      let parentProperties = categories.find(
        ({ _id }) => _id === selectedCatProps.parentCatagory._id
      );
      if (parentProperties.properties.length > 0) {
        propertiesToFill.push(...parentProperties.properties);
      }
      selectedCatProps = parentProperties;
    }
  }

  const setProductProp = (propName, propValue) => {
    setProductProperties((prev) => {
      const newProps = { ...prev };
      newProps[propName] = propValue;
      return newProps;
    });
  };

  return (
    <form id="product-form" onSubmit={saveProduct} className="flex flex-col gap-5 p-5">
      {/* Section 1: identity */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-4">
        <div>
          <label>Product Name</label>
          <input
            type="text"
            placeholder="Enter Product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            placeholder="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label>Product Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Uncatagorized</option>
            {categories?.length > 0 &&
              categories.map((category, index) => (
                <option key={index} value={category._id}>
                  {category.catagoryName}
                </option>
              ))}
          </select>
        </div>

        {propertiesToFill.length > 0 &&
          propertiesToFill.map((p, index) => (
            <div key={index}>
              <label>{p.name[0].toUpperCase() + p.name.substring(1)}</label>
              <select
                value={productProperties[p.name]}
                onChange={(e) => setProductProp(p.name, e.target.value)}
              >
                {p.values?.map((val, index) => (
                  <option value={val} key={index}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          ))}
      </div>

      {/* Section 2: images */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <label className="block mb-2">Product Images</label>
        <div className="flex flex-wrap gap-2 mb-2">
          <ReactSortable
            list={productImages}
            className="flex flex-wrap gap-2"
            setList={updateImagesOrder}
          >
            {!!productImages?.length &&
              productImages.map((link) => (
                <div
                  key={link}
                  className="inline-block h-24 p-2 bg-gray-50 dark:bg-gray-900 shadow-md rounded-sm"
                >
                  <img src={link} alt={link} className="rounded-sm h-full" />
                </div>
              ))}
          </ReactSortable>
          {isUploading && (
            <div className="h-24 w-24 bg-gray-50 dark:bg-gray-900 p-1 flex items-center justify-center rounded-lg">
              <Spinner />
            </div>
          )}

          <label className="w-24 h-24 flex flex-col items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload
            <input
              type="file"
              name="image"
              id="file"
              multiple
              className="hidden"
              onChange={uploadImages}
            />
          </label>
        </div>
        {!productImages?.length && (
          <div className="text-sm text-gray-400 dark:text-gray-500">No images of product.</div>
        )}
      </div>

      {/* Section 3: price & stock */}
      <div className="bg-white dark:bg-gray-800 border border-primary/30 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-4">
        <div className="flex-1">
          <label>Price</label>
          <input
            type="number"
            placeholder="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label>Stock</label>
          <input
            type="number"
            placeholder="stock quantity"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      {!hideInternalActions && (
        <button className="btn-primary" type="submit">
          Save
        </button>
      )}
    </form>
  );
};

export default ProductForm;
