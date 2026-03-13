import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Trophy, Users, ArrowRight, Gamepad2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import TournamentCard from "@/components/tournaments/TournamentCard";

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
      status: { in: ["INSCRIPCION", "EN_JUEGO"] },
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

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-16 animate-in fade-in duration-500">
        {/* ===== HEADER GENERAL ===== */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
            Torneos <span className="text-primary">Oficiales</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg drop-shadow-md">
            Compite por premios increíbles, demuestra tu nivel y conviértete en una leyenda de la comunidad.
          </p>
        </div>


        {/* ===== TORNEOS DISPONIBLES ===== */}
        <section>
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8">Disponibles</h2>

          {available.length === 0 ? (
            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
              <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-gray-400">No hay nuevos torneos abiertos para inscripción.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {available.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </section>

        {/* ===== DISPONIBLES ===== */}
        <div className="relative pt-8 pb-4 mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">Torneos Inscriptos</span>
          </div>
        </div>

        {/* ===== DIVIDER DISPONIBLES -> MIS TORNEOS ===== */}
        <section>
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-8">Mis Torneos</h2>

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


        {/* ===== DIVIDER MIS TORNEOS -> FINALIZADOS ===== */}
        <div className="relative pt-8 pb-4 mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-black px-4 text-sm text-gray-500 uppercase tracking-widest font-bold">Historial de Campeones</span>
          </div>
        </div>

        {/* ===== TORNEOS FINALIZADOS ===== */}
        <section>
          <h2 className="text-3xl font-bold text-gray-500 uppercase tracking-wider mb-8">Torneos Finalizados</h2>

          {finished.length === 0 ? (
            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
              <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-gray-400">Aún no hay torneos finalizados en el registro.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
              {finished.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} isFinished={true} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
