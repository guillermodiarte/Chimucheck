"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deletePlayer, togglePlayerStatus } from "@/app/actions/players";
import { formatDate } from "@/lib/utils";
import { Power, Pencil, Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Player {
  id: string;
  alias: string | null;
  name: string | null;
  email: string | null;
  chimucoins: number;
  active: boolean;
  createdAt: string | Date;
  image?: string | null;
  needsProfileCompletion?: boolean;
  phone?: string | null;
  province?: string | null;
  locality?: string | null;
}

type SortField = "chimucoins" | "alias" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function PlayersTableClient({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return players;
    return players.filter((p) => {
      return (
        p.alias?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.province?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q)
      );
    });
  }, [search, players]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: any, vb: any;
      if (sortField === "chimucoins") {
        va = a.chimucoins;
        vb = b.chimucoins;
      } else if (sortField === "alias") {
        va = (a.alias || "").toLowerCase();
        vb = (b.alias || "").toLowerCase();
      } else {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-600 inline ml-1" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-yellow-400 inline ml-1" />
      : <ChevronDown className="w-3.5 h-3.5 text-yellow-400 inline ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Search + Page Size */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, alias, email, teléfono, provincia, localidad..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/60 transition-all"
          />
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/40 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span>por página</span>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 shrink-0">
          {filtered.length === players.length
            ? `${players.length} jugadores`
            : `${filtered.length} de ${players.length} jugadores`}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-900">
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-300">Avatar</TableHead>
              <TableHead
                className="text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                onClick={() => handleSort("alias")}
              >
                Alias / Nombre <SortIcon field="alias" />
              </TableHead>
              <TableHead className="text-gray-300">Email</TableHead>
              <TableHead
                className="text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                onClick={() => handleSort("chimucoins")}
              >
                ChimuCoins <SortIcon field="chimucoins" />
              </TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead
                className="text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                Registrado <SortIcon field="createdAt" />
              </TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-black">
            {paginated.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {search ? `No se encontraron jugadores para "${search}".` : "No hay jugadores registrados."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((player) => (
                <TableRow key={player.id} className="border-gray-800 hover:bg-gray-900/50">
                  <TableCell>
                    <Avatar className="w-10 h-10 border border-gray-700">
                      <AvatarImage src={player.image || ""} alt={player.alias || "Avatar"} className="object-cover" />
                      <AvatarFallback className="bg-gray-800 text-gray-500 text-xs">
                        {player.alias?.[0]?.toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{player.alias || "-"}</span>
                        {player.needsProfileCompletion && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-medium" title="Perfil pendiente de completar">
                            ⚠️ Incompleto
                          </span>
                        )}
                      </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Mostrando {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sorted.length)} de {sorted.length} jugadores
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setPage(1)}
              className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
              title="Primera página"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
              title="Página anterior"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-600">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                      currentPage === p
                        ? "bg-yellow-500 text-black font-bold"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
              title="Página siguiente"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setPage(totalPages)}
              className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
              title="Última página"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
