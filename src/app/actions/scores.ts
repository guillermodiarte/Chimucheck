"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ScoreUpdate = {
  playerId: string;
  tournamentId: string;
  newScore: number;
};

export async function updatePlayerScore({ playerId, tournamentId, newScore }: ScoreUpdate) {
  try {
    const registration = await db.tournamentRegistration.findUnique({
      where: {
        playerId_tournamentId: {
          playerId,
          tournamentId,
        },
      },
    });

    if (!registration) {
      return { success: false, message: "Inscripción no encontrada" };
    }

    // Save history for undo/redo
    const history = JSON.parse(registration.scoreHistory || "[]");
    history.push({ score: registration.score, timestamp: Date.now() });

    // Limit history size to last 50 entries to save space
    if (history.length > 50) history.shift();

    await db.tournamentRegistration.update({
      where: {
        playerId_tournamentId: {
          playerId,
          tournamentId,
        },
      },
      data: {
        score: newScore,
        scoreHistory: JSON.stringify(history),
      },
    });

    revalidatePath(`/admin/tournaments/results/${tournamentId}`);
    revalidatePath(`/admin/tournaments/live/${tournamentId}`);
    revalidatePath(`/live/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating score:", error);
    return { success: false, message: "Error al actualizar puntaje" };
  }
}

export async function undoLastScoreUpdate(playerId: string, tournamentId: string) {
  try {
    const registration = await db.tournamentRegistration.findUnique({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });

    if (!registration) return { success: false, message: "Registro no encontrado" };

    const history = JSON.parse(registration.scoreHistory || "[]");
    if (history.length === 0) return { success: false, message: "No hay historial para deshacer" };

    const lastEntry = history.pop();

    await db.tournamentRegistration.update({
      where: { playerId_tournamentId: { playerId, tournamentId } },
      data: {
        score: lastEntry.score,
        scoreHistory: JSON.stringify(history),
      },
    });

    revalidatePath(`/admin/tournaments/results/${tournamentId}`);
    revalidatePath(`/admin/tournaments/live/${tournamentId}`);
    revalidatePath(`/live/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Error undoing score:", error);
    return { success: false, message: "Error al deshacer" };
  }
}
