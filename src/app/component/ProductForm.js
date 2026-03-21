"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { ReactSortable } from "react-sortablejs";


const ProductForm = ({
  _id,
  productName: existingProductName,
  description: existingDescription,
  price: existingPrice,
  productImages: existingProductImages,
  category:assignedCategory,
  properties:existingProperties
}) => {
  const [productName, setProductName] = useState(existingProductName || "");
  const [description, setDescription] = useState(existingDescription || "");
  const [price, setPrice] = useState(existingPrice || 0); 
  const [productImages, setProductImages] = useState(existingProductImages || []);
  const [goToProducts, setGoToProducts] = useState(false);
  const [error, setError] = useState("");
  const [isUploading,setIsUploading]=useState(false);
  const [category,setCategory]=useState(assignedCategory || '');
  const [categories,setCatagories]=useState([]);
  const [productProperties,setProductProperties]=useState(existingProperties || {});
  const ss=typeof window !== "undefined" ? window.sessionStorage : null;
  const router = useRouter();

  useEffect(()=>{
    axios.get('/api/catagories')
      .then(resp=>setCatagories(resp.data));
  },[]);
  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      const sellerId=JSON.parse(ss.getItem('user'))?.userId;
      console.log(sellerId);
      const currentData = { productName, description, price,productImages,category,properties:productProperties,sellerId};
      if (_id) {
        //This is for updating a product in DB
        const response = await axios.put("/api/products", {...currentData, _id});
        console.log("Product updated successfully:", response.data);
      } else {
        //this is for creating a new product in DB
        const response = await axios.post("/api/products", currentData);
        console.log("Product created successfully:", response.data);
      }
      // Reset form fields and error state
      setProductName("");
      setDescription("");
      setPrice("");
      setError("");
      setGoToProducts(true);
    } catch (error) {
      // Handle Axios POST request error
      console.error("Error creating product:", error);
      setError("Failed to create product. Please try again later.");
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

  const updateImagesOrder=(images)=>{
    setProductImages(images);
  }

  let propertiesToFill=[];
  if(categories.length>0 && category){
    // console.log("All Catagories are ",categories);
    let selectedCatProps=categories.find(({_id})=>_id===category);
    // console.log("selectedCatProps are ->",selectedCatProps);
    if(selectedCatProps?.properties.length>0){
      propertiesToFill.push(...selectedCatProps?.properties);
    }
    // console.log('current array of props',propertiesToFill.length);
    while(selectedCatProps?.parentCatagory?._id){
      let parentProperties=categories.find(({_id})=>_id===selectedCatProps.parentCatagory._id);
      if(parentProperties.properties.length>0){
        propertiesToFill.push(...parentProperties.properties);
      }
      selectedCatProps=parentProperties
    }
    console.log('full array of props',propertiesToFill.length);
    console.log('full array of props',propertiesToFill);
  }

  const setProductProp=(propName,propValue)=>{
    setProductProperties(prev=>{
      const newProps={...prev};
      newProps[propName]=propValue;
      return newProps;
    })
  };
  return (
    <form onSubmit={saveProduct}>

      <label>Product Name</label>
      <input
        type="text"
        placeholder="Enter Product name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
      />
        <label>Product Category</label>
        <select value={category} onChange={e=> setCategory(e.target.value)}>
          <option value="">Uncatagorized</option>
          { categories?.length && 
            categories.map((category,index)=>(
              <option key={index} value={category._id}>{category.catagoryName}</option>
            ))

          }
        </select>
        {propertiesToFill.length>0 && 
          propertiesToFill.map((p,index)=>(
            <div key={index} className="">
             <label> {p.name[0].toUpperCase()+p.name.substring(1)}</label>
             <div>
             <select 
                value={productProperties[p.name]} 
                onChange={(e)=>setProductProp(p.name,e.target.value)}
              >
                {p.values?.map((val,index)=>(
                    <option value={val} key={index}>{val}</option>
                  ))    
                }
             </select>
             </div> 
            </div>
          ))
        }
      <label>Product Images</label>
      <div className="flex flex-wrap gap-2 mb-2">
        <ReactSortable list={productImages} className="flex flex-wrap gap-2" setList={updateImagesOrder}>
        {!!productImages?.length &&
          productImages.map((link) => (
            <div key={link} className="inline-block h-24 p-2 shadow-md rounded-sm">
              <img src={link} alt={link}  className="rounded-sm"/>
            </div>
          ))}
          </ReactSortable>
          {
            isUploading && (
              <div className="h-24 bg-gray-200 p-1 flex items-center">
                <Spinner/>
                </div>
            )
          }

        <label className="w-24 h-24 flex flex-col items-center justify-center text-sm rounded-lg bg-gray-200">
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
      {!productImages?.length && <div>No images of product.</div>}
      

      <label>Description</label>
      <textarea
        placeholder="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea>

      <label>Price</label>
      <input
        type="number"
        placeholder="price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button className="btn-primary" type="submit">
        Save
      </button>

    </form>
  );
};

export default ProductForm;
