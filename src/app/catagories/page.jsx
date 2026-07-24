"use client";
import React, { useState, useEffect } from "react";
import Applayout from "../component/Applayout";
import axios from "axios";
import { confirmToast } from "@/lib/confirmToast";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const GRID_COLS = "grid grid-cols-[1fr_1fr_200px] items-center gap-2";

const Catagories = () => {
  const [catagoryName, setCatagoryName] = useState("");
  const [catagories, setCatagories] = useState([]);
  const [parentCatagory, setParentCatagory] = useState("");
  const [editedCategory, setEditedCategory] = useState(null);
  const [properties, setMyProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const formVisible = showForm || !!editedCategory;

  useEffect(() => {
    fetchCtagories();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") resetForm();
    };
    if (formVisible) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [formVisible]);

  const fetchCtagories = () => {
    axios.get("/api/catagories").then((resp) => {
      setCatagories(resp.data.data);
    });
  };

  const resetForm = () => {
    setCatagoryName("");
    setParentCatagory("");
    setMyProperties([]);
    setEditedCategory(null);
    setShowForm(false);
  };

  const saveCatagory = async (e) => {
    e.preventDefault();
    const data = {
      catagoryName,
      parentCatagory: parentCatagory || undefined,
      properties: properties.map((p) => ({
        name: p.name,
        values: p.values.split(","),
      })),
    };
    if (editedCategory) {
      data._id = editedCategory._id;
      await axios.put("/api/catagories", data);
      toast.success("Category updated.");
    } else {
      await axios.post("/api/catagories", data);
      toast.success("Category created.");
    }
    resetForm();
    fetchCtagories();
  };

  const editCategory = (category) => {
    setEditedCategory(category);
    setShowForm(true);
    setCatagoryName(category.catagoryName);
    setParentCatagory(category.parentCatagory?._id);
    setMyProperties(
      category?.properties.map(({ name, values }) => ({
        name,
        values: values.join(","),
      }))
    );
  };

  function goBack() {
    router.push("/catagories");
  }

  const onDelete = (category) => {
    axios
      .delete("/api/catagories?id=" + category._id)
      .then(() => toast.success("Category deleted."))
      .catch((error) => {
        console.error("Failed to delete category:", error);
        toast.error("Failed to delete category.");
      });
    goBack();
  };

  const addProperty = () => {
    setMyProperties((prev) => [...prev, { name: "", values: "" }]);
  };

  const handlePropertyNameChange = (newName, property, index) => {
    setMyProperties((prev) => {
      const next = [...prev];
      next[index].name = newName;
      return next;
    });
  };

  const handlePropertyValuesChange = (newValues, property, index) => {
    setMyProperties((prev) => {
      const next = [...prev];
      next[index].values = newValues;
      return next;
    });
  };

  const removeProperty = (indexToRemove) => {
    setMyProperties((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <Applayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-0">Categories</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add category
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
        <div
          className={`${GRID_COLS} px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}
        >
          <span>Category name</span>
          <span>Parent category</span>
          <span>Actions</span>
        </div>
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
          {catagories?.length > 0 &&
            catagories.map((category) => (
              <div key={category._id} className={`${GRID_COLS} px-4 py-3`}>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {category.catagoryName}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {category?.parentCatagory?.catagoryName || "—"}
                </span>
                <span className="flex gap-2">
                  <button
                    className="btn-icon-edit"
                    onClick={() => editCategory(category)}
                    aria-label="Edit category"
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
                    onClick={() => {
                      confirmToast(
                        `Are you sure you want to delete ${category.catagoryName}?`,
                        () => onDelete(category)
                      );
                    }}
                    aria-label="Delete category"
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
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          formVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={resetForm}
      />

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          formVisible ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!formVisible}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0">
            {editedCategory ? `Edit "${editedCategory.catagoryName}"` : "Add category"}
          </h2>
          <button
            className="btn-icon-edit"
            onClick={resetForm}
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

        <form
          id="category-form"
          onSubmit={saveCatagory}
          className="flex-1 overflow-y-auto flex flex-col"
        >
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label>Category name</label>
              <input
                type="text"
                value={catagoryName}
                onChange={(e) => setCatagoryName(e.target.value)}
              />
            </div>

            <div>
              <label>Parent category</label>
              <select value={parentCatagory} onChange={(e) => setParentCatagory(e.target.value)}>
                <option value="0">No parent category</option>
                {catagories?.length > 0 &&
                  catagories.map((category) => (
                    <option value={category._id} key={category._id}>
                      {category.catagoryName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 p-5 flex-1">
            <label className="block mb-2">Properties</label>
            <div className="flex flex-col gap-2">
              {properties?.map((property, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Property {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="w-8 h-8 btn-icon-delete"
                      aria-label="Remove property"
                      title="Remove"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="mb-0"
                    value={property.name}
                    onChange={(e) => handlePropertyNameChange(e.target.value, property, index)}
                    placeholder="Property name (e.g. color)"
                  />
                  <input
                    type="text"
                    className="mb-0"
                    onChange={(e) => handlePropertyValuesChange(e.target.value, property, index)}
                    value={property.values}
                    placeholder="Values, comma separated"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addProperty}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 self-start mt-1"
              >
                <span className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </span>
                Add property
              </button>
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button className="btn-primary" type="submit" form="category-form">
            Save
          </button>
          <button className="btn-default" type="button" onClick={resetForm}>
            Cancel
          </button>
        </div>
      </div>
    </Applayout>
  );
};

export default Catagories;
