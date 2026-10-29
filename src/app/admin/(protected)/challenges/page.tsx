import { getChallenges, deleteChallenge, toggleChallengeStatus } from "@/app/actions/challenges";
import type { ChallengeGameEntry } from "@/app/actions/challenges";
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
import { ChallengeStatusBadge } from "@/components/admin/ChallengeStatusBadge";
import ChallengeTabs from "@/components/admin/ChallengeTabs";
import Link from "next/link";
import { Plus, Pencil, Swords, Power, Gamepad2, Medal, Lock, UserCheck, Table as TableIcon } from "lucide-react";
import Image from "next/image";
import { formatDateTime } from "@/lib/utils";

function getGames(challenge: any): ChallengeGameEntry[] {
  if (challenge.games) {
    try {
      const parsed = typeof challenge.games === "string" ? JSON.parse(challenge.games) : challenge.games;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: any) => ({
          name: g.name || "",
          image: g.image || "",
          format: g.format || "",
          categoryId: g.categoryId,
        }));
      }
    } catch {}
  }
  return [];
}

export default async function AdminChallengesPage() {
  const challenges = await getChallenges(false);

  const activeChallenges = challenges.filter((c: any) => c.status !== "FINALIZADO");
  const finishedChallenges = challenges.filter((c: any) => c.status === "FINALIZADO");

  const renderTable = (items: any[], isFinished = false) => (
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-black/60">
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-gray-300">Desafío</TableHead>
            <TableHead className="text-gray-300">Juegos</TableHead>
            <TableHead className="text-gray-300">Fecha</TableHead>
            <TableHead className="text-gray-300">Cupo</TableHead>
            <TableHead className="text-gray-300">Estado</TableHead>
            <TableHead className="text-right text-gray-300">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Swords className="w-8 h-8 opacity-20" />
                  <p>{isFinished ? "No hay desafíos finalizados." : "No hay desafíos activos."}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((challenge) => {
              const games = getGames(challenge);
              const firstImage = games.find((g) => g.image)?.image;

              return (
                <TableRow key={challenge.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
                        {firstImage ? (
                          <Image src={firstImage} alt={challenge.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Swords className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-base">{challenge.name}</span>
                          {challenge.isRestricted && (
                            <span title="Desafío Restrictivo (Requiere Aprobación)">
                              <Lock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {games.length} {games.length === 1 ? "juego" : "juegos"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {games.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {games.map((game, idx) => (
                          <span
                            key={idx}
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
                    {formatDateTime(challenge.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-300">
                      <span
                        className={
                          challenge.registrations.length >= challenge.maxPlayers
                            ? "text-red-400 font-bold"
                            : "text-green-400"
                        }
                      >
                        {challenge.registrations.length}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-500">{challenge.maxPlayers}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChallengeStatusBadge id={challenge.id} status={challenge.status as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Tabla de Jugadores / Panel en Vivo: SIEMPRE DISPONIBLE */}
                      <Link href={`/admin/challenges/${challenge.id}/live`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-yellow-300 hover:bg-yellow-500/10"
                          title="Tabla de Jugadores y Turnos (Panel en Vivo)"
                        >
                          <TableIcon className="w-4 h-4" />
                        </Button>
                      </Link>

                      {/* Switch Activo / Ocultar */}
                      <form action={toggleChallengeStatus.bind(null, challenge.id, challenge.active)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-white"
                          title={challenge.active ? "Desactivar" : "Activar"}
                        >
                          <Power className={`w-4 h-4 ${challenge.active ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      </form>

                      {challenge.isRestricted && challenge.status !== "FINALIZADO" && (
                        <Link href="/admin/requests">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                            title="Ver solicitudes pendientes"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}

                      {/* Editar */}
                      <Link href={`/admin/challenges/${challenge.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                          title="Editar Desafío"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>

                      {/* Eliminar */}
                      <DeleteButton
                        id={challenge.id}
                        deleteAction={deleteChallenge}
                        itemName="Desafío"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Swords className="w-8 h-8 text-primary" />
            Desafíos
          </h1>
          <p className="text-gray-400">
            Gestiona los desafíos con cola de turnos continua y tabla de puntajes en tiempo real.
          </p>
        </div>
        <Link href="/admin/challenges/create">
          <Button className="bg-primary text-black hover:bg-yellow-400 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Desafío
          </Button>
        </Link>
      </div>

      <ChallengeTabs
        activeContent={renderTable(activeChallenges, false)}
        finishedContent={renderTable(finishedChallenges, true)}
      />
    </div>
  );
}
