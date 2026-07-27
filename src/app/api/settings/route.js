import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalcode: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  storeName: z.string().optional(),
  logoUrl: z.string().optional(),
  vacationMode: z.boolean().optional(),
});

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const user = await User.findById(session.user.id).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ message: "Error fetching settings." }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, _context, session) => {
  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input.", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await mongooseConnect();
    await User.updateOne({ _id: session.user.id }, { $set: parsed.data });

    return NextResponse.json({ message: "Settings updated." }, { status: 200 });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ message: "Error updating settings." }, { status: 500 });
  }
});
