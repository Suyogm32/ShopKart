import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";

import { z } from "zod";

const signupSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalcode: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const POST = async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60_000 });

    if (!allowed) {
      return NextResponse.json(
        { message: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address, city, postalcode, state, country } = parsed.data;

    await mongooseConnect();

    // --- Duplicate check ---
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // --- Hash password before saving ---
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      city,
      postalcode,
      state,
      country,
    });
    await newUser.save();

    // --- Never return the password field ---
    const { password: _removed, ...safeUser } = newUser.toObject();

    return NextResponse.json(
      { message: "Account created successfully.", user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Error creating account." }, { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    const { phone, address, city, postalcode, state, country, _id } = await req.json();

    if (!_id) {
      return NextResponse.json({ message: "User id is required." }, { status: 400 });
    }

    await mongooseConnect();
    await User.updateOne({ _id }, { phone, address, city, postalcode, state, country });

    return NextResponse.json({ message: `User ${_id} updated successfully.` }, { status: 200 });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ message: "Error updating user." }, { status: 500 });
  }
};
