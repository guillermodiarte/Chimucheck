import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChimuCheck",
  description: "Web oficial de ChimuCheck - Gaming, Noticias y Diversión",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let homeSection;
  try {
    homeSection = await db.siteSection.findUnique({
      where: { key: "home_section" },
    });
  } catch (error) {
    console.error("Failed to load home section:", error);
    // Fallback or null
  }
  const logoUrl = (homeSection?.content as any)?.logoUrl;

  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navbar logoUrl={logoUrl} />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
