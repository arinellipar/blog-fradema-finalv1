// app/api/auth/[...nextauth]/route.ts
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db"; // Import your Prisma client; ensure it's set up in lib/db.ts

// Extend NextAuth types to include custom user fields
declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
}

// Define auth options with explicit types for better TypeScript safety
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Best practice: Validate input to prevent undefined errors
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Best practice: Handle non-existent user or invalid password with specific errors
        if (!user) {
          throw new Error("Invalid email or password.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        // Return user data for session (omit sensitive fields like password)
        const nameParts = user.name?.split(" ") || [];
        return {
          id: user.id,
          email: user.email,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          phone: undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Best practice: Use JWT for stateless sessions in modern apps
  },
  pages: {
    signIn: "/auth/signin", // Customize sign-in page to improve UX and handle errors gracefully
  },
  callbacks: {
    // Best practice: Type-safe callbacks to propagate user data to JWT and session
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  secret: process.env.JWT_SECRET || "fallback-secret-for-dev", // Best practice: Use env var for production security; fallback for dev only
};

// Export handler for API route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
