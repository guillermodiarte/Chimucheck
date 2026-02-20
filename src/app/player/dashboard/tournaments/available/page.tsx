import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Trophy, Users, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AvailableTournamentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  // Get IDs of tournaments the player is already registered in
  const myRegistrations = await db.tournamentRegistration.findMany({
    where: { playerId: session.user.id },
    select: { tournamentId: true }
  });

  const registeredIds = myRegistrations.map(r => r.tournamentId);

  // Fetch available OPEN tournaments excluding those already registered
  const tournaments = await db.tournament.findMany({
    where: {
      status: "OPEN",
      id: { notIn: registeredIds }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
          Torneos Disponibles
        </h1>
      </div>

      {tournaments.length === 0 ? (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-12 text-center">
          <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No hay torneos disponibles</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Actualmente no hay torneos abiertos para inscripción o ya estás inscripto en todos.
            ¡Vuelve pronto para nuevas competencias!
          </p>
          <Link
            href="/player/dashboard/tournaments/my-tournaments"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Ver Mis Torneos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
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
                    Inscripción Abierta
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
    </div>
  );
}
