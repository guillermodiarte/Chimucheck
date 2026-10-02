"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Pencil,
  Trash2,
  Gift,
  Sparkles,
} from "lucide-react";
import { deleteRaffle } from "@/app/actions/raffles";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RaffleItem {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prizeImage: string | null;
  type: string;
  status: string;
  maxEntries: number | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  createdAt: string | Date;
  _count?: {
    entries: number;
  };
}

export function RaffleListClient({ initialRaffles }: { initialRaffles: RaffleItem[] }) {
  const [raffles, setRaffles] = useState<RaffleItem[]>(initialRaffles);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar el sorteo "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(id);
    const res = await deleteRaffle(id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Sorteo eliminado");
      setRaffles((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } else {
      toast.error(res.message || "Error al eliminar");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Activo
          </Badge>
        );
      case "DRAWING":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse">
            En Sorteo
          </Badge>
        );
      case "FINISHED":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Finalizado
          </Badge>
        );
      case "DRAFT":
      default:
        return (
          <Badge className="bg-gray-800 text-gray-400 border border-gray-700">
            Borrador
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "MANUAL") {
      return (
        <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-800/50 px-2 py-0.5 rounded font-mono">
          MANUAL
        </span>
      );
    }
    return (
      <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-mono">
        ABIERTO
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block border border-gray-800 rounded-xl overflow-hidden bg-black/40 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-gray-900/80">
            <TableRow className="border-gray-800 hover:bg-gray-900/80">
              <TableHead className="text-gray-300 w-16">Premio</TableHead>
              <TableHead className="text-gray-300">Título / Premio</TableHead>
              <TableHead className="text-gray-300">Tipo</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-gray-300">Participantes</TableHead>
              <TableHead className="text-gray-300">Ganador</TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {raffles.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                  No hay sorteos creados todavía. ¡Crea el primero!
                </TableCell>
              </TableRow>
            ) : (
              raffles.map((raffle) => {
                const entriesCount = raffle._count?.entries || 0;
                return (
                  <TableRow
                    key={raffle.id}
                    className="border-gray-800 hover:bg-gray-900/40 transition-colors"
                  >
                    <TableCell>
                      {raffle.prizeImage ? (
                        <img
                          src={raffle.prizeImage}
                          alt={raffle.prize}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-800 bg-gray-900"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-secondary">
                          <Gift className="w-6 h-6" />
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/admin/raffles/${raffle.id}`}
                        className="font-bold text-white hover:text-secondary transition-colors block text-base"
                      >
                        {raffle.title}
                      </Link>
                      <span className="text-xs text-secondary font-medium block mt-0.5">
                        🎁 {raffle.prize}
                      </span>
                    </TableCell>

                    <TableCell>{getTypeBadge(raffle.type)}</TableCell>

                    <TableCell>{getStatusBadge(raffle.status)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-300">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-white">{entriesCount}</span>
                        {raffle.maxEntries && (
                          <span className="text-gray-500">/ {raffle.maxEntries}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {raffle.winnerAlias ? (
                        <div className="flex items-center gap-2">
                          {raffle.winnerImage ? (
                            <img
                              src={raffle.winnerImage}
                              alt={raffle.winnerAlias}
                              className="w-6 h-6 rounded-full object-cover border border-yellow-500/50"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold">
                              🏆
                            </div>
                          )}
                          <span className="font-bold text-yellow-400 text-sm">
                            {raffle.winnerAlias}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Sin ganador</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Live screen button */}
                        <Link href={`/admin/raffles/${raffle.id}/live`}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-yellow-500/20 text-secondary border border-yellow-500/40 hover:bg-yellow-500 hover:text-black gap-1.5 text-xs font-bold h-8"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            En Vivo
                          </Button>
                        </Link>

                        {/* Detail / Manage button */}
                        <Link href={`/admin/raffles/${raffle.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-300 hover:text-white hover:bg-gray-800 h-8 text-xs gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Gestionar
                          </Button>
                        </Link>

                        {/* Edit button */}
                        <Link href={`/admin/raffles/${raffle.id}/edit`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {/* Delete button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={deletingId === raffle.id}
                          onClick={() => handleDelete(raffle.id, raffle.title)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {raffles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-gray-800 rounded-xl bg-black/30">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
            No hay sorteos creados.
          </div>
        ) : (
          raffles.map((raffle) => {
            const entriesCount = raffle._count?.entries || 0;
            return (
              <div
                key={raffle.id}
                className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-start gap-3">
                  {raffle.prizeImage ? (
                    <img
                      src={raffle.prizeImage}
                      alt={raffle.prize}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-800 bg-gray-950 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center text-secondary shrink-0">
                      <Gift className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(raffle.status)}
                      {getTypeBadge(raffle.type)}
                    </div>
                    <Link
                      href={`/admin/raffles/${raffle.id}`}
                      className="font-bold text-white text-base block hover:text-secondary truncate"
                    >
                      {raffle.title}
                    </Link>
                    <p className="text-xs text-secondary font-semibold mt-0.5 truncate">
                      🎁 {raffle.prize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/80">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span>
                      {entriesCount} {raffle.maxEntries ? `/ ${raffle.maxEntries}` : ""} participantes
                    </span>
                  </div>
                  {raffle.winnerAlias && (
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      🏆 {raffle.winnerAlias}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link href={`/admin/raffles/${raffle.id}/live`} className="w-full">
                    <Button
                      size="sm"
                      className="w-full bg-secondary text-black hover:bg-yellow-400 font-bold text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Pantalla Live
                    </Button>
                  </Link>

                  <Link href={`/admin/raffles/${raffle.id}`} className="w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-gray-700 text-gray-200 hover:text-white text-xs gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Participantes
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
