import { Inter } from "next/font/google";
import "./globals.css";
import Authprovider from "@/app/Authprovider/Authprovider";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://shopkart-admin-sm.duckdns.org"),
  title: "Shopkart Seller Portal",
  description: "Manage products, orders, shipping labels and store settings.",
  openGraph: {
    title: "Shopkart Seller Portal",
    description:
      "Seller admin: catalogue, orders, revenue dashboard and real carrier shipping labels.",
    url: "https://shopkart-admin-sm.duckdns.org",
    siteName: "Shopkart Seller Portal",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Shopkart seller portal" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-gray-900 dark:text-gray-100`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Authprovider>{children}</Authprovider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
