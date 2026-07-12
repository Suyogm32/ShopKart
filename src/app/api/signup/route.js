import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const POST = async (req) => {
  try {
    const { name, email, password, phone, address, city, postalcode, state, country } =
      await req.json();

    // --- Validation ---
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

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
