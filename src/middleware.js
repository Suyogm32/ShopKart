import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

    if (isApiRoute) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/products/:path*",
    "/orders/:path*",
    "/catagories/:path*",
    "/settings/:path*",
    "/api/products/:path*",
    "/api/orders/:path*",
    "/api/catagories/:path*",
    "/api/upload/:path*",
    "/api/dashboard/:path*",
  ],
};
