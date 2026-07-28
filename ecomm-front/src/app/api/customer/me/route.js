import { Customer } from "@/models/Customer";
import { mongooseConnect } from "@/lib/mongoose";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not signed in." }, { status: 401 });
    }

    await mongooseConnect();
    const customer = await Customer.findById(session.user.id).select("-password");
    if (!customer) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error("Fetch customer error:", error);
    return NextResponse.json({ message: "Error loading your profile." }, { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not signed in." }, { status: 401 });
    }

    const { name, phone } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ message: "Name can't be empty." }, { status: 400 });
    }

    await mongooseConnect();
    // Email is deliberately not updatable — it's the account identifier and,
    // for Google accounts, owned by the provider.
    await Customer.updateOne(
      { _id: session.user.id },
      { $set: { name: name.trim(), phone: phone?.trim() || "" } }
    );

    return NextResponse.json({ message: "Profile updated." });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ message: "Error updating your profile." }, { status: 500 });
  }
};
