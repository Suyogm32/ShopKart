"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";

const Login = ({ onGoogleLogin }) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const putAttribute = (e, attribute) => {
    setLoginData((prev) => ({ ...prev, [attribute]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false, // Handle redirect ourselves so we can show errors
      });

      if (result?.error) {
        setError("Invalid email or password.");
        toast.error("Invalid email or password.");
      }

      // On success, the useSession() hook in the parent page will update
      // automatically and re-render the authenticated dashboard.
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Welcome to Seller Panel
      </h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
        Manage your products, orders, and shipments — all from one place.
      </p>

      <form onSubmit={handleLogin} className="flex flex-col">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
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
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </span>
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={loginData.email}
            onChange={(e) => putAttribute(e, "email")}
            required
            className="!pl-10 !mb-0 !py-2.5 !bg-gray-50 dark:!bg-gray-800 !border-gray-100 dark:!border-gray-700 !rounded-lg"
          />
        </div>

        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
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
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </span>
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={loginData.password}
            onChange={(e) => putAttribute(e, "password")}
            required
            className="!pl-10 !mb-0 !py-2.5 !bg-gray-50 dark:!bg-gray-800 !border-gray-100 dark:!border-gray-700 !rounded-lg"
          />
        </div>

        <button
          type="button"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary self-start mb-6"
          onClick={() => toast("Password reset isn't set up yet.")}
        >
          Forgot Password ?
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white py-2.5 rounded-full font-medium shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="flex items-center gap-3 mt-6">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Login With</span>
        <button
          type="button"
          onClick={onGoogleLogin}
          aria-label="Login with Google"
          title="Login with Google"
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
            />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-10">
        Don&apos;t Have an Account ?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Register Now
        </Link>
      </p>
    </div>
  );
};

export default Login;