"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ChallengeSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.coerce.date(),
  maxPlayers: z.coerce.number().min(2, "Mínimo 2 jugadores"),
  prizePool: z.string().optional(),
  active: z.boolean().optional(),
  isRestricted: z.boolean().optional(),
  games: z.string().optional(), // JSON string
});

export type ChallengeGameEntry = {
  name: string;
  image: string;
  format: string;
  gameId?: string;
  categoryId?: string;
};

function parseGames(gamesRaw: string | undefined): ChallengeGameEntry[] {
  if (!gamesRaw) return [];
  try {
    const parsed = JSON.parse(gamesRaw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g: any) => g && typeof g.name === "string" && g.name.trim() !== ""
    );
  } catch {
    return [];
  }
}

export async function getChallenges(onlyActive = false) {
  try {
    const where = onlyActive ? { active: true } : {};
    const challenges = await db.challenge.findMany({
      where,
      include: {
        registrations: {
          include: {
            player: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });
    return challenges;
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return [];
  }
}

export async function getChallengeById(id: string) {
  try {
    const challenge = await db.challenge.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            player: true,
          },
          orderBy: { registeredAt: "asc" },
        },
      },
    });
    return challenge;
  } catch (error) {
    console.error("Error fetching challenge by id:", error);
    return null;
  }
}

export async function createChallenge(prevState: any, formData: FormData) {
  const gamesRaw = formData.get("games") as string | null;
  const games = parseGames(gamesRaw || undefined);

  const validated = ChallengeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    maxPlayers: formData.get("maxPlayers"),
    prizePool: formData.get("prizePool"),
    active: formData.get("active") === "true" || formData.get("active") === "on",
    isRestricted: formData.get("isRestricted") === "true" || formData.get("isRestricted") === "on",
    games: gamesRaw || "[]",
  });

  if (!validated.success) {
    return {
      success: false,
      message: "Error de validación",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const { games: _, ...rest } = validated.data;
    await db.challenge.create({
      data: {
        ...rest,
        games: JSON.stringify(games),
      },
    });

    revalidatePath("/admin/challenges");
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath("/torneos");
    revalidatePath("/desafios");
    return { success: true, message: "Desafío creado correctamente" };
  } catch (error) {
    console.error("Error creating challenge:", error);
    return { success: false, message: "Error al crear desafío" };
  }
}

export async function updateChallenge(id: string, prevState: any, formData: FormData) {
  const gamesRaw = formData.get("games") as string | null;
  const games = parseGames(gamesRaw || undefined);

  const validated = ChallengeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    maxPlayers: formData.get("maxPlayers"),
    prizePool: formData.get("prizePool"),
    active: formData.get("active") === "true" || formData.get("active") === "on",
    isRestricted: formData.get("isRestricted") === "true" || formData.get("isRestricted") === "on",
    games: gamesRaw || "[]",
  });

  if (!validated.success) {
    return {
      success: false,
      message: "Error de validación",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const { games: _, ...rest } = validated.data;
    await db.challenge.update({
      where: { id },
      data: {
        ...rest,
        games: JSON.stringify(games),
      },
    });

    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${id}/edit`);
    revalidatePath(`/admin/challenges/${id}/live`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath("/torneos");
    revalidatePath("/desafios");
    revalidatePath(`/desafios/${id}`);
    return { success: true, message: "Desafío actualizado correctamente" };
  } catch (error) {
    console.error("Error updating challenge:", error);
    return { success: false, message: "Error al actualizar desafío" };
  }
}

export async function deleteChallenge(id: string) {
  try {
    await db.challenge.delete({ where: { id } });
    revalidatePath("/admin/challenges");
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath("/torneos");
    revalidatePath("/desafios");
    return { success: true, message: "Desafío eliminado correctamente" };
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return { success: false, message: "Error al eliminar el desafío" };
  }
}

export async function toggleChallengeStatus(id: string, currentStatus: boolean) {
  try {
    await db.challenge.update({
      where: { id },
      data: { active: !currentStatus },
    });
    revalidatePath("/admin/challenges");
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath("/torneos");
    revalidatePath("/desafios");
  } catch (error) {
    console.error("Error toggling challenge status:", error);
  }
}

export async function updateChallengeState(id: string, status: string) {
  try {
    await db.challenge.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${id}/live`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath(`/desafios/${id}`);
    return { success: true, message: `Estado actualizado a ${status}` };
  } catch (error) {
    console.error("Error updating challenge state:", error);
    return { success: false, message: "Error al cambiar estado" };
  }
}

