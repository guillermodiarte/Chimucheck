"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function exportDatabase() {
  try {
    const [banners, news, events, siteSections, users, players, playerStats, tournaments, tournamentRegistrations, prizes] = await Promise.all([
      db.banner.findMany(),
      db.news.findMany(),
      db.event.findMany(),
      db.siteSection.findMany(),
      db.user.findMany(),
      db.player.findMany(),
      db.playerStats.findMany(),
      db.tournament.findMany(),
      db.tournamentRegistration.findMany(),
      db.prize.findMany(),
    ]);

    const backupData = {
      version: 2,
      timestamp: new Date().toISOString(),
      data: {
        banners,
        news,
        events,
        siteSections,
        users,
        players,
        playerStats,
        tournaments,
        tournamentRegistrations,
        prizes,
      },
    };

    return {
      success: true,
      data: JSON.stringify(backupData, null, 2),
      filename: `backup-chimucheck-${new Date().toISOString().split("T")[0]}.json`,
    };
  } catch (error) {
    console.error("Error exporting database:", error);
    return { success: false, message: "Error al exportar la base de datos." };
  }
}

export async function importDatabase(jsonContent: string) {
  try {
    const parsed = JSON.parse(jsonContent);

    if (!parsed.data || !parsed.version) {
      return { success: false, message: "Formato de archivo inválido." };
    }

    const { banners, news, events, siteSections, users, players, playerStats, tournaments, tournamentRegistrations, prizes } = parsed.data;

    await db.$transaction(async (tx: any) => {
      // Delete in reverse dependency order to avoid FK violations
      await tx.tournamentRegistration.deleteMany();
      await tx.playerStats.deleteMany();
      await tx.tournament.deleteMany();
      await tx.player.deleteMany();
      await tx.banner.deleteMany();
      await tx.news.deleteMany();
      await tx.event.deleteMany();
      await tx.siteSection.deleteMany();
      await tx.prize.deleteMany();
      await tx.user.deleteMany();

      // Restore in dependency order
      if (users?.length > 0) await tx.user.createMany({ data: users });
      if (players?.length > 0) await tx.player.createMany({ data: players.map((p: any) => ({ ...p, updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined, createdAt: p.createdAt ? new Date(p.createdAt) : undefined })) });
      if (playerStats?.length > 0) await tx.playerStats.createMany({ data: playerStats });
      if (tournaments?.length > 0) await tx.tournament.createMany({ data: tournaments.map((t: any) => ({ ...t, date: t.date ? new Date(t.date) : undefined, createdAt: t.createdAt ? new Date(t.createdAt) : undefined, updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined })) });
      if (tournamentRegistrations?.length > 0) await tx.tournamentRegistration.createMany({ data: tournamentRegistrations.map((r: any) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt) : undefined })) });
      if (banners?.length > 0) await tx.banner.createMany({ data: banners });
      if (news?.length > 0) await tx.news.createMany({ data: news });
      if (events?.length > 0) await tx.event.createMany({ data: events });
      if (siteSections?.length > 0) await tx.siteSection.createMany({ data: siteSections });
      if (prizes?.length > 0) await tx.prize.createMany({ data: prizes });
    });

    revalidatePath("/admin");
    return { success: true, message: "Base de datos completa restaurada correctamente." };
  } catch (error) {
    console.error("Error importing database:", error);
    return { success: false, message: "Error al importar la base de datos. Verifica el archivo." };
  }
}
