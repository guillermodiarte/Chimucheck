import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { MainNav } from "@/components/player/MainNav";
import { UserNav } from "@/components/player/UserNav";
import { db } from "@/lib/prisma";

import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/player/login");
  }

  let logoUrl = "/images/logo5.png";
  try {
    const homeSection = await db.siteSection.findUnique({
      where: { key: "home_section" },
    });
    const customLogo = (homeSection?.content as any)?.logoUrl;
    if (customLogo) logoUrl = customLogo;
  } catch (error) {
    // fallback to default logo
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar matching main site aesthetic */}
      <nav className="fixed top-0 w-full z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative h-24">
          <div className="flex items-center justify-between h-full">

            {/* LOGO - Breaks out like main navbar */}
            <div className="absolute top-2 left-4 z-50 pointer-events-auto filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <Link href="/" className="block">
                <div className="relative h-28 md:h-32 w-auto aspect-[1/1] hover:scale-105 transition-transform duration-300">
                  <Image
                    src={logoUrl}
                    alt="ChimuCheck Logo"
                    fill
                    className="object-contain object-left-top"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Floating pill navbar */}
            <div className="hidden md:flex flex-1 justify-end items-start pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex items-center space-x-8 shadow-2xl mt-12">
                <MainNav />

                {/* Separator */}
                <div className="h-6 w-px bg-white/20"></div>

                {/* User section */}
                <UserNav player={session.user} />
              </div>
            </div>

            {/* Mobile nav */}
            <div className="flex md:hidden flex-1 justify-end items-start pointer-events-auto mt-4">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 flex items-center space-x-4 shadow-2xl">
                <MainNav />
                <div className="h-5 w-px bg-white/20"></div>
                <UserNav player={session.user} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content with top padding to account for fixed navbar */}
      <main className="flex-1 space-y-4 p-8 pt-28 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
