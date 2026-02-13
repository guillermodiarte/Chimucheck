"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPlayer = pathname?.startsWith("/player");

  if (isAdmin || isPlayer) {
    return null;
  }

  return <Footer />;
}
