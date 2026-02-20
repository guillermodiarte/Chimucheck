import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Trophy, Gamepad2, ChevronRight } from "lucide-react";
import { db } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const player = session?.user;

  if (!player?.id) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  const playerData = await db.player.findUnique({
    where: { id: player.id },
    include: {
      stats: true,
      registrations: {
        include: { tournament: true },
        orderBy: { registeredAt: "desc" },
      },
    },
  });

  const totalTournaments = playerData?.registrations.length || 0;
  const latestTournament = playerData?.registrations[0]?.tournament;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold tracking-tight text-white capitalize">
        Hola, {playerData?.alias || "Jugador"} <span className="text-2xl">⚡️</span>
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Chimucoins Card */}
        <Card className="bg-zinc-900/50 border-yellow-500/20 hover:border-yellow-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Chimucoins</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{playerData?.chimucoins || 0} 🟡</div>
            <p className="text-xs text-gray-400">Monedas disponibles</p>
          </CardContent>
        </Card>



        {/* Torneos Participados — link al historial */}
        <Link href="/player/dashboard/tournaments" className="block">
          <Card className="bg-zinc-900/50 border-white/10 hover:border-blue-500/50 transition-colors h-full group cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Torneos Participados</CardTitle>
              <Gamepad2 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalTournaments}</div>
              <p className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                Ver historial <ChevronRight size={12} />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Actividad Reciente */}
      <Card className="bg-zinc-900 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Tu Actividad Reciente</CardTitle>
          <Link
            href="/player/dashboard/tournaments"
            className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
          >
            Ver todos <ChevronRight size={12} />
          </Link>
        </CardHeader>
        <CardContent>
          {playerData?.registrations && playerData.registrations.length > 0 ? (
            <div className="space-y-3">
              {playerData.registrations.slice(0, 5).map((reg: any) => (
                <Link
                  key={reg.id}
                  href={`/torneos/${reg.tournament.id}`}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 hover:bg-white/2 -mx-2 px-2 rounded transition-colors group"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{reg.tournament.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(reg.tournament.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(reg.tournament.status === "IN_PROGRESS" || reg.tournament.status === "FINISHED") && (
                      <span className="text-xs font-bold text-primary">{reg.score ?? 0} pts</span>
                    )}
                    <div className={`text-xs font-medium px-2 py-1 rounded ${reg.status === "CONFIRMED" ? "bg-green-500/20 text-green-400" :
                      reg.status === "ELIMINATED" ? "bg-red-500/20 text-red-400" :
                        "bg-white/5 text-gray-300"
                      }`}>
                      {reg.status === "CONFIRMED" ? "Inscrito" :
                        reg.status === "ELIMINATED" ? "Eliminado" : "Pendiente"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm flex flex-col items-center justify-center h-36 border border-dashed border-zinc-800 rounded gap-3">
              <Gamepad2 className="w-8 h-8 text-zinc-700" />
              <span>Aún no tienes actividad.</span>
              <Link href="/player/dashboard/tournaments" className="text-primary text-xs hover:underline">
                Explorar torneos →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
