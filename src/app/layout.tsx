import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import FooterWrapper from "@/components/FooterWrapper";
import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

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
  const logoText = (homeSection?.content as any)?.logoText;

  const session = await auth();

  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <NavbarWrapper logoUrl={logoUrl} logoText={logoText} session={session} />
          <main className="flex-grow">
            {children}
          </main>
          <FooterWrapper />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
