"use server";

import { db } from "@/lib/prisma";

export async function checkIncompleteTeamsBeforeStart() {
  try {
    const now = new Date();
    // Check tournaments starting within the next 1 hour
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingTournaments = await db.tournament.findMany({
      where: {
        status: "INSCRIPCION",
        isTeamBased: true,
        active: true,
        date: {
          lte: oneHourFromNow,
        },
      },
      include: {
        registrations: true,
        teams: {
          include: {
            players: true
          }
        }
      },
    });

    let notificationsSent = 0;

    for (const t of upcomingTournaments) {
      if (t.registrations.length === 0) continue;

      const playersWithTeam = new Set(t.teams.flatMap(team => team.players.map(p => p.id)));
      const hasOrphans = t.registrations.some(reg => !playersWithTeam.has(reg.playerId));
      
      if (hasOrphans) {
        const existingAlert = await db.notification.findFirst({
          where: {
            type: "ORPHAN_PLAYERS_ALERT",
            data: t.id,
            createdAt: {
               // Only alert once every 2 hours max per tournament
               gte: new Date(now.getTime() - 2 * 60 * 60 * 1000)
            }
          }
        });

        if (!existingAlert) {
          await db.notification.create({
            data: {
              type: "ORPHAN_PLAYERS_ALERT",
              title: "⚠️ Equipos Incompletos",
              message: `El torneo en equipos "${t.name}" está por comenzar y hay jugadores inscriptos sin equipo asignado.`,
              data: t.id,
            }
          });
          notificationsSent++;
        }
      }
    }

    return { success: true, notificationsSent };
  } catch (error) {
    console.error("Cron Error checkIncompleteTeamsBeforeStart:", error);
    return { success: false, error };
  }
}
