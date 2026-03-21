"use client"
import Applayout from "@/app/component/Applayout";
import {signIn,useSession } from "next-auth/react";
import React, { useState,useEffect } from 'react'
import Login from "./Login";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const session=useSession();
  const [uname,setUname]=useState('');
  console.log(session,session.token);
  const ss=typeof window !== "undefined" ? window.sessionStorage : null;
  const route=useRouter();
  useEffect(()=>{
    if((session.data!==null && session.status==='authenticated') || ss.getItem('user')!== null){
      setIsLoggedIn(true);
    }
    if(session.data){
      if(session.data.user.phone===null){
        route.push('/signup');
      }
      const userInfo={
        userId:session.data.user.id,
        userEmail:session.data.user.email,
        uname:session.data.user.name,
    }
    ss.setItem("user",JSON.stringify(userInfo));
    }
  },[session]);

  const handleLogin = async () => {
    try {
      const response = await signIn('google');
    } catch (error) {
      console.error('Error occurred during login:', error);
    }
  };
  if(isLoggedIn===false){

    return (
      <>
      <div className="flex items-center justify-end px-2 m-3">Don&apos;t have account yet?,
       <Link href={'/signup'} className="bg-gray-200 text-black p-2 px-4 rounded-lg" >
        Sigun Up
        </Link> </div>
        <div className='bg-gray-200 text-black w-screen h-screen flex flex-col justify-center items-center gap-2'>
          <div className="w-auto">
          <Login session={session} />
        <div className='text-center w-full mt-2'>       
            <button className="bg-white text-black p-2 px-4 rounded-lg" onClick={handleLogin}>Login with Google</button>
        </div>
        </div>
        </div>
        </>
      )
}else{
  return (
    <Applayout>
      <div className="text-blue-900 flex justify-between">
        <h2 className="font-bold">
          Hello,{JSON.parse(ss.getItem('user'))?.uname}
        </h2>
        <div className="flex gap-1 text-black bg-gray-200 rounde-lg overflow-hidden">
          <img src={session.data?.user?.image} alt="userimg" className="w-6 h-6 rounded-lg"/>
          <span className="px-2">
            {JSON.parse(ss.getItem('user'))?.useremail}
          </span>
          
        </div>
      </div>
    </Applayout>
    
  );
}
}
