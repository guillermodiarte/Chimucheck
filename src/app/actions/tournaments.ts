
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateRank, canJoinTournament, RankTier, MMR_CONSTANTS } from "@/lib/mmr";

const TournamentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.coerce.date(),
  format: z.string().optional(),
  maxPlayers: z.coerce.number().min(2, "Mínimo 2 jugadores"),
  prizePool: z.string().optional(),
  active: z.boolean().optional(),
  isRestricted: z.boolean().optional(),
  category: z.string().default("SHOOTER"),
  requiredRank: z.string().default("AMATEUR"),
  isTeamBased: z.boolean().optional(),
  teamSize: z.coerce.number().optional().nullable(),
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
    const where = onlyActive ? { active: true } : {};
    const tournaments = await db.tournament.findMany({
      where,
      include: {
        registrations: true,
      },
    });

    // Custom sorting: Upcoming (ASC) then Past (DESC)
    const now = new Date();
    const upcoming = tournaments
      .filter(t => t.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const past = tournaments
      .filter(t => t.date < now)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return [...upcoming, ...past];
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
        teams: {
          include: {
            players: true,
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
    isRestricted: formData.get("isRestricted") === "true" || formData.get("isRestricted") === "on",
    category: formData.get("category") as string || "SHOOTER",
    requiredRank: formData.get("requiredRank") as string || "AMATEUR",
    isTeamBased: formData.get("isTeamBased") === "true" || formData.get("isTeamBased") === "on",
    teamSize: formData.get("teamSize") ? parseInt(formData.get("teamSize") as string, 10) : null,
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
    isRestricted: formData.get("isRestricted") === "true" || formData.get("isRestricted") === "on",
    category: formData.get("category") as string || "SHOOTER",
    requiredRank: formData.get("requiredRank") as string || "AMATEUR",
    isTeamBased: formData.get("isTeamBased") === "true" || formData.get("isTeamBased") === "on",
    teamSize: formData.get("teamSize") ? parseInt(formData.get("teamSize") as string, 10) : null,
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
    const isMovingToFuture = rest.date > new Date();

    // If moving to future, revert all results from this tournament
    if (isMovingToFuture) {
      const current = await db.tournament.findUnique({
        where: { id },
        include: { registrations: true },
      });

      if (current) {
        // Revert winners: chimucoins and wins
        let winners: any[] = [];
        try { winners = JSON.parse(current.winners as string || "[]"); } catch { }

        for (const w of winners) {
          if (!w.playerId) continue;
          // Revert chimucoins
          if (w.chimucoins > 0) {
            await db.player.update({
              where: { id: w.playerId },
              data: { chimucoins: { decrement: w.chimucoins } },
            });
          }
          // Revert positional wins
          if (w.position >= 1 && w.position <= 3) {
            const updateData: any = { wins: { decrement: 1 } };
            if (w.position === 1) updateData.winsFirst = { decrement: 1 };
            else if (w.position === 2) updateData.winsSecond = { decrement: 1 };
            else if (w.position === 3) updateData.winsThird = { decrement: 1 };

            await db.playerStats.update({
              where: { playerId: w.playerId },
              data: updateData,
            }).catch(() => { });
          }
        }

        // Revert matchesPlayed for all registered players (only if was FINALIZADO)
        if (current.status === "FINALIZADO") {
          for (const reg of current.registrations) {
            await db.playerStats.update({
              where: { playerId: reg.playerId },
              data: { matchesPlayed: { decrement: 1 } },
            }).catch(() => { });
          }

          // Revert MMR points
          for (const reg of current.registrations) {
            let delta = -MMR_CONSTANTS.POINTS_LOSS; // Loss revert (+5)
            let winnerEntry;
            try { 
              const parsedWinners = JSON.parse(current.winners as string || "[]");
              winnerEntry = parsedWinners.find((w: any) => w.playerId === reg.playerId);
            } catch { }
            
            if (winnerEntry) {
              if (winnerEntry.position === 1) delta = -MMR_CONSTANTS.POINTS_1ST;
              else if (winnerEntry.position === 2) delta = -MMR_CONSTANTS.POINTS_2ND;
              else if (winnerEntry.position === 3) delta = -MMR_CONSTANTS.POINTS_3RD;
            }

            const currentStats = await db.playerCategoryStats.findUnique({
              where: { playerId_category: { playerId: reg.playerId, category: current.category } }
            });

            const currentPoints = currentStats?.points || 0;
            const newPoints = Math.max(MMR_CONSTANTS.MIN_POINTS, Math.min(MMR_CONSTANTS.MAX_POINTS, currentPoints + delta));

            await db.playerCategoryStats.upsert({
              where: { playerId_category: { playerId: reg.playerId, category: current.category } },
              create: { playerId: reg.playerId, category: current.category, points: newPoints },
              update: { points: newPoints }
            }).catch((e) => console.error("Error reverting MMR stats in updateTournament:", e));
          }
        }
      }
    }

    await db.tournament.update({
      where: { id },
      data: {
        ...rest,
        ...(isMovingToFuture ? { status: "INSCRIPCION", winners: "[]", photos: "[]", autoStarted: false, startedAt: null } : {}),
        games: JSON.stringify(games),
      },
    });
    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    revalidatePath("/player/dashboard");
    return { success: true, message: "Torneo actualizado correctamente" };
  } catch (error) {
    console.error("Error updating tournament:", error);
    return { success: false, message: "Error al actualizar torneo" };
  }
}

export async function deleteTournament(id: string) {
  try {
    const current = await db.tournament.findUnique({
      where: { id },
      include: { registrations: true },
    });

    // Revertir MMR y premios si el torneo estaba finalizado
    if (current && current.status === "FINALIZADO") {
      let winners: any[] = [];
      try { winners = JSON.parse(current.winners as string || "[]"); } catch { }

      // 1. Revertir Chimucoins e Historial Posicional
      for (const w of winners) {
        if (!w.playerId) continue;
        if (w.chimucoins > 0) {
          await db.player.update({
            where: { id: w.playerId },
            data: { chimucoins: { decrement: w.chimucoins } },
          });
        }
        if (w.position >= 1 && w.position <= 3) {
          const updateData: any = { wins: { decrement: 1 } };
          if (w.position === 1) updateData.winsFirst = { decrement: 1 };
          else if (w.position === 2) updateData.winsSecond = { decrement: 1 };
          else if (w.position === 3) updateData.winsThird = { decrement: 1 };
          await db.playerStats.update({
            where: { playerId: w.playerId },
            data: updateData,
          }).catch(() => {});
        }
      }

      // Revertir matchesPlayed
      for (const reg of current.registrations) {
        await db.playerStats.update({
          where: { playerId: reg.playerId },
          data: { matchesPlayed: { decrement: 1 } },
        }).catch(() => {});
      }

      // 2. Bugfix: Revertir Puntos MMR basado en posiciones
      for (const reg of current.registrations) {
        let delta = 5; // Loss revert = +5
        const winnerEntry = winners.find(w => w.playerId === reg.playerId);
        
        if (winnerEntry) {
          if (winnerEntry.position === 1) delta = -15; // 1st revert = -15
          else if (winnerEntry.position === 2) delta = -10; // 2nd revert = -10
          else if (winnerEntry.position === 3) delta = -5; // 3rd revert = -5
        }

        const currentStats = await db.playerCategoryStats.findUnique({
          where: { playerId_category: { playerId: reg.playerId, category: current.category } }
        });

        const currentPoints = currentStats?.points || 0;
        const newPoints = Math.max(0, Math.min(100, currentPoints + delta));

        await db.playerCategoryStats.upsert({
          where: { playerId_category: { playerId: reg.playerId, category: current.category } },
          create: { playerId: reg.playerId, category: current.category, points: newPoints },
          update: { points: newPoints }
        }).catch((e) => console.error("Error reverting MMR stats in deleteTournament:", e));
      }
    }

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

    // --- MMR Validation ---
    const playerStats = await db.playerCategoryStats.findUnique({
      where: {
        playerId_category: {
          playerId,
          category: tournament.category
        }
      }
    });

    const points = playerStats?.points || 0;
    const playerRank = calculateRank(points);
    const requiredRank = tournament.requiredRank as RankTier;

    if (!canJoinTournament(playerRank.tier, requiredRank)) {
      return {
        success: false,
        message: `No cumples con el nivel. Eres ${playerRank.label} y el torneo es para ${requiredRank}.`
      };
    }
    // -----------------------

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

    const status = tournament.isRestricted ? "PENDING" : "CONFIRMED";

    await db.tournamentRegistration.create({
      data: {
        playerId,
        tournamentId,
        status
      }
    });

    if (status === "CONFIRMED") {
      await db.tournament.update({
        where: { id: tournamentId },
        data: {
          currentPlayers: { increment: 1 }
        }
      });
    }

    // Get player info for notification
    const player = await db.player.findUnique({ where: { id: playerId } });

    // Create notification for admin (non-blocking)
    try {
      await db.notification.create({
        data: {
          type: tournament.isRestricted ? "PENDING_REGISTRATION" : "TOURNAMENT_REGISTRATION",
          title: tournament.isRestricted ? "Solicitud de Inscripción" : "Inscripción a Torneo",
          message: tournament.isRestricted
            ? `${player?.alias || player?.name || "Jugador"} ha solicitado unirse a ${tournament.name}.`
            : `${player?.alias || player?.name || "Jugador"} se inscribió a ${tournament.name}.`,
          data: JSON.stringify({ playerId, tournamentId, tournamentName: tournament.name }),
        },
      });
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr);
    }

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

    // Desvincular al jugador de cualquier equipo que tenga en este torneo
    const playerTeams = await db.team.findMany({
      where: {
        tournamentId,
        players: { some: { id: playerId } },
      },
    });

    for (const team of playerTeams) {
      await db.team.update({
        where: { id: team.id },
        data: {
          players: { disconnect: { id: playerId } },
        },
      });
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

// --- Admin Team Management ---

export async function adminCreateTeam(tournamentId: string, teamName: string, playerIds: string[], image?: string) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: true,
        teams: {
          include: { players: true }
        }
      }
    });

    if (!tournament) return { success: false, message: "Torneo no encontrado" };
    if (!tournament.isTeamBased) return { success: false, message: "Este torneo no es de equipos" };

    const expectedSize = tournament.teamSize || 2;
    if (playerIds.length === 0 || playerIds.length > expectedSize) {
      return { success: false, message: `El equipo debe tener entre 1 y ${expectedSize} jugadores` };
    }

    // Check if team name exists in this tournament
    const existingTeam = await db.team.findUnique({
      where: { tournamentId_name: { tournamentId, name: teamName } }
    });
    if (existingTeam) return { success: false, message: "Ese nombre de equipo ya existe en este torneo" };

    const playersInTournament = tournament.registrations.map(r => r.playerId);

    const playersAlreadyInOtherTeams = new Set<string>();
    for (const t of tournament.teams) {
      for (const p of t.players) {
        playersAlreadyInOtherTeams.add(p.id);
      }
    }

    // Check if any player is NOT registered or ALREADY in a team
    for (const pId of playerIds) {
      if (!playersInTournament.includes(pId)) {
        return { success: false, message: `Un jugador seleccionado no está inscripto en el torneo` };
      }
      if (playersAlreadyInOtherTeams.has(pId)) {
        return { success: false, message: `Un jugador seleccionado ya pertenece a otro equipo` };
      }
    }

    // Create Team connecting the players
    await db.team.create({
      data: {
        name: teamName,
        image: image || null,
        tournamentId,
        players: {
          connect: playerIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath(`/admin/tournaments/${tournamentId}`);
    return { success: true, message: "Equipo creado exitosamente" };

  } catch (error) {
    console.error("Error creating team:", error);
    return { success: false, message: "Error al crear equipo" };
  }
}

export async function adminUpdateTeam(teamId: string, teamName: string, playerIds: string[], image?: string) {
  try {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { tournament: true }
    });
    if (!team) return { success: false, message: "Equipo no encontrado" };

    const expectedSize = team.tournament.teamSize || 2;
    if (playerIds.length === 0 || playerIds.length > expectedSize) {
      return { success: false, message: `El equipo debe tener entre 1 y ${expectedSize} jugadores` };
    }

    if (teamName !== team.name) {
      const existingTeam = await db.team.findFirst({
        where: { tournamentId: team.tournamentId, name: teamName }
      });
      if (existingTeam) return { success: false, message: "Ese nombre de equipo ya existe en este torneo" };
    }

    await db.team.update({
      where: { id: teamId },
      data: {
        name: teamName,
        image: image || null,
        players: {
          set: playerIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath(`/admin/tournaments/results/${team.tournamentId}`);
    return { success: true, message: "Equipo actualizado correctamente" };
  } catch (error) {
    console.error("Error updating team:", error);
    return { success: false, message: "Error al actualizar equipo" };
  }
}

export async function adminDeleteTeam(teamId: string) {
  try {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) return { success: false, message: "Equipo no encontrado" };

    await db.team.delete({ where: { id: teamId } });

    revalidatePath(`/admin/tournaments/${team.tournamentId}`);
    return { success: true, message: "Equipo eliminado" };
  } catch (error) {
    console.error("Error deleting team:", error);
    return { success: false, message: "Error al eliminar equipo" };
  }
}

export async function adminResetTournamentScores(tournamentId: string) {
  try {
    await db.tournamentRegistration.updateMany({
      where: { tournamentId },
      data: { score: 0 }
    });
    revalidatePath(`/admin/tournaments/results/${tournamentId}`);
    return { success: true, message: "Puntajes reseteados a 0" };
  } catch (error) {
    console.error("Error resetting scores:", error);
    return { success: false, message: "Error al resetear puntajes" };
  }
}

// --- Past Tournaments (Results) ---

export async function getFinishedTournaments() {
  try {
    const tournaments = await db.tournament.findMany({
      where: { status: "FINALIZADO" },
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
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { registrations: { include: { player: true } } },
    });
    if (!tournament) return { success: false, message: "Torneo no encontrado" };

    let winners: WinnerEntry[] = [];
    let mmrDeltas = new Map<string, number>(); // playerId -> delta

    let chimucoinsFirst = 0;
    let chimucoinsSecond = 0;
    let chimucoinsThird = 0;

    if (tournament.prizePool) {
      try {
        const prizeData = JSON.parse(tournament.prizePool);
        if (prizeData.type === "CHIMUCOINS" || prizeData.type === "AMBOS") {
          chimucoinsFirst = parseInt(prizeData.chimucoinsFirst) || 0;
          chimucoinsSecond = parseInt(prizeData.chimucoinsSecond) || 0;
          chimucoinsThird = parseInt(prizeData.chimucoinsThird) || 0;
        }
      } catch (e) {
        console.error("Error parsing prizePool", e);
      }
    }

    if (tournament.isTeamBased) {
      // 1. Group records by Team (We know user belongs to a Team via tournament.teams)
      // tournament.teams has the players. We can match registration to Team
      // Wait, we need to fetch teams again if they weren't included. Let's do it safely.
      const teamsWithPlayers = await db.team.findMany({
        where: { tournamentId: id },
        include: { players: true }
      });

      // Map playerId -> teamId
      const playerTeamMap = new Map<string, string>();
      for (const t of teamsWithPlayers) {
        for (const p of t.players) {
          playerTeamMap.set(p.id, t.id);
        }
      }

      // Group registrations by teamId
      const teamScores = new Map<string, number>(); // teamId -> totalScore
      const teamPlayers = new Map<string, typeof tournament.registrations>(); // teamId -> registrations[]

      for (const reg of tournament.registrations) {
        const tId = playerTeamMap.get(reg.playerId) || "no-team-" + reg.playerId; // Fallback
        
        teamScores.set(tId, Math.max(teamScores.get(tId) || 0, reg.score));
        
        const arr = teamPlayers.get(tId) || [];
        arr.push(reg);
        teamPlayers.set(tId, arr);
      }

      const sortedTeams = Array.from(teamScores.entries()).sort((a, b) => b[1] - a[1]);
      const uniqueScores = Array.from(new Set(sortedTeams.map(t => t[1])));

      for (const [tId, totalScore] of sortedTeams) {
        const teamRegs = teamPlayers.get(tId) || [];
        const rankPosition = uniqueScores.indexOf(totalScore) + 1;
        
        let delta = MMR_CONSTANTS.POINTS_LOSS; // -5
        if (rankPosition === 1) delta = MMR_CONSTANTS.POINTS_1ST;
        else if (rankPosition === 2) delta = MMR_CONSTANTS.POINTS_2ND;
        else if (rankPosition === 3) delta = MMR_CONSTANTS.POINTS_3RD;

        for (const reg of teamRegs) {
          mmrDeltas.set(reg.playerId, delta);
          
          if (rankPosition <= 3) {
            winners.push({
              position: rankPosition,
              playerId: reg.playerId,
              playerAlias: reg.player?.alias || reg.player?.name || "?",
              chimucoins: rankPosition === 1 ? chimucoinsFirst : rankPosition === 2 ? chimucoinsSecond : rankPosition === 3 ? chimucoinsThird : 0,
            });
          }
        }
      }

    } else {
      // Sort registrations by score (descending)
      const sorted = [...tournament.registrations].sort((a, b) => b.score - a.score);
      const uniqueScores = Array.from(new Set(sorted.map(s => s.score)));
      
      for (let i = 0; i < sorted.length; i++) {
        const reg = sorted[i];
        
        const rankPosition = uniqueScores.indexOf(reg.score) + 1;

        if (rankPosition <= 3) {
          winners.push({
            position: rankPosition,
            playerId: reg.playerId,
            playerAlias: reg.player?.alias || reg.player?.name || "?",
            chimucoins: rankPosition === 1 ? chimucoinsFirst : rankPosition === 2 ? chimucoinsSecond : rankPosition === 3 ? chimucoinsThird : 0,
          });
        }
      }

      for (let i = 0; i < sorted.length; i++) {
        const rankPosition = uniqueScores.indexOf(sorted[i].score) + 1;
        let delta = MMR_CONSTANTS.POINTS_LOSS; // -5
        if (rankPosition === 1) delta = MMR_CONSTANTS.POINTS_1ST; // +15
        else if (rankPosition === 2) delta = MMR_CONSTANTS.POINTS_2ND; // +10
        else if (rankPosition === 3) delta = MMR_CONSTANTS.POINTS_3RD; // +5
        mmrDeltas.set(sorted[i].playerId, delta);
      }
    }

    await db.tournament.update({
      where: { id },
      data: { status: "FINALIZADO", winners: JSON.stringify(winners) },
    });

    // Increment matchesPlayed for all registered players
    for (const reg of tournament.registrations) {
      await db.playerStats.upsert({
        where: { playerId: reg.playerId },
        create: { playerId: reg.playerId, matchesPlayed: 1 },
        update: { matchesPlayed: { increment: 1 } },
      });
    }

    // Increment positional wins and chimucoins for top 3
    for (const winner of winners) {
      const field = winner.position === 1 ? "winsFirst" : winner.position === 2 ? "winsSecond" : "winsThird";
      await db.playerStats.upsert({
        where: { playerId: winner.playerId },
        create: { playerId: winner.playerId, [field]: 1, wins: 1, matchesPlayed: 0 },
        update: { [field]: { increment: 1 }, wins: { increment: 1 } },
      });

      if (winner.chimucoins > 0) {
        await db.player.update({
          where: { id: winner.playerId },
          data: { chimucoins: { increment: winner.chimucoins } },
        });
      }
    }

    // --- MMR Update Logic ---
    for (const reg of tournament.registrations) {
      const delta = mmrDeltas.get(reg.playerId) || MMR_CONSTANTS.POINTS_LOSS;
      
      // Fetch current points to safely clamp between 0 and 100
      const currentStats = await db.playerCategoryStats.findUnique({
        where: { playerId_category: { playerId: reg.playerId, category: tournament.category } }
      });

      const currentPoints = currentStats?.points || 0;
      const newPoints = Math.max(MMR_CONSTANTS.MIN_POINTS, Math.min(MMR_CONSTANTS.MAX_POINTS, currentPoints + delta));

      await db.playerCategoryStats.upsert({
        where: { playerId_category: { playerId: reg.playerId, category: tournament.category } },
        create: { playerId: reg.playerId, category: tournament.category, points: newPoints },
        update: { points: newPoints }
      });
    }
    // -------------------------

    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true };
  } catch (error) {
    console.error("Error finishing tournament:", error);
    return { success: false, message: "Error al finalizar torneo" };
  }
}

export async function reactivateTournament(id: string) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { registrations: true },
    });
    if (!tournament) return { success: false, message: "Torneo no encontrado" };
    if (tournament.status !== "FINALIZADO") return { success: false, message: "El torneo no está finalizado" };

    // Revert winners: chimucoins and wins
    let winners: any[] = [];
    try { winners = JSON.parse(tournament.winners as string || "[]"); } catch { }

    for (const w of winners) {
      if (!w.playerId) continue;
      // Revert chimucoins
      if (w.chimucoins > 0) {
        await db.player.update({
          where: { id: w.playerId },
          data: { chimucoins: { decrement: w.chimucoins } },
        });
      }
      // Revert positional wins
      if (w.position >= 1 && w.position <= 3) {
        const updateData: any = { wins: { decrement: 1 } };
        if (w.position === 1) updateData.winsFirst = { decrement: 1 };
        else if (w.position === 2) updateData.winsSecond = { decrement: 1 };
        else if (w.position === 3) updateData.winsThird = { decrement: 1 };

        await db.playerStats.update({
          where: { playerId: w.playerId },
          data: updateData,
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

    // Revert MMR points based on tournament category
    for (const reg of tournament.registrations) {
      let delta = -MMR_CONSTANTS.POINTS_LOSS; // Loss revert (+5)
      const winnerEntry = winners.find(w => w.playerId === reg.playerId);
      
      if (winnerEntry) {
        if (winnerEntry.position === 1) delta = -MMR_CONSTANTS.POINTS_1ST; // -15
        else if (winnerEntry.position === 2) delta = -MMR_CONSTANTS.POINTS_2ND; // -10
        else if (winnerEntry.position === 3) delta = -MMR_CONSTANTS.POINTS_3RD; // -5
      }

      const currentStats = await db.playerCategoryStats.findUnique({
        where: { playerId_category: { playerId: reg.playerId, category: tournament.category } }
      });

      const currentPoints = currentStats?.points || 0;
      const newPoints = Math.max(MMR_CONSTANTS.MIN_POINTS, Math.min(MMR_CONSTANTS.MAX_POINTS, currentPoints + delta));

      await db.playerCategoryStats.upsert({
        where: { playerId_category: { playerId: reg.playerId, category: tournament.category } },
        create: { playerId: reg.playerId, category: tournament.category, points: newPoints },
        update: { points: newPoints }
      }).catch((e) => console.error("Error reverting MMR stats in reactivateTournament:", e));
    }

    await db.tournament.update({
      where: { id },
      data: { status: "EN_JUEGO", winners: "[]", photos: "[]", startedAt: new Date() },
    });

    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return { success: true };
  } catch (error) {
    console.error("Error reactivating tournament:", error);
    return { success: false, message: "Error al reactivar el torneo" };
  }
}

export type WinnerEntry = {
  position: number;
  playerId: string;
  playerAlias: string;
  chimucoins: number;
};

export async function setTournamentWinners(id: string, winners: WinnerEntry[]) {
  try {
    // Get previous winners to avoid double-counting
    const tournament = await db.tournament.findUnique({ where: { id } });
    let prevWinners: WinnerEntry[] = [];
    try {
      prevWinners = JSON.parse(tournament?.winners || "[]");
    } catch { prevWinners = []; }
    const prevWinnerIds = new Set(prevWinners.filter(w => w.playerId).map(w => w.playerId));
    const prevChimucoins = new Map(prevWinners.map(w => [w.playerId, w.chimucoins || 0]));

    // Save winners data
    await db.tournament.update({
      where: { id },
      data: { winners: JSON.stringify(winners) },
    });

    for (const winner of winners) {
      if (!winner.playerId) continue;

      // Award chimucoins (difference from previous)
      const prevCoins = prevChimucoins.get(winner.playerId) || 0;
      const coinsDiff = winner.chimucoins - prevCoins;
      if (coinsDiff !== 0) {
        await db.player.update({
          where: { id: winner.playerId },
          data: { chimucoins: { increment: coinsDiff } },
        });
      }

      // Track positional wins for positions 1-3
      if (winner.position >= 1 && winner.position <= 3) {
        const prevWinner = prevWinners.find(w => w.playerId === winner.playerId);
        const prevPosition = prevWinner?.position || 0;

        // Build update data
        const updateData: any = {};
        const createData: any = { playerId: winner.playerId, matchesPlayed: 0 };

        // If player had a previous position, decrement it
        if (prevPosition >= 1 && prevPosition <= 3 && prevPosition !== winner.position) {
          const prevField = prevPosition === 1 ? "winsFirst" : prevPosition === 2 ? "winsSecond" : "winsThird";
          updateData[prevField] = { decrement: 1 };
          updateData.wins = { decrement: 1 };
        }

        // If player is new to podium or changed position, increment new position
        if (prevPosition !== winner.position) {
          const newField = winner.position === 1 ? "winsFirst" : winner.position === 2 ? "winsSecond" : "winsThird";
          // Can't mix increment in same upsert, so do separate update
          await db.playerStats.upsert({
            where: { playerId: winner.playerId },
            create: { ...createData, [newField]: 1, wins: 1 },
            update: { [newField]: { increment: 1 }, ...(prevPosition < 1 || prevPosition > 3 ? { wins: { increment: 1 } } : {}) },
          });
        }

        // If player had a previous different position, decrement old position
        if (prevPosition >= 1 && prevPosition <= 3 && prevPosition !== winner.position) {
          const prevField = prevPosition === 1 ? "winsFirst" : prevPosition === 2 ? "winsSecond" : "winsThird";
          await db.playerStats.update({
            where: { playerId: winner.playerId },
            data: { [prevField]: { decrement: 1 } },
          }).catch(() => { });
        }

        // Update winRate
        const stats = await db.playerStats.findUnique({ where: { playerId: winner.playerId } });
        if (stats && stats.matchesPlayed > 0) {
          await db.playerStats.update({
            where: { playerId: winner.playerId },
            data: { winRate: stats.wins / stats.matchesPlayed },
          });
        }
      }
    }

    // Handle removed winners: decrement positional wins
    for (const prev of prevWinners) {
      if (prev.playerId && !winners.find(w => w.playerId === prev.playerId)) {
        const updateData: any = { wins: { decrement: 1 } };
        if (prev.position === 1) updateData.winsFirst = { decrement: 1 };
        else if (prev.position === 2) updateData.winsSecond = { decrement: 1 };
        else if (prev.position === 3) updateData.winsThird = { decrement: 1 };

        await db.playerStats.update({
          where: { playerId: prev.playerId },
          data: updateData,
        }).catch(() => { }); // ignore if stats don't exist
      }
    }

    revalidatePath("/admin/tournaments");
    revalidatePath(`/torneos/${id}`);
    return { success: true, message: "Ganadores guardados y chimucoins otorgados" };
  } catch (error) {
    console.error("Error setting winners:", error);
    return { success: false, message: "Error al guardar ganadores" };
  }
}

export async function revertTournamentChimucoins(id: string) {
  try {
    const tournament = await db.tournament.findUnique({ where: { id } });
    if (!tournament) return { success: false, message: "Torneo no encontrado" };

    let winners: WinnerEntry[] = [];
    try { winners = JSON.parse(tournament.winners || "[]"); } catch { winners = []; }

    // Revert chimucoins for each winner
    for (const w of winners) {
      if (!w.playerId || !w.chimucoins || w.chimucoins <= 0) continue;
      await db.player.update({
        where: { id: w.playerId },
        data: { chimucoins: { decrement: w.chimucoins } },
      });
    }

    // Clear winners so setTournamentWinners sees no previous entries
    await db.tournament.update({
      where: { id },
      data: { winners: "[]" },
    });

    revalidatePath("/admin/tournaments");
    return { success: true, previousWinners: winners };
  } catch (error) {
    console.error("Error reverting chimucoins:", error);
    return { success: false, message: "Error al revertir chimucoins" };
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

// ─── Export / Import ────────────────────────────────────────────────────────

export async function getTournamentsForExport() {
  try {
    const tournaments = await db.tournament.findMany({
      orderBy: { date: "asc" },
      include: {
        registrations: true,
      },
    });
    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments for export:", error);
    return [];
  }
}

export async function importTournaments(prevState: any, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { success: false, message: "No se seleccionó ningún archivo." };

  try {
    const text = await file.text();
    const tournamentsData = JSON.parse(text);

    if (!Array.isArray(tournamentsData)) {
      return { success: false, message: "El archivo JSON no contiene un arreglo de torneos válido." };
    }

    let processed = 0;
    let failed = 0;

    for (const t of tournamentsData) {
      if (!t.id || !t.name) { failed++; continue; }
      try {
        await db.tournament.upsert({
          where: { id: t.id },
          update: {
            name: t.name,
            description: t.description || null,
            date: t.date ? new Date(t.date) : new Date(),
            format: t.format || null,
            maxPlayers: t.maxPlayers ?? 0,
            currentPlayers: t.currentPlayers ?? 0,
            prizePool: t.prizePool || null,
            status: t.status ?? "INSCRIPCION",
            active: t.active ?? true,
            games: t.games ?? null,
            game: t.game || null,
            image: t.image || null,
            photos: t.photos ?? "[]",
            winners: t.winners ?? "[]",
          },
          create: {
            id: t.id,
            name: t.name,
            description: t.description || null,
            date: t.date ? new Date(t.date) : new Date(),
            format: t.format || null,
            maxPlayers: t.maxPlayers ?? 0,
            currentPlayers: t.currentPlayers ?? 0,
            prizePool: t.prizePool || null,
            status: t.status ?? "INSCRIPCION",
            active: t.active ?? true,
            games: t.games ?? null,
            game: t.game || null,
            image: t.image || null,
            photos: t.photos ?? "[]",
            winners: t.winners ?? "[]",
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          }
        });

        // Restore registrations
        if (Array.isArray(t.registrations)) {
          for (const reg of t.registrations) {
            if (!reg.playerId) continue;
            const playerExists = await db.player.findUnique({ where: { id: reg.playerId } });
            if (!playerExists) continue;
            await db.tournamentRegistration.upsert({
              where: { id: reg.id || `${t.id}_${reg.playerId}` },
              update: { score: reg.score ?? 0 },
              create: {
                id: reg.id || undefined,
                tournamentId: t.id,
                playerId: reg.playerId,
                score: reg.score ?? 0,
              }
            }).catch(() => { });
          }
        }

        processed++;
      } catch (err) {
        console.error(`Error importing tournament ${t.name}:`, err);
        failed++;
      }
    }

    revalidatePath("/admin/tournaments");
    revalidatePath("/torneos");
    return {
      success: true,
      message: `Importación JSON finalizada. Torneos: ${processed} ok, ${failed} fallidos.`,
    };
  } catch (error) {
    console.error("Import tournaments error:", error);
    return { success: false, message: "Error al procesar el archivo JSON de torneos." };
  }
}
