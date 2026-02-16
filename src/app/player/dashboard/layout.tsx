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
      <div className="border-b border-white/10 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 max-w-7xl mx-auto w-full">

          <div className="flex items-center gap-2 mr-6">
            <Link href="/" className="relative h-10 w-auto aspect-[2/1] hover:opacity-80 transition-opacity">
              <Image
                src={logoUrl}
                alt="ChimuCheck"
                fill
                className="object-contain object-left"
              />
            </Link>
          </div>

          <MainNav className="mx-6" />

          <div className="ml-auto flex items-center space-x-4">
            <UserNav player={session.user} />
          </div>
        </div>
      </div>
      <main className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

