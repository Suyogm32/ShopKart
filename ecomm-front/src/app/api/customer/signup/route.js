import { Customer } from "@/models/Customer";
import { mongooseConnect } from "@/lib/mongoose";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const POST = async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`customer-signup:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }
    if (!email?.includes("@")) {
      return NextResponse.json({ message: "A valid email is required." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await mongooseConnect();

    const normalisedEmail = email.toLowerCase().trim();
    const existing = await Customer.findOne({ email: normalisedEmail });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await Customer.create({ name: name.trim(), email: normalisedEmail, password: hashed });

    return NextResponse.json({ message: "Account created." }, { status: 201 });
  } catch (error) {
    console.error("Customer signup error:", error);
    return NextResponse.json({ message: "Error creating account." }, { status: 500 });
  }
};
