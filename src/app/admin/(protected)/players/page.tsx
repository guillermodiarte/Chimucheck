
import { getPlayers, deletePlayer, togglePlayerStatus } from "@/app/actions/players";
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
import Image from "next/image";
import { Power, Pencil } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { PlayerActions } from "@/components/admin/PlayerActions";
import { formatDate } from "@/lib/utils";

export default async function AdminPlayersPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Jugadores</h2>
          <p className="text-gray-400">Gestión de usuarios registrados en la plataforma.</p>
        </div>
        <div>
          <PlayerActions />
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-900">
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-300">Avatar</TableHead>
              <TableHead className="text-gray-300">Alias / Nombre</TableHead>
              <TableHead className="text-gray-300">Email</TableHead>
              <TableHead className="text-gray-300">ChimuCoins</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-gray-300">Registrado</TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-black">
            {players.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No hay jugadores registrados.
                </TableCell>
              </TableRow>
            ) : (
              // @ts-ignore
              players.map((player) => (
                <TableRow key={player.id} className="border-gray-800 hover:bg-gray-900/50">
                  <TableCell>
                    <TableCell>
                      <Avatar className="w-10 h-10 border border-gray-700">
                        <AvatarImage src={player.image || ""} alt={player.alias || "Avatar"} className="object-cover" />
                        <AvatarFallback className="bg-gray-800 text-gray-500 text-xs">
                          {player.alias?.[0]?.toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{player.alias || "-"}</span>
                      <span className="text-xs text-gray-500">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">{player.email}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-yellow-500 font-bold">
                      🪙 {player.chimucoins}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${player.active
                        ? "bg-green-900/30 text-green-400 border border-green-900"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                    >
                      {player.active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {formatDate(player.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={togglePlayerStatus.bind(null, player.id, player.active)}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title={player.active ? "Desactivar" : "Activar"}>
                          <Power className={`w-4 h-4 ${player.active ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      </form>
                      <Link href={`/admin/players/${player.id}`}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DeleteButton
                        id={player.id}
                        // @ts-ignore
                        deleteAction={deletePlayer}
                        itemName="Jugador"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
