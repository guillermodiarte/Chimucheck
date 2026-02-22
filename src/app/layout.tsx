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
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let homeSection;
  let socialsSection;
  let footerSection;
  try {
    [homeSection, socialsSection, footerSection] = await Promise.all([
      db.siteSection.findUnique({ where: { key: "home_section" } }),
      db.siteSection.findUnique({ where: { key: "social_links" } }),
      db.siteSection.findUnique({ where: { key: "footer_section" } }),
    ]);
  } catch (error) {
    console.error("Failed to load sections:", error);
  }
  const logoUrl = (homeSection?.content as any)?.logoUrl;
  const logoText = (homeSection?.content as any)?.logoText;
  const socialLinks = socialsSection?.content;
  const footerData = footerSection?.content;

  const session = await auth();

  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <NavbarWrapper logoUrl={logoUrl} logoText={logoText} session={session} socialLinks={socialLinks} />
          <main className="flex-grow">
            {children}
          </main>
          <FooterWrapper socialLinks={socialLinks} footerData={footerData} />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
