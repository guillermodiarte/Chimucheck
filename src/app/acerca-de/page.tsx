"use client";

import { useEffect } from "react";
import AboutSection from "@/components/AboutSection";

export default function AboutPage() {
  useEffect(() => {
    // Force scroll to top on mount with a slight delay to ensure layout is ready
    // This fixes the issue when navigating from a hash URL (like #news)
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, []);

  return (
    <div className="pt-14 bg-black min-h-screen">
      <AboutSection />
    </div>
  );
}
