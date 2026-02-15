
import { getTournaments, deleteTournament, toggleTournamentStatus } from "@/app/actions/tournaments";
import type { GameEntry } from "@/app/actions/tournaments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/DeleteButton";
import Link from "next/link";
import { Plus, Pencil, Trophy, Power, Gamepad2 } from "lucide-react";
import Image from "next/image";

function getGames(tournament: any): GameEntry[] {
  if (tournament.games) {
    const parsed = typeof tournament.games === "string"
      ? JSON.parse(tournament.games)
      : tournament.games;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  }
  if (tournament.game) {
    return [{ name: tournament.game, image: tournament.image || "" }];
  }
  return [];
}

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments(false);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Torneos</h2>
          <p className="text-gray-400">Gestiona las competencias y registros.</p>
        </div>
        <Link href="/admin/tournaments/create">
          <Button className="bg-primary text-black hover:bg-yellow-400">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Torneo
          </Button>
        </Link>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-black/60">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-300">Torneo</TableHead>
              <TableHead className="text-gray-300">Juegos</TableHead>
              <TableHead className="text-gray-300">Fecha</TableHead>
              <TableHead className="text-gray-300">Cupo</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.length === 0 ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-8 h-8 opacity-20" />
                    <p>No hay torneos creados aún.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // @ts-ignore
              tournaments.map((tournament) => {
                const games = getGames(tournament);
                const firstImage = games.find((g) => g.image)?.image || tournament.image;

                return (
                  <TableRow key={tournament.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
                          {firstImage ? (
                            <Image src={firstImage} alt={tournament.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Trophy className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white line-clamp-1">{tournament.name}</span>
                          <span className="text-xs text-gray-400 line-clamp-1">{tournament.format || "General"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {games.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {games.map((game, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-300 border border-gray-700"
                            >
                              <Gamepad2 className="w-3 h-3 text-primary" />
                              {game.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(tournament.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-300">
                        <span className={`${tournament.registrations.length >= tournament.maxPlayers ? "text-red-400 font-bold" : "text-green-400"}`}>
                          {tournament.registrations.length}
                        </span>
                        <span className="text-gray-600">/</span>
                        <span className="text-gray-500">{tournament.maxPlayers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${tournament.active
                          ? "bg-green-900/30 text-green-400 border border-green-900"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                          }`}
                      >
                        {tournament.active ? "Activo" : "Oculto"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleTournamentStatus.bind(null, tournament.id, tournament.active)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title={tournament.active ? "Ocultar" : "Activar"}>
                            <Power className={`w-4 h-4 ${tournament.active ? "text-green-500" : "text-gray-500"}`} />
                          </Button>
                        </form>
                        <Link href={`/admin/tournaments/edit/${tournament.id}`}>
                          <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DeleteButton
                          id={tournament.id}
                          // @ts-ignore
                          deleteAction={deleteTournament}
                          itemName="Torneo"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
