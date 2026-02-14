
import { db } from "./src/lib/prisma";

async function main() {
  const section = await db.siteSection.findUnique({
    where: { key: "gaming_section" },
  });
  console.log("Raw DB Content for gaming_section:");
  console.dir(section, { depth: null });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
