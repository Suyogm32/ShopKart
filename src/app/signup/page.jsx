"use client";
import React from "react";
import Seller from "./Seller";

const Signup = () => {
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-gray-900 overflow-hidden">
      <img
        src="/login-illustration.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none"
      />
      <div className="relative z-10 min-h-screen flex items-center px-8 md:px-16 lg:px-24 py-10">
        <Seller />
      </div>
    </div>
  );
};

export default Signup;