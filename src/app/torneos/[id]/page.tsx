
import { getTournamentById } from "@/app/actions/tournaments";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Trophy, Gamepad2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import RegistrationButton from "@/components/tournaments/RegistrationButton";
import UnregisterButton from "@/components/tournaments/UnregisterButton";
import TournamentImageCarousel from "@/components/tournaments/TournamentImageCarousel";
import type { GameEntry } from "@/app/actions/tournaments";

function getGames(tournament: any): GameEntry[] {
  if (tournament.games) {
    const parsed = typeof tournament.games === "string"
      ? JSON.parse(tournament.games)
      : tournament.games;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((g: any) => ({ name: g.name || "", image: g.image || "", format: g.format || "" }));
    }
  }
  if (tournament.game) {
    return [{ name: tournament.game, image: tournament.image || "", format: tournament.format || "" }];
  }
  return [];
}



export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  const session = await auth();

  if (!tournament || !tournament.active) {
    notFound();
  }

  const games = getGames(tournament);

  const isRegistered = session?.user?.id
    // @ts-ignore
    ? tournament.registrations.some((r) => r.playerId === session.user.id)
    : false;

  const isFull = tournament.registrations.length >= tournament.maxPlayers;

  return (
    <div className="relative min-h-screen pt-48 pb-12 px-4 md:px-8">

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

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="bg-gray-900/60 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl">

          {/* Header Image Carousel */}
          <div className="group relative aspect-video w-full max-h-[500px]">
            <TournamentImageCarousel
              images={games}
              fallbackImage={tournament.image}
              alt={tournament.name}
              autoPlayMs={5000}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Game badges */}
                {games.map((game, i) => (
                  <span
                    key={i}
                    className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-sm font-bold text-primary uppercase shadow-lg"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    {game.name}{game.format ? ` · ${game.format}` : ""}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-2 leading-tight">
                {tournament.name}
              </h1>
            </div>
          </div>

          <div className="p-8 grid gap-8 md:grid-cols-3">
            {/* Left Column: Info */}
            <div className="md:col-span-2 space-y-8">
              {/* Games list (names only, no images — those are in the carousel) */}
              {games.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Juegos</h2>
                  <div className="flex flex-wrap gap-2">
                    {games.map((game, i) => (
                      <span
                        key={i}
                        className="bg-gray-800/80 border border-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide"
                      >
                        <Gamepad2 className="w-4 h-4 text-primary" />
                        {game.name}{game.format ? ` · ${game.format}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Sobre el Torneo</h2>
                <p className="text-gray-300 whitespace-pre-line leading-relaxed text-lg">
                  {tournament.description || "No hay descripción disponible."}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Premios</h2>
                {(() => {
                  let prizes = { first: "", second: "", third: "" };
                  if (tournament.prizePool) {
                    try {
                      const parsed = JSON.parse(tournament.prizePool);
                      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                        prizes = { first: parsed.first || "", second: parsed.second || "", third: parsed.third || "" };
                      } else {
                        prizes.first = tournament.prizePool;
                      }
                    } catch {
                      prizes.first = tournament.prizePool;
                    }
                  }
                  const hasMultiple = !!prizes.second;
                  if (!prizes.first) {
                    return <p className="text-gray-400 italic">Por anunciar.</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {/* First place */}
                      <div className="p-5 bg-yellow-900/10 border border-yellow-500/20 rounded-2xl flex items-center gap-5 shadow-lg">
                        <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 border border-yellow-500/30">
                          <Trophy className="w-7 h-7 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-1">
                            {hasMultiple ? "🥇 Primer Puesto" : "🏆 Premio del Evento"}
                          </p>
                          <p className="text-2xl text-white font-black">{prizes.first}</p>
                        </div>
                      </div>
                      {/* Second place */}
                      {prizes.second && (
                        <div className="p-4 bg-gray-400/5 border border-gray-500/20 rounded-xl flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-gray-400/10 flex items-center justify-center shrink-0 border border-gray-500/20">
                            <span className="text-xl">🥈</span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Segundo Puesto</p>
                            <p className="text-lg text-white font-bold">{prizes.second}</p>
                          </div>
                        </div>
                      )}
                      {/* Third place */}
                      {prizes.third && (
                        <div className="p-4 bg-orange-900/5 border border-orange-500/10 rounded-xl flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/15">
                            <span className="text-xl">🥉</span>
                          </div>
                          <div>
                            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-0.5">Tercer Puesto</p>
                            <p className="text-lg text-white font-bold">{prizes.third}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: Status & Action */}
            <div className="space-y-6">
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-6 backdrop-blur-sm shadow-xl">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fecha de Inicio</p>
                  <div className="flex items-center gap-3 text-white font-bold text-lg bg-white/5 p-3 rounded-xl border border-white/5">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      {new Date(tournament.date).toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      <span className="block text-xs font-normal text-gray-400">
                        {new Date(tournament.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Jugadores</p>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Users className="w-5 h-5 text-primary" />
                        {tournament.registrations.length} <span className="text-gray-500 text-sm font-normal">/ {tournament.maxPlayers}</span>
                      </div>
                      <span className="text-xs text-primary font-bold">
                        {Math.round((tournament.registrations.length / tournament.maxPlayers) * 100)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((tournament.registrations.length / tournament.maxPlayers) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  {!session ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-gray-400">
                        Debes iniciar sesión para inscribirte.
                      </p>
                      <Link href={`/player/login?callbackUrl=${encodeURIComponent(`/torneos/${tournament.id}`)}`} className="block">
                        <Button className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold">
                          Iniciar Sesión
                        </Button>
                      </Link>
                    </div>
                  ) : isRegistered ? (
                    // @ts-ignore
                    <UnregisterButton tournamentId={tournament.id} userId={session.user.id} />
                  ) : isFull ? (
                    <div className="w-full py-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400 font-bold flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      CUPO COMPLETO
                    </div>
                  ) : (
                    // @ts-ignore
                    <RegistrationButton tournamentId={tournament.id} userId={session.user.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
