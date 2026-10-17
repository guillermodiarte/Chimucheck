"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function exportDatabase() {
  try {
    const [
      banners,
      news,
      events,
      siteSections,
      users,
      accounts,
      players,
      playerStats,
      playerCategoryStats,
      globalSettings,
      tournaments,
      tournamentRegistrations,
      prizes,
      notifications,
      games,
      tournamentGames,
      teams,
      raffles,
      rafflePrizes,
      raffleEntries,
      votingContests,
      votingEntries,
      votes,
    ] = await Promise.all([
      db.banner.findMany(),
      db.news.findMany(),
      db.event.findMany(),
      db.siteSection.findMany(),
      db.user.findMany(),
      db.account.findMany(),
      db.player.findMany(),
      db.playerStats.findMany(),
      db.playerCategoryStats.findMany(),
      db.globalSettings.findMany(),
      db.tournament.findMany(),
      db.tournamentRegistration.findMany(),
      db.prize.findMany(),
      db.notification.findMany(),
      db.game.findMany(),
      db.tournamentGame.findMany(),
      db.team.findMany(),
      db.raffle.findMany(),
      db.rafflePrize.findMany(),
      db.raffleEntry.findMany(),
      db.votingContest.findMany(),
      db.votingEntry.findMany(),
      db.vote.findMany(),
    ]);

    const backupData = {
      version: 3,
      timestamp: new Date().toISOString(),
      data: {
        banners,
        news,
        events,
        siteSections,
        users,
        accounts,
        players,
        playerStats,
        playerCategoryStats,
        globalSettings,
        tournaments,
        tournamentRegistrations,
        prizes,
        notifications,
        games,
        tournamentGames,
        teams,
        raffles,
        rafflePrizes,
        raffleEntries,
        votingContests,
        votingEntries,
        votes,
      },
    };

    const date = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;

    return {
      success: true,
      data: JSON.stringify(backupData, null, 2),
      filename: `backup-chimucheck-completo-${ts}.json`,
    };
  } catch (error) {
    console.error("Error exporting database:", error);
    return { success: false, message: "Error al exportar la base de datos." };
  }
}

const parseDate = (v: any): Date | undefined =>
  v ? new Date(v) : undefined;

