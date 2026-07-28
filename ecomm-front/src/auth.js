import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { Customer } from "@/models/Customer";
import { mongooseConnect } from "@/lib/mongoose";

// Secure cookies must track the actual scheme, not NODE_ENV: a secure-flagged
// cookie is silently dropped by the browser over HTTP, which breaks the CSRF
// token and makes every credential sign-in fail.
const useSecureCookies = (process.env.NEXTAUTH_URL || "").startsWith("https://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Cookies aren't scoped by port, so both apps on localhost would otherwise
  // share (and overwrite) the same default session cookie. Namespacing the
  // storefront's cookies keeps the customer and seller sessions independent.
  cookies: {
    sessionToken: {
      name: "shopkart-customer.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: "shopkart-customer.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: "shopkart-customer.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await mongooseConnect();
        const customer = await Customer.findOne({
          email: String(credentials.email).toLowerCase().trim(),
        });
        // Google-only accounts have no password, so credentials login
        // correctly fails for them rather than matching an empty hash.
        if (!customer?.password) return null;

        const valid = await bcrypt.compare(String(credentials.password), customer.password);
        if (!valid) return null;

        return { id: customer._id.toString(), name: customer.name, email: customer.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      try {
        await mongooseConnect();
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        const existing = await Customer.findOne({ email });
        if (!existing) {
          await Customer.create({ name: user.name || email, email, image: user.image });
        } else if (user.image && existing.image !== user.image) {
          existing.image = user.image;
          await existing.save();
        }
        return true;
      } catch (error) {
        console.error("Google sign-in callback failed:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Map the Google identity onto our own Customer _id, so the rest of
        // the app only ever deals with one kind of user id.
        await mongooseConnect();
        const customer = await Customer.findOne({
          email: user.email.toLowerCase().trim(),
        });
        if (customer) token.id = customer._id.toString();
      } else if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
});
