"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";

const STEPS = ["Account", "Business", "Pickup address"];

const BUSINESS_TYPES = [
  "Individual seller",
  "Sole proprietorship",
  "Partnership",
  "Private limited",
];

const Seller = () => {
  const session = useSession();
  const initialState = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalcode: "",
    state: "",
    country: "",
    password: "",
    businessType: "",
    gstin: "",
  };

  const [sellerDetails, setSellerDetails] = useState(initialState);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState("");
  const router = useRouter();

  // When arriving from Google sign-in, this page acts as "complete your
  // profile" instead of "create an account" — name/email come from the
  // session and there's no password to set.
  const isGoogleUser = !!uid;

  useEffect(() => {
    setUid(session?.data?.user.id);
    if (session.data) {
      setSellerDetails((prev) => ({
        ...prev,
        name: session.data.user.name || prev.name,
        email: session.data.user.email || prev.email,
      }));
    }
  }, [session]);

  const PutAttribute = (e, attribute) => {
    setSellerDetails((prev) => ({ ...prev, [attribute]: e.target.value }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!sellerDetails.name.trim()) return "Please enter your name.";
      if (!sellerDetails.email.trim()) return "Please enter your email.";
      if (!isGoogleUser && sellerDetails.password.length < 8) {
        return "Password must be at least 8 characters.";
      }
    }
    if (step === 2) {
      if (!sellerDetails.address.trim()) return "Please enter your pickup address.";
      if (!sellerDetails.city.trim()) return "Please enter your city.";
      if (!sellerDetails.postalcode.trim()) return "Please enter your postal code.";
    }
    return "";
  };

  const next = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const saveShopKeeper = async (e) => {
    e.preventDefault();
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    try {
      const data = { ...sellerDetails, _id: uid };
      if (uid) {
        await axios.put("/api/signup", data);
        toast.success("Profile updated.");
      } else {
        await axios.post("/api/signup", data);
        toast.success("Account created.");
      }
      router.push("/");
    } catch (err) {
      const serverMessage = err.response?.data?.message || "Something went wrong.";
      setError(serverMessage);
      toast.error(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "!mb-0 !py-2.5 !bg-gray-50 dark:!bg-gray-800 !border-gray-100 dark:!border-gray-700 !rounded-lg";

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        {isGoogleUser ? "Complete your profile" : "Become a Seller"}
      </h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
        {isGoogleUser
          ? "Just a few more details before you start selling."
          : "Set up your seller account in three quick steps."}
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, index) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  index <= step
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`text-xs hidden sm:block ${
                  index <= step
                    ? "text-gray-700 dark:text-gray-200 font-medium"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={saveShopKeeper}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col gap-4">
          {step === 0 && (
            <>
              <div>
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={sellerDetails.name}
                  onChange={(e) => PutAttribute(e, "name")}
                  className={inputClass}
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={sellerDetails.email}
                  onChange={(e) => PutAttribute(e, "email")}
                  disabled={isGoogleUser}
                  className={`${inputClass} disabled:opacity-60`}
                />
              </div>
              <div>
                <label>Phone number</label>
                <input
                  type="text"
                  placeholder="Contact number"
                  value={sellerDetails.phone}
                  onChange={(e) => PutAttribute(e, "phone")}
                  className={inputClass}
                />
              </div>
              {!isGoogleUser && (
                <div>
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={sellerDetails.password}
                    onChange={(e) => PutAttribute(e, "password")}
                    className={inputClass}
                  />
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mb-1">
                Optional — you can add these later from your profile.
              </p>
              <div>
                <label>Business type</label>
                <select
                  value={sellerDetails.businessType}
                  onChange={(e) => PutAttribute(e, "businessType")}
                  className={inputClass}
                >
                  <option value="">Select business type</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>GSTIN</label>
                <input
                  type="text"
                  placeholder="15-digit GST number"
                  value={sellerDetails.gstin}
                  onChange={(e) => PutAttribute(e, "gstin")}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mb-1">
                Where couriers will collect your orders.
              </p>
              <div>
                <label>Address</label>
                <input
                  type="text"
                  placeholder="Shop or warehouse address"
                  value={sellerDetails.address}
                  onChange={(e) => PutAttribute(e, "address")}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={sellerDetails.city}
                    onChange={(e) => PutAttribute(e, "city")}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label>Postal code</label>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={sellerDetails.postalcode}
                    onChange={(e) => PutAttribute(e, "postalcode")}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={sellerDetails.state}
                    onChange={(e) => PutAttribute(e, "state")}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label>Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={sellerDetails.country}
                    onChange={(e) => PutAttribute(e, "country")}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="px-6 py-2.5 rounded-full font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 bg-primary text-white py-2.5 rounded-full font-medium shadow-md hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white py-2.5 rounded-full font-medium shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : isGoogleUser ? "Finish setup" : "Create account"}
            </button>
          )}
        </div>
      </form>

      {!isGoogleUser && step === 0 && (
        <>
          <div className="flex items-center gap-3 mt-6">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Or sign up with
            </span>
            <button
              type="button"
              onClick={() => signIn("google")}
              aria-label="Sign up with Google"
              title="Sign up with Google"
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

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </>
      )}
    </div>
  );
};

export default Seller;
