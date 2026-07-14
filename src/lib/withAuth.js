import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Wraps a Next.js Route Handler with session authentication.
 *
 * Usage unchanged from v4 — every existing route (products, orders,
 * categories, upload) keeps working with zero changes:
 *   export const GET = withAuth(async (req, context, session) => { ... });
 */
export function withAuth(handler) {
  return async (req, context) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return handler(req, context, session);
  };
}
