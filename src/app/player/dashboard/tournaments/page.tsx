import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Trophy, Users, ArrowRight, Gamepad2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TournamentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  // 1. Inscriptos
  const registrations = await db.tournamentRegistration.findMany({
    where: { playerId: session.user.id },
    include: { tournament: true },
    orderBy: {
      tournament: {
        date: 'desc'
      }
    }
  });

  const registeredIds = registrations.map((r) => r.tournamentId);

  // 2. Disponibles
  const available = await db.tournament.findMany({
    where: {
      status: "INSCRIPCION",
      id: { notIn: registeredIds }
    },
    orderBy: { date: "asc" },
  });

  // 3. Finalizados (últimos 6)
  const finished = await db.tournament.findMany({
    where: {
      status: "FINALIZADO"
    },
    orderBy: { date: "desc" },
    take: 6,
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* ===== MIS TORNEOS ===== */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
            Mis Torneos
          </h1>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-12 text-center">
            <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No estás inscripto en ningún torneo</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Explora los torneos disponibles y únete a la competencia para ganar grandes premios.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={reg.tournament.image || "/images/tournament-placeholder.jpg"}
                    alt={reg.tournament.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Finished Label inside My Tournaments */}
                  {(reg.tournament.status === "FINALIZADO" || new Date(reg.tournament.date) < new Date()) && (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-hidden">
                      <div className="absolute top-0 left-0 w-[150px] h-[150px]">
                        <div className="absolute top-[30px] left-[-40px] w-[180px] bg-red-600/90 text-white font-bold text-xs uppercase tracking-widest text-center py-2 -rotate-45 shadow-lg border-y border-white/20 backdrop-blur-sm">
                          FINALIZADO
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase mb-2 inline-block ${reg.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                      reg.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                        reg.status === 'ELIMINATED' ? 'bg-red-500/20 text-red-400' :
                          'bg-zinc-800 text-gray-400'
                      }`}>
                      {reg.status === 'PENDING' ? 'Pendiente' :
                        reg.status === 'CONFIRMED' ? 'Confirmado' :
                          reg.status === 'ELIMINATED' ? 'Eliminado' :
                            reg.status}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {reg.tournament.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span>{formatDate(reg.tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      <span>{reg.tournament.currentPlayers}/{reg.tournament.maxPlayers}</span>
                    </div>
                  </div>

                  {/* Score if tournament has started */}
                  {(reg.tournament.status === "EN_JUEGO" || reg.tournament.status === "FINALIZADO") && (
                    <div className="text-sm font-bold text-primary text-center">
                      Puntaje: {(reg as any).score ?? 0} pts
                    </div>
                  )}

                  <Link
                    href={`/player/dashboard/tournaments/${reg.tournament.id}`}
                    className="block w-full text-center py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== DIVISOR ===== */}
      <div className="relative pt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
      </div>

      {/* ===== TORNEOS DISPONIBLES ===== */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
            Torneos Disponibles
          </h2>
        </div>

        {available.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
            <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400">No hay nuevos torneos abiertos para inscripción.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {available.map((tournament) => (
              <div
                key={tournament.id}
                className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={tournament.image || "/images/tournament-placeholder.jpg"}
                    alt={tournament.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-2 py-1 rounded-md bg-primary text-black text-xs font-bold uppercase mb-2 inline-block">
                      {tournament.status === "INSCRIPCION" ? "Inscripción Abierta" : "Abierto"}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {tournament.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {tournament.description || "Sin descripción disponible."}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span>{formatDate(tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      <span>{tournament.currentPlayers}/{tournament.maxPlayers}</span>
                    </div>
                  </div>

                  <Link
                    href={`/player/dashboard/tournaments/${tournament.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 transition-all group-hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                  >
                    Inscribirse <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== DIVISOR ===== */}
      <div className="relative pt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
      </div>

      {/* ===== TORNEOS FINALIZADOS ===== */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-500 uppercase tracking-wider">
            Torneos Finalizados
          </h2>
        </div>

        {finished.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400">Aún no hay torneos finalizados en el registro.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
            {finished.map((tournament) => (
              <div
                key={tournament.id}
                className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-300"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={tournament.image || "/images/tournament-placeholder.jpg"}
                    alt={tournament.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-hidden">
                    <div className="absolute top-0 left-0 w-[150px] h-[150px]">
                      <div className="absolute top-[30px] left-[-40px] w-[180px] bg-red-600/90 text-white font-bold text-xs uppercase tracking-widest text-center py-2 -rotate-45 shadow-lg border-y border-white/20 backdrop-blur-sm">
                        FINALIZADO
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white">
                      {tournament.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span>{formatDate(tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-gray-500" />
                      <span>Completado</span>
                    </div>
                  </div>

                  <Link
                    href={`/torneos/${tournament.id}`}
                    className="block w-full text-center py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    Ver Resultados
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
