"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

interface NavbarWrapperProps {
  logoUrl?: string;
  logoText?: string;
}

export default function NavbarWrapper({ logoUrl, logoText }: NavbarWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return null;
  }

  return <Navbar logoUrl={logoUrl} logoText={logoText} />;
}
