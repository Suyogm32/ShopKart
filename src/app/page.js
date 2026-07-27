"use client";
import Applayout from "@/app/component/Applayout";
import { signIn, useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import Login from "./Login";
import { useRouter } from "next/navigation";
import DashboardHome from "./component/DashboardHome";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const session = useSession();
  const [uname, setUname] = useState("");
  const ss = typeof window !== "undefined" ? window.sessionStorage : null;
  const route = useRouter();
  useEffect(() => {
    if (
      (session.data !== null && session.status === "authenticated") ||
      ss.getItem("user") !== null
    ) {
      setIsLoggedIn(true);
    }
    if (session.data) {
      if (session.data.user.phone === null) {
        route.push("/signup");
      }
      const userInfo = {
        userId: session.data.user.id,
        userEmail: session.data.user.email,
        uname: session.data.user.name,
      };
      ss.setItem("user", JSON.stringify(userInfo));
    }
  }, [session]);

  const handleLogin = async () => {
    try {
      const response = await signIn("google");
    } catch (error) {
      console.error("Error occurred during login:", error);
    }
  };

  if (isLoggedIn === false) {
    return (
      <div className="relative min-h-screen w-full bg-white dark:bg-gray-900 overflow-hidden">
        <img
          src="/login-illustration.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none"
        />
        <div className="relative z-10 min-h-screen flex items-center px-8 md:px-16 lg:px-24">
          <Login session={session} onGoogleLogin={handleLogin} />
        </div>
      </div>
    );
  } else {
    return (
      <Applayout>
        <DashboardHome />
      </Applayout>
    );
  }
}
