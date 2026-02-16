// Fix corrupt games column data - replace empty/null values with valid JSON "[]"
const { PrismaClient } = require("@prisma/client");

async function fixGames() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE Tournament SET games = '[]' WHERE games IS NULL OR games = '' OR games = 'null'`
    );
    console.log(`Fixed ${result} tournament(s) with invalid games data.`);
  } catch (e) {
    console.log("Fix games skipped:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixGames();
