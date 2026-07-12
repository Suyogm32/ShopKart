import { NextResponse } from "next/server";

/**
 * This route is no longer used.
 * Login is handled by NextAuth at /api/auth/signin via the CredentialsProvider.
 * Use: signIn('credentials', { email, password }) from next-auth/react
 */
export const POST = () => {
  return NextResponse.json(
    { message: "Use POST /api/auth/callback/credentials via NextAuth signIn()." },
    { status: 410 } // 410 Gone
  );
};
