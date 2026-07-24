"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

const Login = () => {
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
    <form onSubmit={handleLogin} className="flex flex-col gap-2">
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        name="email"
        value={loginData.email}
        onChange={(e) => putAttribute(e, "email")}
        required
      />
      <input
        type="password"
        placeholder="Password"
        name="password"
        value={loginData.password}
        onChange={(e) => putAttribute(e, "password")}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-white text-black p-2 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Login"}
      </button>
    </form>
  );
};

export default Login;
