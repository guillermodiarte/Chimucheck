import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Trophy, Users } from "lucide-react";

export default async function MyTournamentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  const registrations = await db.tournamentRegistration.findMany({
    where: { playerId: session.user.id },
    include: {
      tournament: true
    },
    orderBy: {
      tournament: {
        date: 'desc'
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
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
          <Link
            href="/player/dashboard/tournaments/available"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 transition-colors"
          >
            Ver Torneos Disponibles
          </Link>
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
                    <span>{new Date(reg.tournament.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    <span>{reg.tournament.currentPlayers}/{reg.tournament.maxPlayers}</span>
                  </div>
                </div>

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
    </div>
  );
}
