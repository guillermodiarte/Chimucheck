import { db } from "@/lib/prisma";
import { SectionsDashboard } from "@/components/admin/sections/SectionsDashboard";

export default async function SectionsPage() {
  // Fetch existing content or default to null
  const aboutSection = await db.siteSection.findUnique({
    where: { key: "about_us" },
  });

  const homeSection = await db.siteSection.findUnique({
    where: { key: "home_section" },
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const aboutData = (aboutSection?.content as any) || {};
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const homeData = (homeSection?.content as any) || {};

  const gamingSection = await db.siteSection.findUnique({
    where: { key: "gaming_section" },
  });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const gamingData = (gamingSection?.content as any) || null;

  // Fetch Prizes Data
  const prizes = await db.prize.findMany({ orderBy: { order: "asc" } });
  const prizesSection = await db.siteSection.findUnique({ where: { key: "prizes_section" } });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const prizesConfig = (prizesSection?.content as any) || {};

  const aboutContent = {
    title: aboutData.title || "Nuestra Historia",
    bio: aboutData.bio || "",
    instagram: aboutData.instagram || "chimucheck",
    imageUrl: aboutData.imageUrl || aboutData.image || "/images/about/dario.jpg", // Default image
  };

  const homeContent = {
    logoUrl: homeData.logoUrl || "/images/logo5.png",
    logoText: homeData.logoText || "",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Secciones</h1>
        <p className="text-gray-400">Selecciona una sección para editar su contenido.</p>
      </div>

      <SectionsDashboard
        homeContent={homeContent}
        aboutContent={aboutContent}
        gamingContent={gamingData}
        prizesData={{ initialPrizes: prizes, initialConfig: prizesConfig }}
      />
    </div>
  );
}
