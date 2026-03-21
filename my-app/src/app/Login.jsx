import { Passero_One } from 'next/font/google';
import React, { useState } from 'react'
import axios from "axios";
import { useRouter } from "next/navigation";
const Login = ({ session }) => {
    const initialState={
        email:'',
        password:'',
    }
    const [loginData,setLoginData]=useState(initialState);
    const [error,setError]=useState('');
    const router = useRouter();
    const ss=typeof window !== "undefined" ? window.sessionStorage : null;
    const PutAttribute = (e, attribute) => {
        const newdetails = { ...loginData };
        newdetails[attribute] = e.target.value;
        setLoginData(newdetails);
      };

      const checkUser=async(e)=>{
        e.preventDefault();
        try{
          const data=loginData;
          console.log(data);
          const resp=await axios.post("/api/login",data);
          console.log(resp.data);
          if(resp.data.user){
            session.status="authenticated";
            session.data=resp.data.user;
            const userInfo={
                userId:resp.data.user._id,
                useremail:resp.data.user.email,
                uname:resp.data.user.name,
            }
            ss.setItem("user",JSON.stringify(userInfo));
          }
          console.log(session);
        }catch (error) {
          // Handle Axios POST request error
          console.error("Error creating product:", error);
          setError("Failed to create product. Please try again later.");
        }
      };
  return (
    <div className='flex flex-col justify-center items-center'>
        <input
        type="email"
        placeholder="email"
        name="email"
        value={loginData.email}
        onChange={(e) => PutAttribute(e, "email")}
      />
      <input
        type="password"
        placeholder="password"
        name="password"
        value={loginData.password}
        onChange={(e) => PutAttribute(e, "password")}
      />
      <button onClick={checkUser} className="bg-white text-black p-2 px-4 rounded-lg">Login</button>
    </div>
  )
}

export default Login