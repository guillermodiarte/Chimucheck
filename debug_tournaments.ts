
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Checking tournaments in DB...");
  const allTournaments = await db.tournament.findMany();
  console.log(`Total tournaments: ${allTournaments.length}`);
  allTournaments.forEach((t) => {
    console.log(`- ID: ${t.id}, Name: ${t.name}, Active: ${t.active} (${typeof t.active}), Date: ${t.date}`);
  });

  console.log("\nChecking active query...");
  const activeTournaments = await db.tournament.findMany({
    where: { active: true },
  });
  console.log(`Active tournaments found by query: ${activeTournaments.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