export async function registerPlayerToChallenge(challengeId: string, playerId: string) {
  try {
    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
      include: { registrations: true },
    });

    if (!challenge) return { success: false, message: "Desafío no encontrado" };

    if (challenge.registrations.length >= challenge.maxPlayers) {
      return { success: false, message: "El cupo máximo está completo" };
    }

    const alreadyRegistered = challenge.registrations.some((r) => r.playerId === playerId);
    if (alreadyRegistered) {
      return { success: false, message: "Ya estás registrado en este desafío" };
    }

    const status = challenge.isRestricted ? "PENDING" : "APPROVED";

    await db.challengeRegistration.create({
      data: {
        challengeId,
        playerId,
        status,
        score: 0,
        timesPlayed: 0,
        registeredAt: new Date(),
      },
    });

    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath(`/desafios/${challengeId}`);
    return {
      success: true,
      message: challenge.isRestricted
        ? "Inscripción enviada. Pendiente de aprobación por los organizadores."
        : "¡Inscripción exitosa!",
    };
  } catch (error) {
    console.error("Error registering player to challenge:", error);
    return { success: false, message: "Error al inscribirse" };
  }
}

export async function unregisterPlayerFromChallenge(challengeId: string, playerId: string) {
  try {
    await db.challengeRegistration.deleteMany({
      where: { challengeId, playerId },
    });

    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath(`/admin/challenges/${challengeId}/edit`);
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    revalidatePath(`/desafios/${challengeId}`);
    return { success: true, message: "Inscripción eliminada correctamente" };
  } catch (error) {
    console.error("Error unregistering player from challenge:", error);
    return { success: false, message: "Error al eliminar inscripción" };
  }
}

export async function addManualPlayerToChallenge(
  challengeId: string,
  payload: { playerId?: string; alias?: string; name?: string }
) {
  try {
    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
      include: { registrations: true },
    });

    if (!challenge) return { success: false, message: "Desafío no encontrado" };

    let targetPlayerId = payload.playerId;
    let playerName = payload.alias || payload.name || "Jugador";

    // 1. If existing playerId was selected
    if (targetPlayerId) {
      const existing = await db.player.findUnique({ where: { id: targetPlayerId } });
      if (!existing) return { success: false, message: "Jugador no encontrado en el sistema" };
      playerName = existing.alias || existing.name || "Jugador";
    } else if (payload.alias || payload.name) {
      // 2. Quick creation by alias / name (e.g. "Pepe", "Juan", "Lola")
      const aliasClean = (payload.alias || payload.name || "").trim();
      if (!aliasClean) return { success: false, message: "Ingresa un nombre o alias para el jugador" };

      let player = await db.player.findFirst({
        where: {
          OR: [
            { alias: { equals: aliasClean } },
            { name: { equals: aliasClean } },
          ],
        },
      });

      if (!player) {
        const randomHex = Math.random().toString(36).substring(2, 7);
        const email = `${aliasClean.toLowerCase().replace(/[^a-z0-9]/g, "")}_${randomHex}@test.chimuchek.com`;
        player = await db.player.create({
          data: {
            alias: aliasClean,
            name: payload.name?.trim() || aliasClean,
            email,
            registrationStatus: "APPROVED",
            active: true,
          },
        });
      }

      targetPlayerId = player.id;
      playerName = player.alias || player.name || aliasClean;
    } else {
      return { success: false, message: "Debes seleccionar o ingresar un jugador" };
    }

    // Check if already in this challenge
    const alreadyRegistered = challenge.registrations.some((r) => r.playerId === targetPlayerId);
    if (alreadyRegistered) {
      return { success: false, message: `El jugador "${playerName}" ya está en este desafío` };
    }

    // Add player to challenge directly as APPROVED
    await db.challengeRegistration.create({
      data: {
        challengeId,
        playerId: targetPlayerId,
        status: "APPROVED",
        score: 0,
        timesPlayed: 0,
        registeredAt: new Date(),
      },
    });

    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath(`/admin/challenges/${challengeId}/edit`);
    revalidatePath(`/desafios/${challengeId}`);
    return { success: true, message: `Jugador "${playerName}" agregado al desafío` };
  } catch (error) {
    console.error("Error adding manual player to challenge:", error);
    return { success: false, message: "Error al agregar jugador" };
  }
}

