export { auth as default } from "@/auth";

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
  ],
};
