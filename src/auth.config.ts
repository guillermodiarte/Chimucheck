import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/player/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/player/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated players to /player/login
      }

      // Allow access to everything else by default (public pages, admin pages handled by legacy middleware)
      return true;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
