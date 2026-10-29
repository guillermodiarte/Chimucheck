import Link from "next/link";
import { Swords, Calendar, Users, Gamepad2, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentImageCarousel from "@/components/tournaments/TournamentImageCarousel";

export type ChallengeGameItem = {
  name: string;
  image: string;
  format: string;
};

export function getChallengeGames(challenge: any): ChallengeGameItem[] {
  if (challenge.games) {
    try {
      const parsed = typeof challenge.games === "string" ? JSON.parse(challenge.games) : challenge.games;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: any) => ({
          name: g.name || "",
          image: g.image || "",
          format: g.format || "",
        }));
      }
    } catch {}
  }
  return [];
}

interface ChallengeCardProps {
  challenge: any;
  isFinished?: boolean;
  registrationStatus?: string | null;
  score?: number | null;
}

export default function ChallengeCard({
  challenge,
  isFinished = false,
  registrationStatus = null,
  score = null,
}: ChallengeCardProps) {
  const games = getChallengeGames(challenge);

  let btnText = "Ver Desafío";
  let btnClass =
    "w-full h-12 bg-white text-black border-2 border-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg group-hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]";

  if (isFinished) {
    btnText = "Ver Resultados";
    btnClass =
      "w-full h-12 bg-white/10 text-white border-2 border-white/10 hover:bg-white/20 transition-all duration-300 font-black tracking-wider text-sm uppercase";
  } else if (challenge.status === "EN_JUEGO") {
    btnText = "Ver en Vivo / Turnos";
    btnClass =
      "w-full h-12 bg-green-600/20 text-green-400 border-2 border-green-500/30 hover:bg-green-600/40 transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg";
  } else if (!registrationStatus && challenge.status === "INSCRIPCION") {
    btnText = "Inscribirme al Desafío";
  }

  // Parse prize text
  let prizeText = "Por anunciar";
  if (challenge.prizePool) {
    try {
      const p = JSON.parse(challenge.prizePool);
      prizeText = p.first || "Por anunciar";
    } catch {
      prizeText = challenge.prizePool;
    }
  }

  return (
    <div
      className={`group relative bg-gray-900/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 hover:-translate-y-2 transition-all duration-300 ${
        isFinished
          ? "grayscale hover:grayscale-0 opacity-80 hover:opacity-100"
          : "hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)]"
      }`}
    >
      {/* Image Carousel */}
      <div className="relative aspect-video overflow-hidden">
        <TournamentImageCarousel
          images={games}
          alt={challenge.name}
          autoPlayMs={isFinished ? 0 : 4000}
        />
        {isFinished && (
          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors z-10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none z-10" />

        {/* Badge: Desafío Mode */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-primary/90 text-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg font-black text-xs uppercase tracking-wider">
            <Swords className="w-3.5 h-3.5" />
            <span>Desafío</span>
          </div>
        </div>

        {/* Game Badges */}
        <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 justify-end max-w-[70%] z-20 pointer-events-none">
          {challenge.isRestricted && (
            <div className="bg-yellow-600/80 backdrop-blur-md px-3 py-1 rounded-full border border-yellow-400/30 flex items-center gap-1.5 shadow-lg">
              <Lock className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Aprobación
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
                {game.name}
                {game.format ? ` · ${game.format}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors duration-300">
            {challenge.name}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2 mt-1">
            {challenge.description || "Compite por puntos acumulados y sube en la tabla de clasificación."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/5">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">
              {new Date(challenge.date).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm justify-end">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span>
              {challenge.registrations?.length || 0} / {challenge.maxPlayers}
            </span>
          </div>
        </div>

        {/* Prize */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 font-medium flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Premio:
          </span>
          <span className="text-white font-bold truncate max-w-[180px]">{prizeText}</span>
        </div>

        {/* User status tag if registered */}
        {registrationStatus && (
          <div className="py-1 px-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold text-center">
            {registrationStatus === "APPROVED" ? "Estás Inscripto" : "Inscripción Pendiente"}
            {score !== null && score !== undefined && ` · ${score} pts`}
          </div>
        )}

        <Link href={`/desafios/${challenge.id}`} className="block pt-2">
          <Button className={btnClass}>{btnText}</Button>
        </Link>
      </div>
    </div>
  );
}

