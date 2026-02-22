import { db } from "@/lib/prisma";
import ChimuCoinSection from "@/components/ChimuCoinSection";

export default async function ChimuCoinSectionWrapper() {
  let sectionData = null;
  try {
    const section = await db.siteSection.findUnique({
      where: { key: "chimucoin_section" },
    });
    sectionData = section?.content ?? null;
  } catch (e) {
    // fallback to defaults
  }
  return <ChimuCoinSection data={sectionData as any} />;
}
