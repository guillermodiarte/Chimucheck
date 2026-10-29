import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Trophy, Swords, Gamepad2 } from "lucide-react";
import TournamentCard from "@/components/tournaments/TournamentCard";
import ChallengeCard from "@/components/challenges/ChallengeCard";
import { CompetitionTabNav } from "@/components/tournaments/CompetitionTabNav";

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  const params = await searchParams;
  const currentTab = params?.tab === "desafios" ? "desafios" : "torneos";

  // 1. Torneos: Inscriptos, Disponibles, Finalizados
  const tournamentRegistrations = await db.tournamentRegistration.findMany({
    where: { playerId: session.user.id },
    include: { tournament: true },
    orderBy: {
      tournament: {
        date: "desc",
      },
    },
  });

  const registeredTournamentIds = tournamentRegistrations.map((r) => r.tournamentId);

  const availableTournaments = await db.tournament.findMany({
    where: {
      status: { in: ["INSCRIPCION", "EN_JUEGO"] },
      active: true,
      id: { notIn: registeredTournamentIds },
    },
    orderBy: { date: "asc" },
  });

  const finishedTournaments = await db.tournament.findMany({
    where: {
      status: "FINALIZADO",
      active: true,
    },
    orderBy: { date: "desc" },
    take: 6,
  });

  // 2. Desafíos: Inscriptos, Disponibles, Finalizados
  const challengeRegistrations = await db.challengeRegistration.findMany({
    where: { playerId: session.user.id },
    include: { challenge: true },
    orderBy: {
      challenge: {
        date: "desc",
      },
    },
  });

  const registeredChallengeIds = challengeRegistrations.map((r) => r.challengeId);

  const availableChallenges = await db.challenge.findMany({
    where: {
      status: { in: ["INSCRIPCION", "EN_JUEGO"] },
      active: true,
      id: { notIn: registeredChallengeIds },
    },
    orderBy: { date: "asc" },
  });

  const finishedChallenges = await db.challenge.findMany({
    where: {
      status: "FINALIZADO",
      active: true,
    },
    orderBy: { date: "desc" },
    take: 6,
  });

  return (
    <div className="relative min-h-[calc(100vh-80px)] pt-8 pb-12 px-4 md:px-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/torneos-hero.png"
          alt="Torneos Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
            Torneos <span className="text-gray-400 font-light">&</span>{" "}
            <span className="text-primary">Desafíos</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg drop-shadow-md">
            Gestiona tus competencias, súmate a nuevos torneos o participa en desafíos continuos con rotación de turnos.
          </p>
        </div>

        {/* Tab Selector */}
        <CompetitionTabNav
          currentTab={currentTab}
          tournamentsCount={availableTournaments.length + tournamentRegistrations.length}
          challengesCount={availableChallenges.length + challengeRegistrations.length}
          baseHref="/player/dashboard/tournaments"
        />

        {/* ================= TAB TORNEOS ================= */}
        {currentTab === "torneos" && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Disponibles */}
            <section>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8">
                Torneos Disponibles
              </h2>
              {availableTournaments.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
                  <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-gray-400">No hay nuevos torneos abiertos para inscripción.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              )}
            </section>

            {/* Inscriptos */}
            <section>
              <div className="relative pt-8 pb-4 mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">
                    Mis Torneos Inscriptos
                  </span>
                </div>
              </div>

              {tournamentRegistrations.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
                  <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-gray-400">No estás inscripto en ningún torneo actualmente.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tournamentRegistrations.map((reg) => (
                    <TournamentCard
                      key={reg.id}
                      tournament={reg.tournament}
                      registrationStatus={reg.status}
                      score={(reg as any).score}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Finalizados */}
            {finishedTournaments.length > 0 && (
              <section>
                <div className="relative pt-8 pb-4 mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">
                      Historial de Campeones
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
                  {finishedTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} isFinished={true} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ================= TAB DESAFÍOS ================= */}
        {currentTab === "desafios" && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Disponibles */}
            <section>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8">
                Desafíos Disponibles
              </h2>
              {availableChallenges.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
                  <Swords className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-gray-400">No hay nuevos desafíos abiertos para inscripción.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              )}
            </section>

            {/* Inscriptos */}
            <section>
              <div className="relative pt-8 pb-4 mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">
                    Mis Desafíos Inscriptos
                  </span>
                </div>
              </div>

              {challengeRegistrations.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
                  <Swords className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-gray-400">No estás inscripto en ningún desafío actualmente.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {challengeRegistrations.map((reg) => (
                    <ChallengeCard
                      key={reg.id}
                      challenge={reg.challenge}
                      registrationStatus={reg.status}
                      score={reg.score}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Finalizados */}
            {finishedChallenges.length > 0 && (
              <section>
                <div className="relative pt-8 pb-4 mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">
                      Historial de Desafíos Finalizados
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
                  {finishedChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} isFinished={true} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
