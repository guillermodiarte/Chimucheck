import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  const isLoginPage = request.nextUrl.pathname === "/admin";
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !isLoginPage && !session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // If user is already logged in, redirect them away from login page
  if (session && request.nextUrl.pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
