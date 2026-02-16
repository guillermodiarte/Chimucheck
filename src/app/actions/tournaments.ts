
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TournamentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.coerce.date(),
  format: z.string().optional(),
  maxPlayers: z.coerce.number().min(2, "Mínimo 2 jugadores"),
  prizePool: z.string().optional(),
  active: z.boolean().optional(),
  // Legacy fields (kept for backward compat)
  game: z.string().optional(),
  image: z.string().optional(),
  // New multi-game field
  games: z.string().optional(), // JSON string, parsed below
});

// Type for a single game entry
export type GameEntry = {
  name: string;
  image: string;
  format: string;
};

function parseGames(gamesRaw: string | undefined): GameEntry[] {
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

export async function getTournaments(onlyActive = true) {
  try {
    // Auto-finish tournaments whose date has passed
    await db.tournament.updateMany({
      where: {
        date: { lt: new Date() },
        status: { notIn: ["FINISHED", "CANCELLED"] },
      },
      data: { status: "FINISHED" },
    });

    const where = onlyActive ? { active: true } : {};
    const tournaments = await db.tournament.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        registrations: true,
      },
    });
    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
}

export async function getTournamentById(id: string) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            player: true,
          },
        },
      },
    });
    return tournament;
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return null;
  }
}

export async function createTournament(prevState: any, formData: FormData) {
  const gamesRaw = formData.get("games") as string | null;
  const games = parseGames(gamesRaw || undefined);

  const validatedFields = TournamentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    format: games.length > 0 ? games[0].format : (formData.get("format") as string) || undefined,
    maxPlayers: formData.get("maxPlayers"),
    prizePool: formData.get("prizePool"),
    active: formData.get("active") === "true" || formData.get("active") === "on",
    game: games.length > 0 ? games[0].name : (formData.get("game") as string) || undefined,
    image: games.length > 0 ? games[0].image : (formData.get("image") as string) || undefined,
    games: gamesRaw || "[]",
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Error de validación",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { games: gamesJson, ...rest } = validatedFields.data;
    await db.tournament.create({
      data: {
        ...rest,
        games: JSON.stringify(games), // Store as JSON string
      },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true, message: "Torneo creado correctamente" };
  } catch (error) {
    console.error("Error creating tournament:", error);
    return { success: false, message: "Error al crear torneo" };
  }
}

export async function updateTournament(id: string, prevState: any, formData: FormData) {
  const gamesRaw = formData.get("games") as string | null;
  const games = parseGames(gamesRaw || undefined);

  const validatedFields = TournamentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    format: games.length > 0 ? games[0].format : (formData.get("format") as string) || undefined,
    maxPlayers: formData.get("maxPlayers"),
    prizePool: formData.get("prizePool"),
    active: formData.get("active") === "true" || formData.get("active") === "on",
    game: games.length > 0 ? games[0].name : (formData.get("game") as string) || undefined,
    image: games.length > 0 ? games[0].image : (formData.get("image") as string) || undefined,
    games: gamesRaw || "[]",
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Error de validación",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { games: gamesJson, ...rest } = validatedFields.data;
    // If date is in the future, reset status to OPEN
    const statusUpdate = rest.date > new Date() ? { status: "OPEN" } : {};
    await db.tournament.update({
      where: { id },
      data: {
        ...rest,
        ...statusUpdate,
        games: JSON.stringify(games),
      },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true, message: "Torneo actualizado correctamente" };
  } catch (error) {
    console.error("Error updating tournament:", error);
    return { success: false, message: "Error al actualizar torneo" };
  }
}

export async function deleteTournament(id: string) {
  try {
    await db.tournament.delete({ where: { id } });
    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return { success: false, message: "Error al eliminar torneo" };
  }
}

export async function toggleTournamentStatus(id: string, currentStatus: boolean) {
  try {
    await db.tournament.update({
      where: { id },
      data: { active: !currentStatus },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
  } catch (error) {
    console.error("Error toggling tournament status:", error);
  }
}

export async function registerPlayer(tournamentId: string, playerId: string) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { registrations: true }
    });

    if (!tournament) return { success: false, message: "Torneo no encontrado" };

    if (!tournament.active) return { success: false, message: "El torneo no está activo" };

    if (tournament.registrations.length >= tournament.maxPlayers) {
      return { success: false, message: "El torneo está lleno" };
    }

    const existingRegistration = await db.tournamentRegistration.findUnique({
      where: {
        playerId_tournamentId: {
          playerId,
          tournamentId
        }
      }
    });

    if (existingRegistration) {
      return { success: false, message: "Ya estás inscrito en este torneo" };
    }

    await db.tournamentRegistration.create({
      data: {
        playerId,
        tournamentId,
        status: "CONFIRMED"
      }
    });

    await db.tournament.update({
      where: { id: tournamentId },
      data: {
        currentPlayers: { increment: 1 }
      }
    });

    revalidatePath(`/torneos/${tournamentId}`);
    revalidatePath("/torneos");
    return { success: true, message: "Inscripción exitosa" };

  } catch (error) {
    console.error("Error registering player:", error);
    return { success: false, message: "Error al inscribirse" };
  }
}

export async function unregisterPlayer(tournamentId: string, playerId: string) {
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
      return { success: false, message: "No estás inscrito en este torneo" };
    }

    await db.tournamentRegistration.delete({
      where: {
        playerId_tournamentId: {
          playerId,
          tournamentId,
        },
      },
    });

    await db.tournament.update({
      where: { id: tournamentId },
      data: {
        currentPlayers: { decrement: 1 },
      },
    });

    revalidatePath(`/torneos/${tournamentId}`);
    revalidatePath("/torneos");
    return { success: true, message: "Inscripción cancelada" };

  } catch (error) {
    console.error("Error unregistering player:", error);
    return { success: false, message: "Error al cancelar inscripción" };
  }
}

// --- Past Tournaments (Results) ---

export async function getFinishedTournaments() {
  try {
    const tournaments = await db.tournament.findMany({
      where: { status: "FINISHED" },
      orderBy: { date: "desc" },
      include: { registrations: { include: { player: true } } },
    });
    return tournaments;
  } catch (error) {
    console.error("Error fetching finished tournaments:", error);
    return [];
  }
}

export async function finishTournament(id: string) {
  try {
    await db.tournament.update({
      where: { id },
      data: { status: "FINISHED" },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true };
  } catch (error) {
    console.error("Error finishing tournament:", error);
    return { success: false, message: "Error al finalizar torneo" };
  }
}

export type WinnerEntry = {
  position: number;
  playerId: string;
  playerAlias: string;
};

export async function setTournamentWinners(id: string, winners: WinnerEntry[]) {
  try {
    await db.tournament.update({
      where: { id },
      data: { winners: JSON.stringify(winners) },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath(`/torneos/${id}`);
    return { success: true, message: "Ganadores guardados" };
  } catch (error) {
    console.error("Error setting winners:", error);
    return { success: false, message: "Error al guardar ganadores" };
  }
}

export async function setTournamentPhotos(id: string, photos: string[]) {
  try {
    await db.tournament.update({
      where: { id },
      data: { photos: JSON.stringify(photos) },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath(`/torneos/${id}`);
    return { success: true, message: "Fotos guardadas" };
  } catch (error) {
    console.error("Error setting photos:", error);
    return { success: false, message: "Error al guardar fotos" };
  }
}
