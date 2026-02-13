import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Initialize NextAuth
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // --- LEGACY ADMIN PROTECTION ---
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isLoginPage = nextUrl.pathname === "/admin";
  const adminSession = req.cookies.get("admin_session");

  if (isAdminRoute) {
    // If accessing admin routes without cookie, redirect to admin login
    if (!isLoginPage && !adminSession) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }

    // If accessing admin login WITH cookie, redirect to admin dashboard
    if (isLoginPage && adminSession) {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }

    // Allow access to admin if rules met
    return NextResponse.next();
  }

  // --- NEXTAUTH PLAYER PROTECTION ---
  // Handled by authorized callback in auth.config.ts mostly, 
  // but we can enforce here if needed or let the callback do the redirect.
  // The logic in auth.config.ts `authorized` returns false for unwelcomed guests, 
  // triggering NextAuth to redirect to pages.signIn defined there (/player/login).

  return NextResponse.next();
});

export const config = {
  // Matcher for both admin and player routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
