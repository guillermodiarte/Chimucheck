import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Trophy, Calendar, Gamepad2 } from "lucide-react";
import { db } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  const player = session?.user;

  // Fetch actual stats from PLAYER table
  if (!player?.id) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  const playerData = await db.player.findUnique({
    where: { id: player?.id },
    include: {
      stats: true,
      registrations: {
        include: { tournament: true },
        take: 5,
        orderBy: { registeredAt: 'desc' }
      }
    }
  });

  // Fetch Top 5 Players by Wins
  const topPlayers = await db.playerStats.findMany({
    orderBy: { wins: 'desc' },
    take: 5,
    include: {
      player: {
        select: {
          alias: true,
          name: true,
          image: true
        }
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold tracking-tight text-white capitalize">
        Hola, {playerData?.alias || "Jugador"} <span className="text-2xl">⚡️</span>
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Chimucoins Card */}
        <Card className="bg-zinc-900/50 border-yellow-500/20 hover:border-yellow-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Chimucoins
            </CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{playerData?.chimucoins || 0} 🟡</div>
            <p className="text-xs text-gray-400">
              Monedas disponibles
            </p>
          </CardContent>
        </Card>

        {/* Wins Card */}
        <Card className="bg-zinc-900/50 border-white/10 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Victorias
            </CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{playerData?.stats?.wins || 0}</div>
            <p className="text-xs text-gray-400">
              Torneos ganados
            </p>
          </CardContent>
        </Card>

        {/* Matches Card */}
        <Card className="bg-zinc-900/50 border-white/10 hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Partidas
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{playerData?.stats?.matchesPlayed || 0}</div>
            <p className="text-xs text-gray-400">
              Jugadas en total
            </p>
          </CardContent>
        </Card>

        {/* Active Tournaments Card */}
        <Card className="bg-zinc-900/50 border-white/10 hover:border-green-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Próximo Torneo
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white truncate">
              {playerData?.registrations[0]?.tournament.name || "Ninguno"}
            </div>
            <p className="text-xs text-gray-400">
              {playerData?.registrations[0] ? new Date(playerData.registrations[0].tournament.date).toLocaleDateString() : "Inscríbete ahora"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Tu Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            {playerData?.registrations && playerData.registrations.length > 0 ? (
              <div className="space-y-4">
                {playerData.registrations.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{reg.tournament.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(reg.tournament.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-gray-300">
                      {reg.status === "CONFIRMED" ? "Inscrito" : "Pendiente"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm flex items-center justify-center h-40 border border-dashed border-zinc-800 rounded">
                Aún no tienes actividad reciente.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Top 5 Players</CardTitle>
          </CardHeader>
          <CardContent>
            {topPlayers.length > 0 ? (
              <div className="space-y-4">
                {topPlayers.map((stat, index) => (
                  <div key={stat.id} className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                      index === 1 ? "bg-gray-400/20 text-gray-400" :
                        index === 2 ? "bg-orange-500/20 text-orange-500" :
                          "bg-white/5 text-gray-500"
                      }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {stat.player.alias || stat.player.name || "Jugador"}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-primary flex items-center gap-1">
                      {stat.wins} <Trophy size={12} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm flex items-center justify-center h-40 border border-dashed border-zinc-800 rounded">
                Ranking disponible pronto.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
