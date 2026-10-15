"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Trophy,
  Calendar,
  Heart,
  ImageIcon,
  Pencil,
  Trash2,
  Plus,
  Eye,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ContestItem {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  _count: { entries: number };
  entries: Array<{ _count: { votes: number } }>;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ACTIVO
      </span>
    );
  if (status === "FINISHED")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold">
        🏆 FINALIZADO
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-gray-400 text-xs font-bold">
      ⬜ BORRADOR
    </span>
  );
}

export function VotingContestListClient({
  initialContests,
}: {
  initialContests: ContestItem[];
}) {
  const router = useRouter();
  const [contests, setContests] = useState(initialContests);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar el concurso "${title}"? Se eliminarán todas las imágenes y votos.`)) return;

    try {
      const res = await fetch(`/api/admin/voting/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setContests((prev) => prev.filter((c) => c.id !== id));
      toast.success("Concurso eliminado");
    } catch {
      toast.error("No se pudo eliminar el concurso");
    }
  }

  async function handleChangeStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/voting/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setContests((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Estado actualizado a "${newStatus}"`);
    } catch {
      toast.error("Error al cambiar el estado");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Votaciones</h1>
          <p className="text-gray-400 mt-1">Gestioná los concursos de votación de imágenes</p>
        </div>
        <Link href="/admin/voting/new">
          <Button className="bg-secondary text-black font-black hover:bg-yellow-400 gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Concurso
          </Button>
        </Link>
      </div>

      {/* Contests list */}
      {contests.length === 0 ? (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-16 text-center space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-gray-600" />
          <h3 className="text-xl font-bold text-white">No hay concursos todavía</h3>
          <p className="text-gray-400 text-sm">
            Creá el primer concurso de votación para la comunidad.
          </p>
          <Link href="/admin/voting/new">
            <Button className="bg-secondary text-black font-black hover:bg-yellow-400 gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Crear primer concurso
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contests.map((contest) => {
            const totalVotes = contest.entries.reduce(
              (acc, e) => acc + e._count.votes,
              0
            );

            return (
              <div
                key={contest.id}
                className="bg-zinc-900/60 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {contest.coverImageUrl ? (
                        <img
                          src={contest.coverImageUrl}
                          alt={contest.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/uploads/imagenes/logo-trasparente-1771101621599-1771772834629.webp"
                          alt="Logo oficial"
                          className="w-10 h-10 object-contain opacity-50"
                          onError={(e) => {
                            (e.target as any).src = "/images/logo5.png";
                          }}
                        />
                      )}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-white truncate">
                          {contest.title}
                        </h3>
                        <StatusBadge status={contest.status} />
                      </div>

                      {contest.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {contest.description}
                        </p>
                      )}

                    <div className="flex items-center gap-6 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Inicio: {formatDate(contest.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Fin: {formatDate(contest.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{contest._count.entries} imágenes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400 font-bold">{totalVotes} votos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Quick status change */}
                    {contest.status === "DRAFT" && (
                      <Button
                        size="sm"
                        onClick={() => handleChangeStatus(contest.id, "ACTIVE")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Activar
                      </Button>
                    )}
                    {contest.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        onClick={() => handleChangeStatus(contest.id, "FINISHED")}
                        className="bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold"
                      >
                        Finalizar
                      </Button>
                    )}

                    <Link href={`/votaciones/${contest.id}`} target="_blank">
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white gap-1.5">
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </Link>

                    <Link href={`/admin/voting/${contest.id}`}>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white gap-1.5">
                        <Pencil className="w-4 h-4" />
                        Editar
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(contest.id, contest.title)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
