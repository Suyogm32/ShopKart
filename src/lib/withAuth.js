import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

/**
 * Wraps a Next.js Route Handler with session authentication.
 *
 * Usage:
 *   export const GET = withAuth(async (req, context, session) => {
 *     // session.user.id is the authenticated user's id
 *   });
 *
 * Why two layers (middleware + withAuth)?
 *   - middleware.js blocks at the edge (fast, no DB hit)
 *   - withAuth gives the handler the actual session object so it can
 *     use session.user.id for ownership checks (e.g. only show YOUR products)
 */
export function withAuth(handler) {
  return async (req, context) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return handler(req, context, session);
  };
}
