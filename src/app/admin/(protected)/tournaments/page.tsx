
import { getTournaments, getFinishedTournaments, deleteTournament, toggleTournamentStatus } from "@/app/actions/tournaments";
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
import { FinishTournamentButton } from "@/components/admin/FinishTournamentButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import TournamentTabs from "@/components/admin/TournamentTabs";
import Link from "next/link";
import { Plus, Pencil, Trophy, Power, Gamepad2, Medal, Camera } from "lucide-react";
import Image from "next/image";
import { TournamentActions } from "@/components/admin/TournamentActions";
import { formatDate } from "@/lib/utils";

function getGames(tournament: any): GameEntry[] {
  if (tournament.games) {
    const parsed = typeof tournament.games === "string"
      ? JSON.parse(tournament.games)
      : tournament.games;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((g: any) => ({ name: g.name || "", image: g.image || "", format: g.format || "" }));
    }
  }
  if (tournament.game) {
    return [{ name: tournament.game, image: tournament.image || "", format: tournament.format || "" }];
  }
  return [];
}

function parseWinners(tournament: any) {
  try {
    const w = typeof tournament.winners === "string" ? JSON.parse(tournament.winners) : tournament.winners;
    return Array.isArray(w) ? w : [];
  } catch { return []; }
}

function parsePhotos(tournament: any) {
  try {
    const p = typeof tournament.photos === "string" ? JSON.parse(tournament.photos) : tournament.photos;
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments(false);
  const finishedTournaments = await getFinishedTournaments();

  // Filter out FINISHED from the active list
  const activeTournaments = tournaments.filter((t: any) => t.status !== "FINALIZADO");

  const activeContent = (
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
          {activeTournaments.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Trophy className="w-8 h-8 opacity-20" />
                  <p>No hay torneos activos.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // @ts-ignore
            activeTournaments.map((tournament) => {
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
                    {formatDate(tournament.date)}
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
                    <StatusBadge id={tournament.id} status={tournament.status as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tournament.status === "EN_JUEGO" && (
                        <Link href={`/admin/tournaments/live/${tournament.id}`}>
                          <Button variant="ghost" size="icon" className="text-green-400 hover:text-green-300 hover:bg-green-900/20" title="Panel en Vivo">
                            <Medal className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      <form action={toggleTournamentStatus.bind(null, tournament.id, tournament.active)}>
                        <Button disabled={tournament.status === "EN_JUEGO"} variant="ghost" size="icon" className={`text-gray-400 hover:text-white ${tournament.status === "EN_JUEGO" ? "opacity-50 pointer-events-none" : ""}`} title={tournament.active ? "Ocultar" : "Activar"}>
                          <Power className={`w-4 h-4 ${tournament.active ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      </form>
                      <Link href={tournament.status === "EN_JUEGO" ? "#" : `/admin/tournaments/edit/${tournament.id}`} className={tournament.status === "EN_JUEGO" ? "pointer-events-none opacity-50" : ""}>
                        <Button disabled={tournament.status === "EN_JUEGO"} variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <div className={tournament.status === "EN_JUEGO" ? "pointer-events-none opacity-50" : ""}>
                        <DeleteButton
                          id={tournament.id}
                          // @ts-ignore
                          deleteAction={deleteTournament}
                          itemName="Torneo"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  const finishedContent = (
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-black/60">
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-gray-300">Torneo</TableHead>
            <TableHead className="text-gray-300">Juegos</TableHead>
            <TableHead className="text-gray-300">Fecha</TableHead>
            <TableHead className="text-gray-300">Inscriptos</TableHead>
            <TableHead className="text-gray-300">Ganadores</TableHead>
            <TableHead className="text-gray-300">Fotos</TableHead>
            <TableHead className="text-right text-gray-300">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {finishedTournaments.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Medal className="w-8 h-8 opacity-20" />
                  <p>No hay torneos finalizados aún.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            finishedTournaments.map((tournament) => {
              const games = getGames(tournament);
              const firstImage = games.find((g) => g.image)?.image || tournament.image;
              const winners = parseWinners(tournament);
              const photos = parsePhotos(tournament);

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
                    {formatDate(tournament.date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-300">{tournament.registrations.length}</span>
                  </TableCell>
                  <TableCell>
                    {winners.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {winners.map((w: any, i: number) => (
                          <span key={i} className="text-xs">
                            <span className="text-primary font-bold">{w.position}°</span>{" "}
                            <span className="text-gray-300">{w.playerAlias}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-gray-400 text-xs">{photos.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge id={tournament.id} status={tournament.status as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/tournaments/results/${tournament.id}`}>
                        <Button variant="ghost" size="icon" className="text-primary hover:text-yellow-300 hover:bg-yellow-900/20" title="Gestionar resultados">
                          <Medal className="w-4 h-4" />
                        </Button>
                      </Link>
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
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Torneos</h2>
          <p className="text-gray-400">Gestiona las competencias y registros.</p>
        </div>
        <div className="flex items-center gap-3">
          <TournamentActions />
          <Link href="/admin/tournaments/create">
            <Button className="bg-primary text-black hover:bg-yellow-400">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Torneo
            </Button>
          </Link>
        </div>
      </div>

      <TournamentTabs activeContent={activeContent} finishedContent={finishedContent} />
    </div>
  );
}
