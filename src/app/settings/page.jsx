"use client";
import React, { useEffect, useState } from "react";
import Applayout from "@/app/component/Applayout";
import axios from "axios";
import toast from "react-hot-toast";

const BUSINESS_TYPES = [
  "Individual seller",
  "Sole proprietorship",
  "Partnership",
  "Private limited",
];

const SectionCard = ({ title, description, children }) => (
  <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h2>
    {description && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{description}</p>}
    <div className="flex flex-col gap-4">{children}</div>
  </section>
);

const Settings = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState("");
  const [uploading, setUploading] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    axios
      .get("/api/settings")
      .then((resp) => setForm(resp.data.data))
      .catch(() => toast.error("Failed to load settings."));
  }, []);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async (sectionKey, fields) => {
    setSaving(sectionKey);
    try {
      const payload = {};
      fields.forEach((f) => {
        payload[f] = form[f] ?? "";
      });
      await axios.put("/api/settings", payload);
      toast.success("Settings saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving("");
    }
  };

  const toggleVacation = async (value) => {
    setField("vacationMode", value);
    try {
      await axios.put("/api/settings", { vacationMode: value });
      toast.success(value ? "Store paused." : "Store is live again.");
    } catch (error) {
      setField("vacationMode", !value);
      toast.error("Failed to update store status.");
    }
  };

  const uploadLogo = async (e) => {
    const files = e.target?.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("files", files[0]);
      const resp = await axios.post("/api/upload", data);
      const url = resp.data.pImageLink?.[0];
      if (url) {
        setField("logoUrl", url);
        await axios.put("/api/settings", { logoUrl: url });
        toast.success("Logo updated.");
      }
    } catch (error) {
      toast.error("Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await axios.put("/api/settings/password", passwords);
      toast.success("Password updated.");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!form) {
    return (
      <Applayout>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </Applayout>
    );
  }

  return (
    <Applayout>
      <div className="max-w-2xl flex flex-col gap-4">
        <SectionCard title="Business profile" description="Your account and business details.">
          <div>
            <label>Full name</label>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => setField("name", e.target.value)}
              className="!mb-0"
            />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email || ""} disabled className="!mb-0 opacity-60" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Email can&apos;t be changed — it identifies your account.
            </p>
          </div>
          <div>
            <label>Phone number</label>
            <input
              type="text"
              value={form.phone || ""}
              onChange={(e) => setField("phone", e.target.value)}
              className="!mb-0"
            />
          </div>
          <div>
            <label>Business type</label>
            <select
              value={form.businessType || ""}
              onChange={(e) => setField("businessType", e.target.value)}
              className="!mb-0"
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
              value={form.gstin || ""}
              onChange={(e) => setField("gstin", e.target.value)}
              className="!mb-0"
            />
          </div>
          <button
            className="btn-primary self-start rounded-full px-6 py-2"
            disabled={saving === "profile"}
            onClick={() => save("profile", ["name", "phone", "businessType", "gstin"])}
          >
            {saving === "profile" ? "Saving…" : "Save changes"}
          </button>
        </SectionCard>

        <SectionCard
          title="Pickup address"
          description="Couriers collect orders from this address. It's required before you can buy shipping labels."
        >
          <div>
            <label>Address</label>
            <input
              type="text"
              value={form.address || ""}
              onChange={(e) => setField("address", e.target.value)}
              className="!mb-0"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label>City</label>
              <input
                type="text"
                value={form.city || ""}
                onChange={(e) => setField("city", e.target.value)}
                className="!mb-0"
              />
            </div>
            <div className="flex-1">
              <label>Postal code</label>
              <input
                type="text"
                value={form.postalcode || ""}
                onChange={(e) => setField("postalcode", e.target.value)}
                className="!mb-0"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label>State</label>
              <input
                type="text"
                value={form.state || ""}
                onChange={(e) => setField("state", e.target.value)}
                className="!mb-0"
              />
            </div>
            <div className="flex-1">
              <label>Country</label>
              <input
                type="text"
                value={form.country || ""}
                onChange={(e) => setField("country", e.target.value)}
                className="!mb-0"
              />
            </div>
          </div>
          <button
            className="btn-primary self-start rounded-full px-6 py-2"
            disabled={saving === "pickup"}
            onClick={() => save("pickup", ["address", "city", "postalcode", "state", "country"])}
          >
            {saving === "pickup" ? "Saving…" : "Save changes"}
          </button>
        </SectionCard>

        <SectionCard title="Store" description="How your store appears to customers.">
          <div>
            <label>Store display name</label>
            <input
              type="text"
              placeholder="The name customers see"
              value={form.storeName || ""}
              onChange={(e) => setField("storeName", e.target.value)}
              className="!mb-0"
            />
          </div>
          <div>
            <label className="block mb-2">Store logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Store logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">No logo</span>
                )}
              </div>
              <label className="btn-default rounded-full px-4 py-2 cursor-pointer">
                {uploading ? "Uploading…" : "Upload logo"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              </label>
            </div>
          </div>
          <button
            className="btn-primary self-start rounded-full px-6 py-2"
            disabled={saving === "store"}
            onClick={() => save("store", ["storeName"])}
          >
            {saving === "store" ? "Saving…" : "Save changes"}
          </button>
        </SectionCard>

        <SectionCard
          title="Vacation mode"
          description="Pause your store while you're away. Your products stop appearing to customers, but existing orders are unaffected."
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {form.vacationMode ? "Your store is paused." : "Your store is live."}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!!form.vacationMode}
              onClick={() => toggleVacation(!form.vacationMode)}
              className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors ${
                form.vacationMode ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.vacationMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Security" description="Change the password used to sign in.">
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <div>
              <label>Current password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                className="!mb-0"
              />
            </div>
            <div>
              <label>New password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                className="!mb-0"
              />
            </div>
            <button
              type="submit"
              className="btn-primary self-start rounded-full px-6 py-2"
              disabled={changingPassword}
            >
              {changingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </SectionCard>
      </div>
    </Applayout>
  );
};

export default Settings;
