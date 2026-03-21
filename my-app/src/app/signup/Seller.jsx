"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {useSession } from "next-auth/react";
const Seller = () => {
  const session=useSession();
  console.log(session);
  const initialState = {
    name:"",
    email:"",
    phone: "",
    address: "",
    city: "",
    postalcode: "",
    state: "",
    country: "",
    password: "",
  };
 
  console.log(initialState);
  const [sellerDetails, setSellerDetails] = useState(initialState);
  const [error,setError]=useState('');
  const [uid,setUid]=useState('');
  const router = useRouter();
  useEffect(()=>{
    setUid(session?.data?.user.id);
    const newdetails = { ...sellerDetails };
    if(session.data){
      newdetails.name=session.data.user.name;
      newdetails.email=session.data.user.email;
      setSellerDetails(newdetails);
    }
  },[session]);
  const PutAttribute = (e, attribute) => {
    const newdetails = { ...sellerDetails };
    newdetails[attribute] = e.target.value;
    setSellerDetails(newdetails);
  };
  const saveShopKeeper = async (e) => {
    e.preventDefault();
    try {
      const data = {...sellerDetails,_id:uid};
      console.log("data->",data);
      console.log("uid->",uid);
      if(uid){
        const resp=await axios.put("/api/signup",data);
      }else{
        const resp=await axios.post("/api/signup",data);
        console.log(resp.data);
      }
      router.push("/");
    } catch (error) {
      // Handle Axios POST request error
      console.error("Error creating product:", error);
      setError("Failed to create product. Please try again later.");
    }
  };
  
  return (
    <div className="w-1/3 flex flex-col gap-2 justify-center">
    <h1> Become a Seller</h1>
      <input
        type="text"
        placeholder="name"
        name="name"
        value={sellerDetails.name}
        onChange={(e) => PutAttribute(e, "name")}
      />
      <input
        type="email"
        placeholder="email"
        name="email"
        value={sellerDetails.email}
        onChange={(e) => PutAttribute(e, "email")}
      />
      <input
        type="text"
        placeholder="phone Number"
        name="phone"
        value={sellerDetails.phone}
        onChange={(e) => PutAttribute(e, "phone")}
      />
      <input
        type="text"
        placeholder="Shop address"
        name="address"
        value={sellerDetails.address}
        onChange={(e) => PutAttribute(e, "address")}
      />
      <input
        type="text"
        placeholder="city"
        name="city"
        value={sellerDetails.city}
        onChange={(e) => PutAttribute(e, "city")}
      />
      <input
        type="text"
        placeholder="Postal Code"
        name="postalcode"
        value={sellerDetails.postalcode}
        onChange={(e) => PutAttribute(e, "postalcode")}
      />
      <input
        type="text"
        placeholder="state"
        name="state"
        value={sellerDetails.state}
        onChange={(e) => PutAttribute(e, "state")}
      />
      <input
        type="text"
        placeholder="country"
        name="country"
        value={sellerDetails.country}
        onChange={(e) => PutAttribute(e, "country")}
      />
      <input
        type="password"
        placeholder="password"
        name="password"
        value={sellerDetails.password}
        onChange={(e) => PutAttribute(e, "password")}
      />
      <button onClick={saveShopKeeper} className="bg-white text-black p-2 px-4 rounded-lg">Submit</button>
    </div>
  );
};

export default Seller;
