"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CartContextProvider from "@/app/components/CartContext";
import { GlobalStyles } from "@/app/page";

const EMPTY_ADDRESS = {
  label: "Home",
  address: "",
  city: "",
  postalcode: "",
  state: "",
  country: "",
};

const AccountPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [addressForm, setAddressForm] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    axios
      .get("/api/customer/me")
      .then((resp) => {
        setCustomer(resp.data.data);
        setProfile({ name: resp.data.data.name || "", phone: resp.data.data.phone || "" });
      })
      .catch(() => setError("Could not load your profile."));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?next=/account");
      return;
    }
    if (status === "authenticated") load();
  }, [status]);

  const notify = (text) => {
    setMessage(text);
    setError("");
    setTimeout(() => setMessage(""), 3000);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await axios.put("/api/customer/me", profile);
      notify("Profile updated.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (addressForm._id) {
        await axios.put("/api/customer/addresses", { ...addressForm, addressId: addressForm._id });
      } else {
        await axios.post("/api/customer/addresses", addressForm);
      }
      setAddressForm(null);
      notify("Address saved.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save that address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`/api/customer/addresses?id=${id}`);
      notify("Address deleted.");
      load();
    } catch {
      setError("Could not delete that address.");
    }
  };

  const makeDefault = async (id) => {
    try {
      await axios.put("/api/customer/addresses", { addressId: id, isDefault: true });
      load();
    } catch {
      setError("Could not update your default address.");
    }
  };

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors";

  return (
    <CartContextProvider>
      <GlobalStyles />
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Your profile</h1>
            <p className="text-sm text-gray-500">{session?.user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/track"
              className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Your orders
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {!customer ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Basic info */}
            <section className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Basic information</h2>
              <form onSubmit={saveProfile} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Full name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Email</label>
                  <input
                    type="email"
                    value={customer.email}
                    disabled
                    className={`${inputClass} bg-gray-50 text-gray-500`}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Email identifies your account and can&apos;t be changed.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="Contact number"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="self-start px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </form>
            </section>

            {/* Addresses */}
            <section className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Saved addresses</h2>
                {!addressForm && (
                  <button
                    onClick={() => setAddressForm({ ...EMPTY_ADDRESS })}
                    className="text-sm text-gray-900 font-medium hover:underline"
                  >
                    + Add address
                  </button>
                )}
              </div>

              {customer.addresses?.length === 0 && !addressForm && (
                <p className="text-sm text-gray-500">
                  No saved addresses yet. Add one to speed up checkout.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {customer.addresses?.map((a) => (
                  <div
                    key={a._id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{a.label}</span>
                        {a.isDefault && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-900 text-white">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {[a.address, a.city, a.state, a.postalcode, a.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs">
                      <button
                        onClick={() => setAddressForm({ ...a.toObject?.() ?? a })}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      {!a.isDefault && (
                        <button
                          onClick={() => makeDefault(a._id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(a._id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {addressForm && (
                <form
                  onSubmit={saveAddress}
                  className="border border-gray-200 rounded-lg p-4 mt-3 flex flex-col gap-3 bg-gray-50"
                >
                  <div className="flex gap-3">
                    <select
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      className={inputClass}
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Street address"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Postal code"
                      value={addressForm.postalcode}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, postalcode: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Country"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {savingAddress ? "Saving…" : "Save address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressForm(null)}
                      className="px-6 py-2.5 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </div>

      <Footer />
    </CartContextProvider>
  );
};

export default AccountPage;