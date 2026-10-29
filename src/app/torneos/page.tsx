import { getTournaments } from "@/app/actions/tournaments";
import { getChallenges } from "@/app/actions/challenges";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Swords } from "lucide-react";
import TournamentCard from "@/components/tournaments/TournamentCard";
import ChallengeCard from "@/components/challenges/ChallengeCard";
import { CompetitionTabNav } from "@/components/tournaments/CompetitionTabNav";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TorneosPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const currentTab = params?.tab === "desafios" ? "desafios" : "torneos";

  if (session?.user) {
    redirect(`/player/dashboard/tournaments?tab=${currentTab}`);
  }

  const [allTournaments, allChallenges] = await Promise.all([
    getTournaments(true),
    getChallenges(true),
  ]);

  // Tournament lists
  const availableTournaments = allTournaments.filter(
    (t) => t.status === "INSCRIPCION" || t.status === "EN_JUEGO"
  );
  const finishedTournaments = allTournaments
    .filter((t) => t.status === "FINALIZADO")
    .slice(0, 6);

  // Challenge lists
  const availableChallenges = allChallenges.filter(
    (c) => c.status === "INSCRIPCION" || c.status === "EN_JUEGO"
  );
  const finishedChallenges = allChallenges
    .filter((c) => c.status === "FINALIZADO")
    .slice(0, 6);

  return (
    <div className="relative min-h-screen pt-28 md:pt-40 lg:pt-48 pb-12 px-4 md:px-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/torneos-hero.png"
          alt="Torneos y Desafíos Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
            Torneos <span className="text-gray-400 font-light">&</span>{" "}
            <span className="text-primary">Desafíos</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg drop-shadow-md">
            Compite por premios increíbles, demuestra tu nivel en torneos por llaves o sumate a los desafíos continuos con rotación de turnos.
          </p>
        </div>

        {/* Tab Selector: Torneos vs Desafíos */}
        <CompetitionTabNav
          currentTab={currentTab}
          tournamentsCount={availableTournaments.length}
          challengesCount={availableChallenges.length}
          baseHref="/torneos"
        />

        {/* ================= TAB TORNEOS ================= */}
        {currentTab === "torneos" && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Disponibles */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8">
                Torneos Disponibles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableTournaments.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl">
                    <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-white mb-2">No hay torneos activos</h3>
                    <p className="text-gray-400 text-lg">
                      Pronto anunciaremos nuevas competencias. ¡Mantente atento!
                    </p>
                  </div>
                ) : (
                  availableTournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)
                )}
              </div>
            </div>

            {/* Finalizados */}
            {finishedTournaments.length > 0 && (
              <>
                <div className="relative pt-8 pb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">
                      Historial de Campeones
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gray-500 uppercase tracking-wider mb-8">
                    Torneos Finalizados
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {finishedTournaments.map((t) => (
                      <TournamentCard key={t.id} tournament={t} isFinished={true} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB DESAFÍOS ================= */}
        {currentTab === "desafios" && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Disponibles */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8">
                Desafíos Disponibles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableChallenges.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl">
                    <Swords className="w-20 h-20 text-gray-600 mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-white mb-2">No hay desafíos activos</h3>
                    <p className="text-gray-400 text-lg">
                      Pronto comenzarán nuevos desafíos arcade y multijuego. ¡Prepárate!
                    </p>
                  </div>
                ) : (
                  availableChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
                )}
              </div>
            </div>

            {/* Finalizados */}
            {finishedChallenges.length > 0 && (
              <>
                <div className="relative pt-8 pb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">
                      Podios de Desafíos
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gray-500 uppercase tracking-wider mb-8">
                    Desafíos Finalizados
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {finishedChallenges.map((c) => (
                      <ChallengeCard key={c.id} challenge={c} isFinished={true} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
