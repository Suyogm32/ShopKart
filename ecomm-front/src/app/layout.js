import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://shopkart-sm.duckdns.org"),
  title: "Shopkart — Shop electronics, toys and more",
  description:
    "Browse and buy from a curated catalogue of electronics, toys and everyday essentials with fast checkout and order tracking.",
  openGraph: {
    title: "Shopkart — Shop electronics, toys and more",
    description:
      "Customer storefront with live shipping rates, Stripe checkout and order tracking.",
    url: "https://shopkart-sm.duckdns.org",
    siteName: "Shopkart",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Shopkart storefront" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
