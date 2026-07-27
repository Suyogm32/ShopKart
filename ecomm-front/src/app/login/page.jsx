"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CartContextProvider from "@/app/components/CartContext";
import { GlobalStyles } from "@/app/page";
import GoogleButton from "@/app/components/GoogleButton";

const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
      <p className="text-sm text-gray-500 mb-6">
        Sign in to track your orders and check out faster.
      </p>

      <form
        onSubmit={submit}
        className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-500">{error}</p>}

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
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>

      <GoogleButton next={next} label="Sign in with Google" />

      <p className="text-sm text-gray-600 mt-6 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="text-gray-900 font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
};

const LoginPage = () => (
  <CartContextProvider>
    <GlobalStyles />
    <Header />
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
    <Footer />
  </CartContextProvider>
);

export default LoginPage;
