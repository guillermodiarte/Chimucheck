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
        });

        for (const t of toStart) {
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
    setInterval(checkTournamentStatuses, 60 * 1000);

    console.log("[Scheduler] Tournament auto-status scheduler started (runs every 60s)");
  }
}
