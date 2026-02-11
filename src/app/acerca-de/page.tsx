import AboutSection from "@/components/AboutSection";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAboutData() {
  const section = await db.siteSection.findUnique({
    where: { key: "about_us" },
  });
  return section?.content || null;
}

export default async function AboutPage() {
  const aboutData = await getAboutData();

  return (
    <div className="pt-14 bg-black min-h-screen">
      <AboutSection initialData={aboutData} />
    </div>
  );
}