export async function updateChallengePlayerScore(
  challengeId: string,
  playerId: string,
  newScore: number,
  options?: { isUndo?: boolean }
) {
  try {
    const registration = await db.challengeRegistration.findUnique({
      where: {
        playerId_challengeId: {
          playerId,
          challengeId,
        },
      },
    });

    if (!registration) {
      return { success: false, message: "Inscripción no encontrada" };
    }

    // Parse existing score history
    let history: number[] = [];
    try {
      history = JSON.parse(registration.scoreHistory || "[]");
    } catch {
      history = [];
    }
    history.push(registration.score);

    // If it's a regular score adjustment (not an undo), increment timesPlayed and record lastPlayedAt
    const updateData: any = {
      score: newScore,
      scoreHistory: JSON.stringify(history),
    };

    if (!options?.isUndo) {
      updateData.timesPlayed = { increment: 1 };
      updateData.lastPlayedAt = new Date();
    }

    await db.challengeRegistration.update({
      where: {
        playerId_challengeId: {
          playerId,
          challengeId,
        },
      },
      data: updateData,
    });

    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath(`/desafios/${challengeId}`);
    revalidatePath(`/desafios/${challengeId}/live`);
    return { success: true, message: "Puntos actualizados" };
  } catch (error) {
    console.error("Error updating challenge player score:", error);
    return { success: false, message: "Error al actualizar puntaje" };
  }
}

export async function toggleChallengePlayerAbsent(
  challengeId: string,
  playerId: string,
  isAbsent: boolean
) {
  try {
    await db.challengeRegistration.update({
      where: {
        playerId_challengeId: {
          playerId,
          challengeId,
        },
      },
      data: { isAbsent },
    });

    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath(`/desafios/${challengeId}`);
    revalidatePath(`/desafios/${challengeId}/live`);
    return {
      success: true,
      message: isAbsent ? "Jugador marcado como ausente" : "Jugador reactivado en la cola",
    };
  } catch (error) {
    console.error("Error toggling absent status:", error);
    return { success: false, message: "Error al actualizar estado de ausente" };
  }
}

export async function finishChallenge(challengeId: string) {
  try {
    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
      include: {
        registrations: {
          include: { player: true },
          orderBy: { score: "desc" },
        },
      },
    });

    if (!challenge) return { success: false, message: "Desafío no encontrado" };

    // Calculate podium winners by score
    const topRegistrations = challenge.registrations.slice(0, 3);
    const winners = topRegistrations.map((reg, index) => ({
      position: index + 1,
      playerId: reg.playerId,
      name: reg.player?.alias || reg.player?.name || "Jugador",
      image: reg.player?.image || "",
      score: reg.score,
    }));

    await db.challenge.update({
      where: { id: challengeId },
      data: {
        status: "FINALIZADO",
        winners: JSON.stringify(winners),
      },
    });

    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath("/admin", "layout");
    revalidatePath(`/desafios/${challengeId}`);
    revalidatePath("/torneos");
    revalidatePath("/desafios");
    return { success: true, message: "Desafío finalizado con éxito" };
  } catch (error) {
    console.error("Error finishing challenge:", error);
    return { success: false, message: "Error al finalizar desafío" };
  }
}

export async function reactivateChallenge(challengeId: string) {
  try {
    await db.challenge.update({
      where: { id: challengeId },
      data: {
        status: "EN_JUEGO",
        winners: "[]",
      },
    });

    revalidatePath("/admin/challenges");
    revalidatePath(`/admin/challenges/${challengeId}/live`);
    revalidatePath("/admin", "layout");
    revalidatePath(`/desafios/${challengeId}`);
    revalidatePath("/torneos");
    revalidatePath("/desafios");
    return { success: true, message: "Desafío reactivado" };
  } catch (error) {
    console.error("Error reactivating challenge:", error);
    return { success: false, message: "Error al reactivar desafío" };
  }
}
