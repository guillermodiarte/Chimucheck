
import { getTournaments } from "@/app/actions/tournaments";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Calendar, Users, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameEntry } from "@/app/actions/tournaments";
import TournamentImageCarousel from "@/components/tournaments/TournamentImageCarousel";

function getGames(tournament: any): GameEntry[] {
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

export default async function TorneosPage() {
  const tournaments = await getTournaments(true);

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

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
            Torneos <span className="text-primary">Oficiales</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg drop-shadow-md">
            Compite por premios increíbles, demuestra tu nivel y conviértete en una leyenda de la comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl">
              <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-bold text-white mb-2">No hay torneos activos</h3>
              <p className="text-gray-400 text-lg">Pronto anunciaremos nuevas competencias. ¡Mantente atento!</p>
            </div>
          ) : (
            // @ts-ignore
            tournaments.map((tournament) => {
              const games = getGames(tournament);

              return (
                <div
                  key={tournament.id}
                  className="group relative bg-gray-900/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] hover:-translate-y-2"
                >
                  {/* Image Carousel */}
                  <div className="relative aspect-video overflow-hidden">
                    <TournamentImageCarousel
                      images={games}
                      fallbackImage={tournament.image}
                      alt={tournament.name}
                      autoPlayMs={4000}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none" />

                    {/* Game Badges */}
                    {games.length > 0 && (
                      <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 justify-end max-w-[70%] z-10 pointer-events-none">
                        {games.map((game, i) => (
                          <div
                            key={i}
                            className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-lg"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {game.name}{game.format ? ` · ${game.format}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(tournament.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </div>
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
                      <div className="flex items-center gap-3 text-sm text-gray-400 px-2">
                        <Users className="w-4 h-4 shrink-0" />
                        {/* @ts-ignore */}
                        <span className="font-medium">{tournament.registrations.length} / {tournament.maxPlayers} Jugadores</span>
                      </div>
                    </div>

                    <Link href={`/torneos/${tournament.id}`} className="block pt-2">
                      <Button className="w-full h-12 bg-white text-black border-2 border-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg group-hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
