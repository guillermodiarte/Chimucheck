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
      {/* Content with top padding to account for fixed navbar */}
      <main className="flex-1 space-y-4 p-8 pt-36 max-w-[1400px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
