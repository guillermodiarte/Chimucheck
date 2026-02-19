import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Trophy, Users, ArrowRight, Gamepad2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Status badge helper
function StatusBadge({ status, tournamentStatus }: { status: string; tournamentStatus: string }) {
  const tournamentStates: Record<string, { label: string; className: string }> = {
    REGISTRATION: { label: "Inscripción", className: "bg-blue-500/20 text-blue-400" },
    IN_PROGRESS: { label: "En Juego", className: "bg-green-500/20 text-green-400" },
    FINISHED: { label: "Finalizado", className: "bg-red-500/20 text-red-400" },
    OPEN: { label: "Activo", className: "bg-primary/20 text-primary" },
  };

  const regStates: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pendiente", className: "bg-yellow-500/20 text-yellow-400" },
    CONFIRMED: { label: "Confirmado", className: "bg-green-500/20 text-green-400" },
    ELIMINATED: { label: "Eliminado", className: "bg-red-500/20 text-red-400" },
  };

  const ts = tournamentStates[tournamentStatus] || { label: tournamentStatus, className: "bg-zinc-800 text-gray-400" };
  const rs = regStates[status] || { label: status, className: "bg-zinc-800 text-gray-400" };

  return (
    <div className="flex gap-2 flex-wrap">
      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase inline-block ${ts.className}`}>
        {ts.label}
      </span>
      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase inline-block ${rs.className}`}>
        {rs.label}
      </span>
    </div>
  );
}

export default async function TournamentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  // Inscriptos
  const registrations = await db.tournamentRegistration.findMany({
    where: { playerId: session.user.id },
    include: { tournament: true },
    orderBy: { registeredAt: "desc" },
  });

  const registeredIds = registrations.map((r) => r.tournamentId);

  // Disponibles (estado REGISTRATION u OPEN, no inscripto aún)
  const available = await db.tournament.findMany({
    where: {
      status: { in: ["OPEN", "REGISTRATION"] },
      id: { notIn: registeredIds },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* ===== MIS TORNEOS ===== */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Mis Torneos</h1>
          <span className="ml-auto text-sm text-gray-500">{registrations.length} torneo{registrations.length !== 1 ? "s" : ""}</span>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
            <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400">Aún no estás inscripto en ningún torneo.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={reg.tournament.image || "/images/tournament-placeholder.jpg"}
                    alt={reg.tournament.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight">
                      {reg.tournament.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <StatusBadge status={reg.status} tournamentStatus={reg.tournament.status} />
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      <span>{formatDate(reg.tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary" />
                      <span>{reg.tournament.currentPlayers}/{reg.tournament.maxPlayers}</span>
                    </div>
                  </div>
                  {/* Score if tournament has started */}
                  {(reg.tournament.status === "IN_PROGRESS" || reg.tournament.status === "FINISHED") && (
                    <div className="text-sm font-bold text-primary">
                      Puntaje: {(reg as any).score ?? 0} pts
                    </div>
                  )}
                  <Link
                    href={`/torneos/${reg.tournament.id}`}
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-black px-4 text-xs text-gray-500 uppercase tracking-widest">Torneos Disponibles</span>
        </div>
      </div>

      {/* ===== TORNEOS DISPONIBLES ===== */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <ArrowRight className="w-7 h-7 text-primary" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Para Inscribirse</h2>
          <span className="ml-auto text-sm text-gray-500">{available.length} disponible{available.length !== 1 ? "s" : ""}</span>
        </div>

        {available.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-10 text-center">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400">No hay torneos con inscripción abierta en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {available.map((tournament) => (
              <div
                key={tournament.id}
                className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={tournament.image || "/images/tournament-placeholder.jpg"}
                    alt={tournament.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-md bg-primary text-black text-xs font-bold uppercase">
                      {tournament.status === "REGISTRATION" ? "Inscripción" : "Abierto"}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                      {tournament.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      <span>{formatDate(tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary" />
                      <span>{tournament.currentPlayers}/{tournament.maxPlayers}</span>
                    </div>
                  </div>
                  <Link
                    href={`/torneos/${tournament.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 transition-all"
                  >
                    Ver e Inscribirse <ArrowRight size={16} />
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
