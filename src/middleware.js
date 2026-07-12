export { default } from "next-auth/middleware";

/**
 * Any path listed here requires a valid session.
 * Unauthenticated requests are redirected to the signIn page (defined in authOptions.pages).
 */
export const config = {
  matcher: [
    // Dashboard pages
    "/products/:path*",
    "/orders/:path*",
    "/catagories/:path*",
    "/settings/:path*",

    // API routes — returns 401 JSON instead of redirect
    "/api/products/:path*",
    "/api/orders/:path*",
    "/api/catagories/:path*",
    "/api/upload/:path*",
  ],
};
