/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts. Sets up background timers for
 * automatic tournament state transitions.
 *
 * - INSCRIPCION → EN_JUEGO   when tournament.date <= now  (only if autoStarted is false)
 * - EN_JUEGO    → FINALIZADO  8 hours after startedAt
 */
export async function register() {
  // Only run in the Node.js runtime (not in the Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { db } = await import("@/lib/prisma");
    const { checkIncompleteTeamsBeforeStart } = await import("@/app/actions/cron");

    /**
     * Checks and updates tournament statuses:
     * 1. INSCRIPCION → EN_JUEGO when scheduled date has passed AND autoStarted is false
     * 2. EN_JUEGO → FINALIZADO when 8 hours have elapsed since startedAt
     */
    async function checkTournamentStatuses() {
      try {
        const now = new Date();
        const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

        // 1. Transition INSCRIPCION → EN_JUEGO for tournaments whose date has arrived
        //    Only fire once: skip tournaments where autoStarted is already true
        //    (meaning it was already auto-triggered and then the admin reverted to INSCRIPCION)
        const toStart = await db.tournament.findMany({
          where: {
            status: "INSCRIPCION",
            date: { lte: now },
            autoStarted: false,
          },
          include: {
            registrations: true,
            teams: { include: { players: true } }
          }
        });

        for (const t of toStart) {
          // Check for incomplete teams in team-based tournaments
          if (t.isTeamBased && t.registrations.length > 0) {
            const playersWithTeam = new Set(t.teams.flatMap(team => team.players.map(p => p.id)));
            const hasOrphans = t.registrations.some(reg => !playersWithTeam.has(reg.playerId));

            if (hasOrphans) {
              const existingAlert = await db.notification.findFirst({
                where: {
                  type: "ORPHAN_PLAYERS_ALERT",
                  data: t.id,
                }
              });

              if (!existingAlert) {
                await db.notification.create({
                  data: {
                    type: "ORPHAN_PLAYERS_ALERT",
                    title: "⚠️ Arranque Abortado",
                    message: `El torneo en equipos "${t.name}" no pudo iniciar automáticamente porque existen jugadores inscriptos sin equipo asignado.`,
                    data: t.id,
                  }
                });
                console.log(
                  `[Scheduler] Sent orphan players alert for "${t.name}" (${t.id}).`
                );
              }

              console.log(
                `[Scheduler] Blocked auto-start for "${t.name}" (${t.id}). Reason: Orphan players.`
              );
              continue; // Skip this tournament, it won't auto-start
            }
          }

          await db.tournament.update({
            where: { id: t.id },
            data: {
              status: "EN_JUEGO",
              startedAt: now,
              autoStarted: true,
            },
          });
          console.log(
            `[Scheduler] Tournament "${t.name}" (${t.id}) → EN_JUEGO at ${now.toISOString()}`
          );
        }

        // 2. Transition EN_JUEGO → FINALIZADO for tournaments 8h after startedAt
        const toFinish = await db.tournament.findMany({
          where: {
            status: "EN_JUEGO",
            startedAt: { not: null, lte: eightHoursAgo },
          },
          include: { registrations: true },
        });

        for (const t of toFinish) {
          await db.tournament.update({
            where: { id: t.id },
            data: { status: "FINALIZADO" },
          });

          // Increment matchesPlayed for all registered players
          for (const reg of t.registrations) {
            await db.playerStats.upsert({
              where: { playerId: reg.playerId },
              create: { playerId: reg.playerId, matchesPlayed: 1 },
              update: { matchesPlayed: { increment: 1 } },
            });
          }
          console.log(
            `[Scheduler] Tournament "${t.name}" (${t.id}) → FINALIZADO (8h elapsed)`
          );
        }
      } catch (err) {
        console.error("[Scheduler] Error checking tournament statuses:", err);
      }
    }

    // Run immediately on startup, then every 60 seconds
    checkTournamentStatuses();
    checkIncompleteTeamsBeforeStart();
    setInterval(() => {
      checkTournamentStatuses();
      checkIncompleteTeamsBeforeStart();
    }, 60 * 1000);

    console.log("[Scheduler] Tournament auto-status scheduler started (runs every 60s)");
  }
}
