"use client";
import React, { useState, useEffect } from "react";
import Applayout from "../component/Applayout";
import axios from "axios";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useRouter } from "next/navigation";
const Catagories = () => {
  const [catagoryName, setCatagoryName] = useState("");
  const [catagories, setCatagories] = useState([]);
  const [parentCatagory, setParentCatagory] = useState("");
  const [editedCategory, setEditedCategory] = useState(null);
  const [properties,setMyProperties]=useState([]);
  const router = useRouter();
  useEffect(() => {
    fetchCtagories();
  }, []);

  const fetchCtagories = () => {
    axios.get("/api/catagories").then((resp) => {
      setCatagories(resp.data);
    });
  };

  const saveCatagory = async (e) => {
    e.preventDefault();
    const data = { 
      catagoryName, 
      parentCatagory:parentCatagory || undefined,
      properties:properties.map(p=>({
        name:p.name,
        values:p.values.split(','),
      })), 
    };
    if (editedCategory) {
      data._id = editedCategory._id;
      const resp = await axios.put("/api/catagories", data);
      console.log(resp);
    } else {
      const resp = await axios.post("/api/catagories", data);
      console.log(resp);
    }
    setCatagoryName("");
    setParentCatagory("");
    setMyProperties([]);
    setEditedCategory(null);
    fetchCtagories();
  };
  const editCategory = (category) => {
    console.log(category);
    setEditedCategory(category);
    setCatagoryName(category.catagoryName);
    console.log(category.parentCatagory?.catagoryName);
    setParentCatagory(category.parentCatagory?._id);
    setMyProperties(
      category?.properties.map(({name,values})=>({
        name,
        values:values.join(',')
      }))
      );
  };
  function goBack() {
    router.push("/catagories");
  }
  const onDelete = (category) => {
    console.log(category);
    axios
      .delete("/api/catagories?id=" + category._id)
      .then((resp) => console.log(resp.data));
    goBack();
  };

  const addProperty=()=>{
    setMyProperties(prev=>{
      return [...prev,{name:'',values:''}]
    })
  };

  const handlePropertyNameChange=(newName,property,index)=>{
    setMyProperties(prev=>{
      const properties=[...prev];
      properties[index].name=newName;
      return properties;
    });
  };

  const handlePropertyValuesChange=(newValues,property,index)=>{
    setMyProperties(prev=>{
      const properties=[...prev];
      properties[index].values=newValues;
      return properties;
    });
  };

  const removeProperty=(indexToRemove)=>{
    setMyProperties(prev=>{
      return [...prev].filter((p,pIndex)=>{
        return pIndex!==indexToRemove;
      });
    });
  };

  return (
    <Applayout>
      <h1>Catagories</h1>
      <h2>
        {editedCategory
          ? `Edit Category ${editedCategory.catagoryName}`
          : "Create New category"}
      </h2>
      <form onSubmit={saveCatagory}>
        <label className="mt-3">Catagory Name</label>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            name="catagoryName"
            id="catagoryName"
            className="mb-0"
            value={catagoryName}
            onChange={(e) => setCatagoryName(e.target.value)}
          />
          <label>Choose parent Category</label>
          <select
            className="mb-0"
            value={parentCatagory}
            onChange={(e) => setParentCatagory(e.target.value)}
          >
            <option value="0">No parent Category</option>
            {catagories?.length > 0 &&
              catagories.map((category, index) => (
                <option value={category._id} key={category._id}>
                  {category.catagoryName}
                </option>
              ))}
          </select>
          <div className="flex flex-col gap-2">
            <label className="mb-0">Properties</label>
            <button type="button" className="btn-default p-1 text-sm" onClick={addProperty}>
              Add new Property
            </button>
            {
              properties?.length>0 && properties.map((property,index)=>(
                <div className="flex gap-1" key={index}>
                  <input  type="text"
                  className="mb-0" 
                    value={property.name}
                    onChange={(e)=>handlePropertyNameChange(e.target.value,property,index)} 
                    placeholder="Property name (example:color)"/>
                  <input  
                    type="text"
                    className="mb-0" 
                    onChange={(e)=>handlePropertyValuesChange(e.target.value,property,index)}
                    value={property.values} 
                    placeholder="values, comma separated"/>
                  <button 
                    type="button"
                    onClick={()=>removeProperty(index)} 
                    className="btn-red text-sm">
                      Remove
                  </button>
                </div>
              ))
            }
          </div>
          <div className="flex gap-2">
          <button
            className="btn-primary w-16 text-center p-1 text-base mt-3"
            type="submit"
          >
            Save
          </button>
          {editedCategory && (
          <button
            className="btn-primary w-20 text-center p-1 text-base mt-3"
            type="button"
            onClick={()=>{
              setEditedCategory(null);
              setCatagoryName('');
              setParentCatagory('');
              setMyProperties([]);
            }}
          >
            Cancel
          </button>
          )}
          </div>
        </div>
      </form>
      {!editedCategory && (
      <table className="basic mt-4">
        <thead>
          <tr>
            <td>Category Name</td>
            <td>Parent Category</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody>
          {catagories?.length > 0 &&
            catagories.map((category) => (
              <tr key={category._id}>
                <td>{category.catagoryName}</td>
                <td>{category?.parentCatagory?.catagoryName}</td>
                <td className="flex flex-col gap-2 md:flex-row md:gap-2">
                  <button
                    className="btn-default flex gap-1"
                    onClick={() => editCategory(category)}
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
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="btn-red flex gap-1"
                    onClick={() => {
                      confirmAlert({
                        title: "Confirm Deletion",
                        message: `Are you sure you want to delete ${category.catagoryName}?`,
                        buttons: [
                          {
                            label: "Yes",
                            className:'btn-red flex gap-1',
                            onClick: () => category && onDelete(category),
                          },
                          {
                            label: "No",
                            onClick: () => {},
                          },
                        ],
                      });
                    }}
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      )}
    </Applayout>
  );
};

export default Catagories;
