"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

interface FooterWrapperProps {
  socialLinks?: any;
  footerData?: any;
}

export default function FooterWrapper({ socialLinks, footerData }: FooterWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPlayer = pathname?.startsWith("/player");

  if (isAdmin || isPlayer) {
    return null;
  }

  return <Footer socialLinks={socialLinks} footerData={footerData} />;
}
