import { User } from "@/models/User";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export const PUT = withAuth(async (req, _context, session) => {
  try {
    const body = await req.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
    }

    await mongooseConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Google-only accounts have no password set — there's nothing to verify
    // against, so password change doesn't apply to them.
    if (!user.password) {
      return NextResponse.json(
        { message: "This account signs in with Google and has no password to change." },
        { status: 400 }
      );
    }

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!matches) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 });
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);
    await user.save();

    return NextResponse.json({ message: "Password updated." }, { status: 200 });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Error changing password." }, { status: 500 });
  }
});