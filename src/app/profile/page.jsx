"use client";
import React, { useEffect, useState } from "react";
import Applayout from "@/app/component/Applayout";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSession } from "next-auth/react";

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 dark:text-gray-100 mb-0">{value || "—"}</p>
  </div>
);

const Card = ({ title, action, children }) => (
  <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const EditLink = () => (
  <Link href="/settings" className="text-sm text-primary hover:underline">
    Edit
  </Link>
);

const Profile = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axios
      .get("/api/settings")
      .then((resp) => setUser(resp.data.data))
      .catch(() => toast.error("Failed to load profile."));
  }, []);

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
        await axios.put("/api/settings", { logoUrl: url });
        setUser((prev) => ({ ...prev, logoUrl: url }));
        toast.success("Photo updated.");
      }
    } catch (error) {
      toast.error("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <Applayout>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </Applayout>
    );
  }

  const avatar = user.logoUrl || session?.user?.image;
  const initial = user.name?.trim()?.[0]?.toUpperCase() || "S";
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <Applayout>
      <div className="max-w-2xl flex flex-col gap-4">
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 overflow-hidden bg-primary text-white flex items-center justify-center text-2xl font-semibold">
              {avatar ? (
                <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <label
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
              title="Change photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-500 dark:text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6.827 6.175-.51.766A2.25 2.25 0 0 1 4.443 7.99h-.443A2.25 2.25 0 0 0 1.75 10.24v6.51A2.25 2.25 0 0 0 4 19h16a2.25 2.25 0 0 0 2.25-2.25v-6.51A2.25 2.25 0 0 0 20 7.99h-.443a2.25 2.25 0 0 1-1.874-1.049l-.51-.766A2.25 2.25 0 0 0 15.298 5.1H8.702a2.25 2.25 0 0 0-1.875 1.075ZM16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
                />
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            </label>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate">
              {user.storeName || user.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            {memberSince && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Seller since {memberSince}
              </p>
            )}
            {uploading && (
              <p className="text-xs text-primary mt-1">Uploading photo…</p>
            )}
          </div>
        </section>

        <Card title="Business details" action={<EditLink />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" value={user.name} />
            <Field label="Phone" value={user.phone} />
            <Field label="Business type" value={user.businessType} />
            <Field label="GSTIN" value={user.gstin} />
          </div>
        </Card>

        <Card title="Pickup address" action={<EditLink />}>
          {user.address ? (
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-0">
              {[user.address, user.city, user.state, user.postalcode, user.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-0">
              Not set — required before you can buy shipping labels.
            </p>
          )}
        </Card>

        <Card title="Store status" action={<EditLink />}>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                user.vacationMode ? "bg-amber-500" : "bg-green-500"
              }`}
            />
            <span className="text-sm text-gray-800 dark:text-gray-100">
              {user.vacationMode ? "Paused (vacation mode on)" : "Live"}
            </span>
          </div>
        </Card>
      </div>
    </Applayout>
  );
};

export default Profile;