"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gift,
  Users,
  Sparkles,
  Pencil,
  Trash2,
  UserPlus,
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  X,
  Trophy,
  ExternalLink,
} from "lucide-react";
import {
  addPlayersToRaffle,
  addAllApprovedPlayers,
  removePlayerFromRaffle,
  updateRaffleStatus,
} from "@/app/actions/raffles";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface PlayerSummary {
  id: string;
  alias: string | null;
  name: string | null;
  email: string;
  image: string | null;
}

interface Entry {
  id: string;
  playerId: string;
  enteredAt: string | Date;
  player: PlayerSummary;
}

export interface RafflePrizeDetail {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  order: number;
  winnerId: string | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  drawnAt?: string | Date | null;
}

interface RaffleDetail {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prizeImage: string | null;
  type: string;
  status: "DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED";
  maxEntries: number | null;
  requiresLogin: boolean;
  drawDate: string | Date | null;
  winnerId: string | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  entries: Entry[];
  prizes?: RafflePrizeDetail[];
}

export function RaffleDetailClient({
  raffle,
  availablePlayers,
}: {
  raffle: RaffleDetail;
  availablePlayers: PlayerSummary[];
}) {
  const router = useRouter();
  const [searchFilter, setSearchFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  const entries = raffle.entries || [];
  const filteredEntries = entries.filter((e) => {
    const term = searchFilter.toLowerCase();
    const alias = e.player.alias?.toLowerCase() || "";
    const name = e.player.name?.toLowerCase() || "";
    const email = e.player.email?.toLowerCase() || "";
    return alias.includes(term) || name.includes(term) || email.includes(term);
  });

  const filteredAvailable = availablePlayers.filter((p) => {
    const term = modalSearch.toLowerCase();
    const alias = p.alias?.toLowerCase() || "";
    const name = p.name?.toLowerCase() || "";
    const email = p.email?.toLowerCase() || "";
    return alias.includes(term) || name.includes(term) || email.includes(term);
  });

  const handleStatusChange = async (newStatus: "DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED") => {
    setLoadingAction(true);
    const res = await updateRaffleStatus(raffle.id, newStatus);
    setLoadingAction(false);
    if (res.success) {
      toast.success(`Estado cambiado a ${newStatus}`);
      router.refresh();
    } else {
      toast.error(res.message || "Error al actualizar estado");
    }
  };

  const handleAddAll = async () => {
    if (!confirm("¿Deseas agregar a todos los jugadores aprobados al sorteo?")) {
      return;
    }
    setLoadingAction(true);
    const res = await addAllApprovedPlayers(raffle.id);
    setLoadingAction(false);
    if (res.success) {
      toast.success(res.message || "Jugadores agregados con éxito");
      router.refresh();
    } else {
      toast.error(res.message || "Error al agregar jugadores");
    }
  };

  const handleAddSelected = async () => {
    if (selectedPlayerIds.length === 0) {
      toast.error("Selecciona al menos un jugador");
      return;
    }
    setLoadingAction(true);
    const res = await addPlayersToRaffle(raffle.id, selectedPlayerIds);
    setLoadingAction(false);
    if (res.success) {
      toast.success(res.message || "Jugadores agregados con éxito");
      setIsAddModalOpen(false);
      setSelectedPlayerIds([]);
      router.refresh();
    } else {
      toast.error(res.message || "Error al agregar jugadores");
    }
  };

  const handleRemovePlayer = async (playerId: string, alias: string) => {
    if (!confirm(`¿Quitar a ${alias} del sorteo?`)) return;
    setLoadingAction(true);
    const res = await removePlayerFromRaffle(raffle.id, playerId);
    setLoadingAction(false);
    if (res.success) {
      toast.success(`${alias} removido del sorteo`);
      router.refresh();
    } else {
      toast.error(res.message || "Error al quitar jugador");
    }
  };

  const toggleSelectPlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-purple-500/10 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-secondary text-black">
                {raffle.type === "MANUAL" ? "MANUAL" : "ABIERTO"}
              </span>
              <Badge
                className={
                  raffle.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : raffle.status === "DRAWING"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse"
                    : raffle.status === "FINISHED"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                }
              >
                {raffle.status}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{raffle.title}</h1>
            <p className="text-secondary font-bold flex items-center gap-1.5 text-base">
              <Gift className="w-5 h-5" />
              Premio: {raffle.prize}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live screen button */}
            <Link href={`/admin/raffles/${raffle.id}/live`}>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black hover:brightness-110 font-black shadow-lg shadow-yellow-500/25 text-sm tracking-wider uppercase transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-spin" />
                PANTALLA EN VIVO
              </button>
            </Link>

            <Link href={`/admin/raffles/${raffle.id}/edit`}>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-gray-300" />
                Editar
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Winner Spotlight Card (If finished) */}
      {raffle.winnerAlias && (
        <div className="bg-gradient-to-r from-yellow-950/40 via-amber-900/30 to-yellow-950/40 border-2 border-yellow-500/50 rounded-2xl p-6 flex items-center gap-6 shadow-xl shadow-yellow-500/10">
          <div className="relative">
            {raffle.winnerImage ? (
              <img
                src={raffle.winnerImage}
                alt={raffle.winnerAlias}
                className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-400 text-black flex items-center justify-center text-3xl font-black shadow-lg">
                🏆
              </div>
            )}
            <div className="absolute -bottom-2 -right-1 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded-full shadow">
              GANADOR
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-yellow-400 font-bold flex items-center gap-1">
              <Trophy className="w-4 h-4" /> ¡Sorteo Finalizado!
            </span>
            <h2 className="text-3xl font-black text-white">{raffle.winnerAlias}</h2>
            <p className="text-sm text-gray-300">
              Obtuvo el premio <strong className="text-yellow-400">{raffle.prize}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Prizes List Card */}
      {raffle.prizes && raffle.prizes.length > 0 && (
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-secondary" />
                Premios y Puestos del Sorteo ({raffle.prizes.length})
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Orden de sorteo en vivo: del último puesto al primer puesto (1º Gran Ganador).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...raffle.prizes]
              .sort((a, b) => a.order - b.order)
              .map((p) => {
                const isFirst = p.order === 1;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-4 border flex flex-col justify-between ${
                      p.winnerAlias
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : isFirst
                        ? "bg-yellow-500/5 border-yellow-500/30"
                        : "bg-black/40 border-zinc-800"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            p.order === 1
                              ? "bg-yellow-400 text-black shadow-sm"
                              : p.order === 2
                              ? "bg-zinc-300 text-black"
                              : p.order === 3
                              ? "bg-amber-600 text-white"
                              : "bg-zinc-800 text-gray-300"
                          }`}
                        >
                          {p.order === 1
                            ? "🥇 1º Puesto"
                            : p.order === 2
                            ? "🥈 2º Puesto"
                            : p.order === 3
                            ? "🥉 3º Puesto"
                            : `🎖️ ${p.order}º Puesto`}
                        </span>
                        {p.winnerAlias && (
                          <span className="text-[11px] font-bold text-emerald-400 font-mono">
                            ✓ Entregado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base">{p.title}</h4>
                      {p.description && (
                        <p className="text-xs text-gray-400 leading-relaxed">{p.description}</p>
                      )}
                    </div>

                    {p.winnerAlias && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2.5">
                        {p.winnerImage ? (
                          <img
                            src={p.winnerImage}
                            alt={p.winnerAlias}
                            className="w-7 h-7 rounded-full object-cover border border-emerald-400"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                            🏆
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">
                            Ganador
                          </span>
                          <span className="font-bold text-white text-xs">{p.winnerAlias}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Overview Cards & Status Controller */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info card */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-3">
          <span className="text-xs text-gray-400 font-medium">DETALLES DEL SORTEO</span>
          <div className="flex items-center gap-4">
            {raffle.prizeImage ? (
              <img
                src={raffle.prizeImage}
                alt={raffle.prize}
                className="w-16 h-16 rounded-lg object-cover border border-gray-800 bg-black shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-black border border-gray-800 flex items-center justify-center text-secondary shrink-0">
                <Gift className="w-8 h-8" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Premio:</p>
              <p className="text-base font-bold text-white truncate">{raffle.prize}</p>
              {raffle.drawDate && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span suppressHydrationWarning>{formatDate(raffle.drawDate)}</span>
                </p>
              )}
            </div>
          </div>
          {raffle.description && (
            <p className="text-xs text-gray-400 border-t border-gray-800 pt-2 line-clamp-3">
              {raffle.description}
            </p>
          )}
        </div>

        {/* Entries card */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-3">
          <span className="text-xs text-gray-400 font-medium">PARTICIPANTES</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{entries.length}</span>
            {raffle.maxEntries && (
              <span className="text-gray-400 text-sm">/ {raffle.maxEntries} máximo</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {raffle.type === "OPEN"
              ? "Sorteo abierto: Los jugadores pueden inscribirse desde su dashboard."
              : "Sorteo manual: Solo los jugadores agregados por el admin participan."}
          </p>
        </div>

        {/* Change status card */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-3">
          <span className="text-xs text-gray-400 font-medium">CAMBIAR ESTADO</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => handleStatusChange("DRAFT")}
              className={`text-xs h-9 px-2 rounded-lg font-bold border transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center ${
                raffle.status === "DRAFT"
                  ? "bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-500 shadow-sm"
                  : "bg-zinc-950 hover:bg-zinc-800 text-gray-300 hover:text-white border-zinc-800"
              }`}
            >
              Borrador
            </button>
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => handleStatusChange("ACTIVE")}
              className={`text-xs h-9 px-2 rounded-lg font-bold border transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center ${
                raffle.status === "ACTIVE"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-600/25"
                  : "bg-zinc-950 hover:bg-zinc-800 text-gray-300 hover:text-white border-zinc-800"
              }`}
            >
              Activo
            </button>
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => handleStatusChange("DRAWING")}
              className={`text-xs h-9 px-2 rounded-lg font-bold border transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center ${
                raffle.status === "DRAWING"
                  ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-600/25 animate-pulse"
                  : "bg-zinc-950 hover:bg-zinc-800 text-gray-300 hover:text-white border-zinc-800"
              }`}
            >
              En Sorteo
            </button>
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => handleStatusChange("FINISHED")}
              className={`text-xs h-9 px-2 rounded-lg font-bold border transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center ${
                raffle.status === "FINISHED"
                  ? "bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-300 shadow-md shadow-yellow-500/25"
                  : "bg-zinc-950 hover:bg-zinc-800 text-gray-300 hover:text-white border-zinc-800"
              }`}
            >
              Finalizado
            </button>
          </div>
        </div>
      </div>

      {/* Participants Management Section */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Lista de Participantes ({entries.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Jugadores registrados que ingresarán al bolillero del sorteo en vivo.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddAll}
              disabled={loadingAction}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Agregar Todos los Aprobados
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-secondary text-black hover:bg-yellow-400 text-xs font-bold shadow-md shadow-yellow-500/15 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Agregar Manualmente
            </button>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <Input
            placeholder="Filtrar por alias o email..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 bg-black/40 border-gray-800 text-sm text-white"
          />
        </div>

        {/* Participants Table */}
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-black/40">
          <Table>
            <TableHeader className="bg-gray-900/60">
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-300 w-12">#</TableHead>
                <TableHead className="text-gray-300">Jugador</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Fecha Inscripción</TableHead>
                <TableHead className="text-right text-gray-300">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {entries.length === 0
                      ? "Aún no hay participantes inscriptos en este sorteo."
                      : "No se encontraron participantes con ese criterio de búsqueda."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <TableRow
                    key={entry.id}
                    className="border-gray-800 hover:bg-gray-900/30 transition-colors"
                  >
                    <TableCell className="text-gray-500 font-mono text-xs">
                      {idx + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {entry.player.image ? (
                          <img
                            src={entry.player.image}
                            alt={entry.player.alias || "Avatar"}
                            className="w-8 h-8 rounded-full object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                            {(entry.player.alias || "J")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white text-sm">
                            {entry.player.alias || "Sin alias"}
                          </p>
                          {entry.player.name && (
                            <p className="text-xs text-gray-400">{entry.player.name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-gray-300 text-sm font-mono text-xs">
                      {entry.player.email}
                    </TableCell>

                    <TableCell className="text-gray-400 text-xs">
                      <span suppressHydrationWarning>{formatDateTime(entry.enteredAt)}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={loadingAction}
                        onClick={() =>
                          handleRemovePlayer(
                            entry.playerId,
                            entry.player.alias || "Jugador"
                          )
                        }
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                        title="Quitar del sorteo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal / Panel to Add Players Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-secondary" />
                  Agregar Jugadores al Sorteo
                </h3>
                <p className="text-xs text-gray-400">
                  Selecciona uno o más jugadores aprobados para sumarlos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <Input
                  placeholder="Buscar jugador por alias o email..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-9 bg-black/50 border-gray-700 text-sm text-white"
                />
              </div>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {modalSearch
                    ? "No se encontraron jugadores disponibles con ese filtro."
                    : "No hay más jugadores aprobados disponibles para agregar."}
                </div>
              ) : (
                filteredAvailable.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      onClick={() => toggleSelectPlayer(player.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-secondary/15 border-secondary text-white"
                          : "bg-black/30 border-gray-800 text-gray-300 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {player.image ? (
                          <img
                            src={player.image}
                            alt={player.alias || "Avatar"}
                            className="w-9 h-9 rounded-full object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs">
                            {(player.alias || "J")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-white">
                            {player.alias || "Sin alias"}
                          </p>
                          <p className="text-xs text-gray-400">{player.email}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isSelected
                            ? "bg-secondary border-secondary text-black"
                            : "border-gray-600"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-between bg-black/40">
              <span className="text-xs text-gray-400">
                {selectedPlayerIds.length} seleccionado(s)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedPlayerIds.length === 0 || loadingAction}
                  onClick={handleAddSelected}
                  className="px-4 py-1.5 rounded-lg bg-secondary text-black hover:bg-yellow-400 font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Agregar ({selectedPlayerIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
