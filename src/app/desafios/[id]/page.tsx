import { getChallengeById } from "@/app/actions/challenges";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Users, Trophy, Gamepad2, Swords, Lock, ShieldCheck, Flame } from "lucide-react";
import TournamentImageCarousel from "@/components/tournaments/TournamentImageCarousel";
import ChallengeRegistrationButton from "@/components/challenges/ChallengeRegistrationButton";
import { ChallengeLiveScoreTable } from "@/components/admin/ChallengeLiveScoreTable";
import type { ChallengeLivePlayer } from "@/components/admin/ChallengeLiveScoreTable";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = await getChallengeById(id);
  const session = await auth();

  if (!challenge || !challenge.active) {
    notFound();
  }

  // Parse games
  let games: any[] = [];
  try {
    games = typeof challenge.games === "string" ? JSON.parse(challenge.games) : challenge.games || [];
  } catch {
    games = [];
  }

  // User registration check
  const userRegistration = session?.user?.id
    ? challenge.registrations.find((r: any) => r.playerId === session.user.id)
    : null;

  const isFull = challenge.registrations.length >= challenge.maxPlayers;

  // Map players for the live scoreboard
  const livePlayers: ChallengeLivePlayer[] = challenge.registrations.map((r: any) => ({
    id: r.playerId,
    name: r.player?.name || "",
    alias: r.player?.alias || r.player?.name || "Sin Nombre",
    image: r.player?.image || "",
    score: Number(r.score) || 0,
    timesPlayed: Number(r.timesPlayed) || 0,
    lastPlayedAt: r.lastPlayedAt ? new Date(r.lastPlayedAt).toISOString() : null,
    registeredAt: r.registeredAt ? new Date(r.registeredAt).toISOString() : new Date().toISOString(),
    isAbsent: Boolean(r.isAbsent),
  }));

  // Parse prizes
  let prizes = {
    first: "",
    second: "",
    third: "",
    imageFirst: "",
    imageSecond: "",
    imageThird: "",
  };
  if (challenge.prizePool) {
    try {
      const parsed = JSON.parse(challenge.prizePool);
      if (typeof parsed === "object" && parsed !== null) {
        const imgs = Array.isArray(parsed.images) ? parsed.images : [];
        prizes = {
          first: parsed.first || "",
          second: parsed.second || "",
          third: parsed.third || "",
          imageFirst: parsed.imageFirst || imgs[0] || "",
          imageSecond: parsed.imageSecond || imgs[1] || "",
          imageThird: parsed.imageThird || imgs[2] || "",
        };
      } else {
        prizes.first = challenge.prizePool;
      }
    } catch {
      prizes.first = challenge.prizePool;
    }
  }

  return (
    <div className="relative min-h-screen pt-28 md:pt-40 lg:pt-48 pb-12 px-4 md:px-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/torneos-hero.png"
          alt="Desafíos Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto space-y-8">
        {/* Main Card */}
        <div className="bg-gray-900/60 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Header Image Carousel */}
          <div className="group relative w-full h-[360px] md:h-[500px]">
            <TournamentImageCarousel images={games} alt={challenge.name} autoPlayMs={5000} />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none" />

            {/* Floating tag */}
            <div className="absolute top-6 left-6 z-20">
              <span className="bg-primary text-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Swords className="w-4 h-4" />
                Desafío Oficial
              </span>
            </div>

            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="flex flex-wrap gap-2 mb-3">
                {games.map((game, i) => (
                  <span
                    key={i}
                    className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-xs font-bold text-primary uppercase shadow-lg"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    {game.name}
                    {game.format ? ` · ${game.format}` : ""}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight">
                {challenge.name}
              </h1>
            </div>
          </div>

          {/* Details & Registration Grid */}
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Details & Prizes */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-white mb-3">Acerca de este Desafío</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-base">
                  {challenge.description ||
                    "¡Participa en este desafío! Rota por turnos, juega partidas en los juegos seleccionados y acumula puntos para escalar en la tabla de posiciones."}
                </p>
              </div>

              {/* Games with Format */}
              {games.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    Juegos Incluidos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {games.map((game: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 relative">
                          {game.image ? (
                            <img
                              src={game.image}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gamepad2 className="w-6 h-6 text-gray-600 m-auto" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{game.name}</p>
                          <p className="text-xs text-primary font-medium">
                            Formato: {game.format || "1vs1"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prizes Section with Inline Photos */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Premios del Desafío
                </h3>

                {prizes.first ? (
                  <div className="space-y-3">
                    {/* 1st */}
                    <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 border border-yellow-500/30 text-2xl">
                          🥇
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-0.5">
                            Primer Puesto
                          </p>
                          <p className="text-xl text-white font-black">{prizes.first}</p>
                        </div>
                      </div>
                      {prizes.imageFirst && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-yellow-500/30 bg-black shrink-0 shadow-md">
                          <img
                            src={prizes.imageFirst}
                            alt="Premio 1"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* 2nd */}
                    {prizes.second && (
                      <div className="p-4 bg-gray-400/5 border border-gray-500/20 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-gray-400/10 flex items-center justify-center shrink-0 border border-gray-500/20 text-xl">
                            🥈
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                              Segundo Puesto
                            </p>
                            <p className="text-lg text-white font-bold">{prizes.second}</p>
                          </div>
                        </div>
                        {prizes.imageSecond && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-500/30 bg-black shrink-0 shadow-md">
                            <img
                              src={prizes.imageSecond}
                              alt="Premio 2"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3rd */}
                    {prizes.third && (
                      <div className="p-4 bg-orange-900/5 border border-orange-500/10 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/15 text-xl">
                            🥉
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-0.5">
                              Tercer Puesto
                            </p>
                            <p className="text-lg text-white font-bold">{prizes.third}</p>
                          </div>
                        </div>
                        {prizes.imageThird && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-orange-500/30 bg-black shrink-0 shadow-md">
                            <img
                              src={prizes.imageThird}
                              alt="Premio 3"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Premios a confirmar.</p>
                )}
              </div>
            </div>

            {/* Right Column: Registration Card */}
            <div className="space-y-6">
              <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-6 backdrop-blur-sm shadow-xl">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Estado del Desafío
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        challenge.status === "EN_JUEGO"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                          : challenge.status === "FINALIZADO"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-green-500/20 text-green-400 border border-green-500/40"
                      }`}
                    >
                      {challenge.status === "EN_JUEGO"
                        ? "En Juego (En Vivo)"
                        : challenge.status === "FINALIZADO"
                        ? "Finalizado"
                        : "Inscripciones Abiertas"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Fecha y Hora
                  </p>
                  <div className="flex items-center gap-3 text-white font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      {new Date(challenge.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      <span className="block text-xs font-normal text-gray-400">
                        {new Date(challenge.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        hs
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Cupo de Participantes
                  </p>
                  <div className="flex items-center justify-between text-white bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 font-bold">
                      <Users className="w-5 h-5 text-primary" />
                      <span>Inscriptos</span>
                    </div>
                    <span className="font-mono text-lg font-bold">
                      {challenge.registrations.length} / {challenge.maxPlayers}
                    </span>
                  </div>
                </div>

                {/* Registration Action */}
                <div className="pt-2">
                  {challenge.status === "FINALIZADO" ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 font-bold text-sm">
                      Este desafío ha finalizado
                    </div>
                  ) : session?.user ? (
                    <ChallengeRegistrationButton
                      challengeId={challenge.id}
                      userId={session.user.id}
                      registrationStatus={userRegistration?.status || null}
                      isRestricted={challenge.isRestricted}
                      isFull={isFull}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Link href={`/player/login?callbackUrl=/desafios/${challenge.id}`}>
                        <button className="w-full h-12 bg-primary text-black hover:bg-yellow-400 font-black tracking-wider uppercase text-base rounded-md transition-all shadow-lg">
                          Iniciar Sesión para Participar
                        </button>
                      </Link>
                      <p className="text-xs text-center text-gray-400">
                        Podes sumarte al desafío incluso mientras está en juego.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Score & Turn Queue Viewer for Spectators and Players */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Swords className="w-6 h-6 text-primary" />
              Turnos y Puntajes en Tiempo Real
            </h2>
            <span className="text-xs text-green-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Actualización en vivo
            </span>
          </div>

          <ChallengeLiveScoreTable
            challengeId={challenge.id}
            challengeName={challenge.name}
            initialStatus={challenge.status}
            initialPlayers={livePlayers}
            prizePool={challenge.prizePool || undefined}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}

