"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

import { Session } from "next-auth";

interface NavbarWrapperProps {
  logoUrl?: string;
  logoText?: string;
  session?: Session | null;
}

export default function NavbarWrapper({ logoUrl, logoText, session }: NavbarWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/player/login") || pathname?.startsWith("/player/register");

  if (isAdmin || isAuthPage) {
    return null;
  }

  return <Navbar logoUrl={logoUrl} logoText={logoText} session={session} />;
}