export async function importDatabase(jsonContent: string) {
  try {
    const parsed = JSON.parse(jsonContent);

    if (!parsed.data || !parsed.version) {
      return { success: false, message: "Formato de archivo inválido." };
    }

    const {
      banners,
      news,
      events,
      siteSections,
      users,
      accounts,
      players,
      playerStats,
      playerCategoryStats,
      globalSettings,
      tournaments,
      tournamentRegistrations,
      prizes,
      notifications,
      games,
      tournamentGames,
      teams,
      raffles,
      rafflePrizes,
      raffleEntries,
      votingContests,
      votingEntries,
      votes,
    } = parsed.data;

    await db.$transaction(
      async (tx: any) => {
        // ── Delete in reverse dependency order to avoid FK violations ──
        await tx.vote.deleteMany();
        await tx.votingEntry.deleteMany();
        await tx.votingContest.deleteMany();
        await tx.raffleEntry.deleteMany();
        await tx.rafflePrize.deleteMany();
        await tx.raffle.deleteMany();
        await tx.tournamentRegistration.deleteMany();
        await tx.tournamentGame.deleteMany();
        await tx.team.deleteMany();
        await tx.tournament.deleteMany();
        await tx.playerCategoryStats.deleteMany();
        await tx.playerStats.deleteMany();
        await tx.account.deleteMany();
        await tx.player.deleteMany();
        await tx.banner.deleteMany();
        await tx.news.deleteMany();
        await tx.event.deleteMany();
        await tx.siteSection.deleteMany();
        await tx.prize.deleteMany();
        await tx.notification.deleteMany();
        await tx.game.deleteMany();
        await tx.globalSettings.deleteMany();
        await tx.user.deleteMany();

        // ── Restore in dependency order ──

        if (users?.length > 0)
          await tx.user.createMany({ data: users });

        if (players?.length > 0)
          await tx.player.createMany({
            data: players.map((p: any) => ({
              ...p,
              createdAt: parseDate(p.createdAt),
              updatedAt: parseDate(p.updatedAt),
            })),
          });

        if (accounts?.length > 0)
          await tx.account.createMany({
            data: accounts.map((a: any) => ({
              ...a,
              expires_at: a.expires_at ?? null,
            })),
          });

        if (playerStats?.length > 0)
          await tx.playerStats.createMany({ data: playerStats });

        if (playerCategoryStats?.length > 0)
          await tx.playerCategoryStats.createMany({
            data: playerCategoryStats.map((s: any) => ({
              ...s,
              updatedAt: parseDate(s.updatedAt),
            })),
          });

        if (globalSettings?.length > 0)
          await tx.globalSettings.createMany({
            data: globalSettings.map((g: any) => ({
              ...g,
              updatedAt: parseDate(g.updatedAt),
            })),
          });

        if (games?.length > 0)
          await tx.game.createMany({
            data: games.map((g: any) => ({
              ...g,
              createdAt: parseDate(g.createdAt),
              updatedAt: parseDate(g.updatedAt),
            })),
          });

        if (tournaments?.length > 0)
          await tx.tournament.createMany({
            data: tournaments.map((t: any) => ({
              ...t,
              date: parseDate(t.date),
              startedAt: parseDate(t.startedAt),
              createdAt: parseDate(t.createdAt),
              updatedAt: parseDate(t.updatedAt),
            })),
          });

        if (tournamentGames?.length > 0)
          await tx.tournamentGame.createMany({ data: tournamentGames });

        if (teams?.length > 0)
          await tx.team.createMany({
            data: teams.map((t: any) => ({
              ...t,
              createdAt: parseDate(t.createdAt),
              updatedAt: parseDate(t.updatedAt),
            })),
          });

        if (tournamentRegistrations?.length > 0)
          await tx.tournamentRegistration.createMany({
            data: tournamentRegistrations.map((r: any) => ({
              ...r,
              registeredAt: parseDate(r.registeredAt),
            })),
          });

        if (raffles?.length > 0)
          await tx.raffle.createMany({
            data: raffles.map((r: any) => ({
              ...r,
              drawDate: parseDate(r.drawDate),
              drawnAt: parseDate(r.drawnAt),
              createdAt: parseDate(r.createdAt),
              updatedAt: parseDate(r.updatedAt),
            })),
          });

        if (rafflePrizes?.length > 0)
          await tx.rafflePrize.createMany({
            data: rafflePrizes.map((rp: any) => ({
              ...rp,
              drawnAt: parseDate(rp.drawnAt),
            })),
          });

        if (raffleEntries?.length > 0)
          await tx.raffleEntry.createMany({
            data: raffleEntries.map((re: any) => ({
              ...re,
              enteredAt: parseDate(re.enteredAt),
            })),
          });

        if (votingContests?.length > 0)
          await tx.votingContest.createMany({
            data: votingContests.map((vc: any) => ({
              ...vc,
              startDate: parseDate(vc.startDate),
              endDate: parseDate(vc.endDate),
              createdAt: parseDate(vc.createdAt),
              updatedAt: parseDate(vc.updatedAt),
            })),
          });

        if (votingEntries?.length > 0)
          await tx.votingEntry.createMany({
            data: votingEntries.map((ve: any) => ({
              ...ve,
              createdAt: parseDate(ve.createdAt),
            })),
          });

        if (votes?.length > 0)
          await tx.vote.createMany({
            data: votes.map((v: any) => ({
              ...v,
              createdAt: parseDate(v.createdAt),
            })),
          });

        if (banners?.length > 0)
          await tx.banner.createMany({
            data: banners.map((b: any) => ({
              ...b,
              createdAt: parseDate(b.createdAt),
              updatedAt: parseDate(b.updatedAt),
            })),
          });

        if (news?.length > 0)
          await tx.news.createMany({
            data: news.map((n: any) => ({
              ...n,
              date: parseDate(n.date),
              createdAt: parseDate(n.createdAt),
              updatedAt: parseDate(n.updatedAt),
            })),
          });

        if (events?.length > 0)
          await tx.event.createMany({
            data: events.map((e: any) => ({
              ...e,
              date: parseDate(e.date),
              createdAt: parseDate(e.createdAt),
              updatedAt: parseDate(e.updatedAt),
            })),
          });

        if (siteSections?.length > 0)
          await tx.siteSection.createMany({
            data: siteSections.map((s: any) => ({
              ...s,
              updatedAt: parseDate(s.updatedAt),
            })),
          });

        if (prizes?.length > 0)
          await tx.prize.createMany({
            data: prizes.map((p: any) => ({
              ...p,
              createdAt: parseDate(p.createdAt),
              updatedAt: parseDate(p.updatedAt),
            })),
          });

        if (notifications?.length > 0)
          await tx.notification.createMany({
            data: notifications.map((n: any) => ({
              ...n,
              createdAt: parseDate(n.createdAt),
            })),
          });
      },
      { timeout: 60_000 }
    );

    revalidatePath("/admin");
    return { success: true, message: "Base de datos completa restaurada correctamente." };
  } catch (error) {
    console.error("Error importing database:", error);
    return {
      success: false,
      message: "Error al importar la base de datos. Verifica el archivo.",
    };
  }
}
