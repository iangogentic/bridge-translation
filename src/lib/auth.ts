import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true, // Auto sign-in after account creation
  },
  plugins: [
    admin(), // Enable admin API for server-side user management
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3005",
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[],
});

export type Session = typeof auth.$Infer.Session;
