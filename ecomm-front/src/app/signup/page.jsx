"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CartContextProvider from "@/app/components/CartContext";
import { GlobalStyles } from "@/app/page";
import GoogleButton from "@/app/components/GoogleButton";

const SignupForm = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/customer/signup", form);
      // Sign straight in after signup — making someone log in again immediately
      // is pointless friction.
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Track your orders, save your details, and check out faster next time.
      </p>

      <form
        onSubmit={submit}
        className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-500">{error}</p>}

        <input
          type="text"
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
        />
        <input
          type="password"
          required
          placeholder="Password (at least 8 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>

      <GoogleButton next={next} label="Sign up with Google" />

      <p className="text-sm text-gray-600 mt-6 text-center">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-gray-900 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

const SignupPage = () => (
  <CartContextProvider>
    <GlobalStyles />
    <Header />
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <SignupForm />
    </Suspense>
    <Footer />
  </CartContextProvider>
);

export default SignupPage;
