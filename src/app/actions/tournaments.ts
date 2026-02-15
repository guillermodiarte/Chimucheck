
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
    format: formData.get("format"),
    maxPlayers: formData.get("maxPlayers"),
    prizePool: formData.get("prizePool"),
    active: formData.get("active") === "true" || formData.get("active") === "on",
    // Legacy: use first game name/image as fallback
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
        games: games, // Prisma will serialize the array to JSON
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
    format: formData.get("format"),
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
    await db.tournament.update({
      where: { id },
      data: {
        ...rest,
        games: games,
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
