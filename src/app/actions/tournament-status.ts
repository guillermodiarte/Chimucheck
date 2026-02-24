"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
type TournamentStatus = "INSCRIPCION" | "EN_JUEGO" | "FINALIZADO";

export async function updateTournamentStatus(id: string, newStatus: TournamentStatus) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { registrations: { include: { player: true } } },
    });
    if (!tournament) return { success: false, message: "Torneo no encontrado" };

    const oldStatus = tournament.status;

    // If going FROM FINALIZADO to something else, revert stats
    if (oldStatus === "FINALIZADO" && newStatus !== "FINALIZADO") {
      let winners: any[] = [];
      try { winners = JSON.parse(tournament.winners as string || "[]"); } catch { }

      // Revert winner chimucoins and positional wins
      for (const w of winners) {
        if (!w.playerId) continue;
        if (w.chimucoins > 0) {
          await db.player.update({
            where: { id: w.playerId },
            data: { chimucoins: { decrement: w.chimucoins } },
          });
        }
        if (w.position >= 1 && w.position <= 3) {
          const field = w.position === 1 ? "winsFirst" : w.position === 2 ? "winsSecond" : "winsThird";
          await db.playerStats.update({
            where: { playerId: w.playerId },
            data: { wins: { decrement: 1 }, [field]: { decrement: 1 } },
          }).catch(() => { });
        }
      }

      // Revert matchesPlayed for all registered players
      for (const reg of tournament.registrations) {
        await db.playerStats.update({
          where: { playerId: reg.playerId },
          data: { matchesPlayed: { decrement: 1 } },
        }).catch(() => { });
      }

      // Clear winners and photos
      await db.tournament.update({
        where: { id },
        data: { status: newStatus, winners: "[]", photos: "[]" },
      });
    }
    // If going TO FINALIZADO, apply stats
    else if (newStatus === "FINALIZADO" && oldStatus !== "FINALIZADO") {
      const sorted = [...tournament.registrations].sort((a, b) => b.score - a.score);
      const top3 = sorted.slice(0, 3).filter(r => r.score > 0);
      const winners = top3.map((reg, i) => ({
        position: i + 1,
        playerId: reg.playerId,
        playerAlias: reg.player?.alias || reg.player?.name || "?",
        chimucoins: 0,
      }));

      await db.tournament.update({
        where: { id },
        data: { status: "FINALIZADO", winners: JSON.stringify(winners) },
      });

      // Increment matchesPlayed for all
      for (const reg of tournament.registrations) {
        await db.playerStats.upsert({
          where: { playerId: reg.playerId },
          create: { playerId: reg.playerId, matchesPlayed: 1 },
          update: { matchesPlayed: { increment: 1 } },
        });
      }

      // Increment positional wins for top 3
      for (const winner of winners) {
        const field = winner.position === 1 ? "winsFirst" : winner.position === 2 ? "winsSecond" : "winsThird";
        await db.playerStats.upsert({
          where: { playerId: winner.playerId },
          create: { playerId: winner.playerId, [field]: 1, wins: 1, matchesPlayed: 0 },
          update: { [field]: { increment: 1 }, wins: { increment: 1 } },
        });
      }
    }
    // Simple status change (e.g., INSCRIPCION <-> EN_JUEGO)
    else {
      await db.tournament.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true };
  } catch (error) {
    console.error("Error updating tournament status:", error);
    return { success: false, message: "Error al actualizar estado" };
  }
}
