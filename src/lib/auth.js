import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "./mongodb";
import { mongooseConnect } from "./mongoose";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await mongooseConnect();
        // .select('+password') ensures password is returned even if hidden by default
        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  adapter: MongoDBAdapter(clientPromise),

  // JWT strategy works in both serverless and self-hosted deployments
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, `user` is available — persist id into the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Make user id available in the client session
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/", // Redirect unauthenticated users to home page
  },

  secret: process.env.NEXTAUTH_SECRET,
};
