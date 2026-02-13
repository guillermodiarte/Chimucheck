import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/player/login",
    newUser: "/player/register",
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.alias = (user as any).alias;
        token.image = user.image;
        token.role = "PLAYER"; // Hardcode role for this system
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).alias = token.alias as string;
        (session.user as any).role = "PLAYER";
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
