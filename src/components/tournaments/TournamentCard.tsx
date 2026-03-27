import Link from "next/link";
import { Trophy, Calendar, Users, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentImageCarousel from "@/components/tournaments/TournamentImageCarousel";

export type GameEntry = {
  name: string;
  image: string;
  format: string;
};

export function getGames(tournament: any): GameEntry[] {
  if (tournament.games) {
    const parsed = typeof tournament.games === "string"
      ? JSON.parse(tournament.games)
      : tournament.games;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((g: any) => ({ name: g.name || "", image: g.image || "", format: g.format || "" }));
    }
  }
  // Fallback to legacy single game
  if (tournament.game) {
    return [{ name: tournament.game, image: tournament.image || "", format: tournament.format || "" }];
  }
  return [];
}

interface TournamentCardProps {
  tournament: any;
  isFinished?: boolean;
  registrationStatus?: string | null;
  score?: number | null;
}

export default function TournamentCard({
  tournament,
  isFinished = false,
  registrationStatus = null,
  score = null
}: TournamentCardProps) {
  const games = getGames(tournament);

  // Decide button text based on status and if user is registered
  let btnText = "Ver Detalles";
  let btnClass = "w-full h-12 bg-white text-black border-2 border-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg group-hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]";

  if (isFinished) {
    btnText = "Ver Resultados";
    btnClass = "w-full h-12 bg-white/10 text-white border-2 border-white/10 hover:bg-white/20 transition-all duration-300 font-black tracking-wider text-sm uppercase";
  } else if (tournament.status === "EN_JUEGO") {
    btnText = "Ver en Vivo";
    btnClass = "w-full h-12 bg-green-600/20 text-green-400 border-2 border-green-500/30 hover:bg-green-600/40 transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg";
  } else if (!registrationStatus && tournament.status === "INSCRIPCION") {
    btnText = "Inscribirse";
  }

  return (
    <div
      className={`group relative bg-gray-900/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 hover:-translate-y-2 transition-all duration-300 ${isFinished ? 'grayscale hover:grayscale-0 opacity-80 hover:opacity-100' : 'hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)]'
        }`}
    >
      {/* Image Carousel */}
      <div className="relative aspect-video overflow-hidden">
        <TournamentImageCarousel
          images={games}
          fallbackImage={tournament.image}
          alt={tournament.name}
          autoPlayMs={isFinished ? 0 : 4000}
        />
        {isFinished && <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors z-10" />}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none z-10" />

        {/* Game & Team Badges */}
        <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 justify-end max-w-[70%] z-20 pointer-events-none">
          {tournament.isTeamBased && (
            <div className="bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5 shadow-lg">
              <Users className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
                En Equipos
              </span>
            </div>
          )}
          {games.map((game, i) => (
            <div
              key={i}
              className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
                {game.name}{game.format ? ` · ${game.format}` : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Finished Label */}
        {((tournament.status === "FINALIZADO" || new Date(tournament.date) < new Date()) && tournament.status !== "EN_JUEGO") && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 overflow-hidden">
            <div className="absolute top-0 left-0 w-[150px] h-[150px]">
              <div className="absolute top-[30px] left-[-40px] w-[180px] bg-red-600/90 text-white font-bold text-xs uppercase tracking-widest text-center py-2 -rotate-45 shadow-lg border-y border-white/20 backdrop-blur-sm">
                FINALIZADO
              </div>
            </div>
          </div>
        )}

        {/* En Juego Label */}
        {tournament.status === "EN_JUEGO" && (
          <div className="absolute top-4 left-4 z-30">
            <span className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-400 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              EN JUEGO
            </span>
          </div>
        )}

        {/* Registration Status Badge (For Player Dashboard) */}
        {registrationStatus && tournament.status !== "FINALIZADO" && tournament.status !== "EN_JUEGO" && (
          <div className="absolute top-4 left-4 z-30">
            <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-widest shadow-lg backdrop-blur-md ${registrationStatus === 'PENDING' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400' :
                registrationStatus === 'CONFIRMED' ? 'bg-green-500/20 border border-green-500/50 text-green-400' :
                  registrationStatus === 'ELIMINATED' ? 'bg-red-500/20 border border-red-500/50 text-red-400' :
                    'bg-zinc-800 border border-white/10 text-gray-400'
              }`}>
              {registrationStatus === 'PENDING' ? 'PENDIENTE' :
                registrationStatus === 'CONFIRMED' ? 'CONFIRMADO' :
                  registrationStatus === 'ELIMINATED' ? 'ELIMINADO' :
                    registrationStatus}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-5 relative z-20">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(tournament.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </div>

            {/* Player Score */}
            {score !== null && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Puntaje: {score} pts
              </div>
            )}
          </div>
          <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors line-clamp-1 uppercase tracking-tight">
            {tournament.name}
          </h3>
        </div>

        <div className="space-y-3 pt-2 border-t border-white/5">
          {(() => {
            let firstPrize = "";
            if (tournament.prizePool) {
              try {
                const parsed = JSON.parse(tournament.prizePool as string);
                if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                  firstPrize = parsed.first || "";
                } else {
                  firstPrize = tournament.prizePool as string;
                }
              } catch {
                firstPrize = tournament.prizePool as string;
              }
            }
            return firstPrize ? (
              <div className="flex items-center gap-3 text-sm text-yellow-400 bg-yellow-400/5 p-2 rounded-lg border border-yellow-400/10">
                <Trophy className="w-4 h-4 shrink-0" />
                <span className="font-bold tracking-wide">{firstPrize}</span>
              </div>
            ) : null;
          })()}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Users className="w-4 h-4 shrink-0" />
              {/* @ts-ignore */}
              <span className="font-medium">{tournament.registrations?.length ?? tournament.currentPlayers ?? 0} / {tournament.maxPlayers} Jugadores</span>
            </div>
          </div>
        </div>

        <Link href={`/torneos/${tournament.id}`} className="block pt-2">
          <Button className={btnClass}>
            {btnText}
          </Button>
        </Link>
      </div>
    </div>
  );
}
