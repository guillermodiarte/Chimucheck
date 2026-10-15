"use client";

import Link from "next/link";
import { Calendar, ImageIcon, Heart, Trophy, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContestItem {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  _count: { entries: number };
  entries: Array<{ imageUrl: string }>;
  totalVotes?: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ContestStatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Votación abierta
      </span>
    );
  if (status === "FINISHED")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[11px] font-bold uppercase tracking-wider">
        🏆 Finalizado
      </span>
    );
  return null;
}

export function PublicVotingList({
  contests,
  defaultLogoUrl,
}: {
  contests: ContestItem[];
  defaultLogoUrl?: string;
}) {
  const active = contests.filter((c) => c.status === "ACTIVE");
  const finished = contests.filter((c) => c.status === "FINISHED");

  return (
    <div className="space-y-14">
      {/* Active contests */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
          Votaciones Activas
        </h2>

        {active.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
            <div className="text-4xl">🗳️</div>
            <h3 className="text-xl font-bold text-white">No hay votaciones activas</h3>
            <p className="text-gray-400 text-sm">
              Pronto abriremos una nueva votación. ¡Seguí la comunidad en Instagram para no perdértela!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {active.map((contest) => (
              <ContestCard key={contest.id} contest={contest} defaultLogoUrl={defaultLogoUrl} />
            ))}
          </div>
        )}
      </section>

      {/* Finished contests */}
      {finished.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-white/10">
          <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Historial de Votaciones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finished.map((contest) => (
              <ContestCard key={contest.id} contest={contest} finished defaultLogoUrl={defaultLogoUrl} />
            ))}
          </div>
        </section>
      )}

      {contests.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="text-5xl">🗳️</div>
          <h3 className="text-2xl font-bold text-white">Aún no hay votaciones</h3>
          <p className="text-gray-400">
            Pronto lanzaremos el primer concurso de votación de la comunidad.
          </p>
        </div>
      )}
    </div>
  );
}

function ContestCard({
  contest,
  finished = false,
  defaultLogoUrl,
}: {
  contest: ContestItem;
  finished?: boolean;
  defaultLogoUrl?: string;
}) {
  const hasCustomCover = !!contest.coverImageUrl;
  const coverImage = contest.coverImageUrl || defaultLogoUrl || "/images/logo5.png";

  return (
    <Link
      href={`/votaciones/${contest.id}`}
      className={`group relative bg-zinc-950/80 border border-white/10 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,215,0,0.10)] rounded-3xl overflow-hidden transition-all duration-300 flex flex-col block ${
        finished ? "opacity-80 hover:opacity-100 grayscale hover:grayscale-0" : ""
      }`}
    >
      {/* Cover image */}
      <div className="relative h-52 w-full bg-zinc-900/90 overflow-hidden flex items-center justify-center">
        {coverImage ? (
          <img
            src={coverImage}
            alt={contest.title}
            className={`transition-all duration-500 group-hover:scale-105 ${
              hasCustomCover
                ? "w-full h-full object-cover"
                : "max-h-36 max-w-[75%] object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.2)]"
            }`}
            onError={(e) => {
              if (defaultLogoUrl && (e.target as any).src !== defaultLogoUrl) {
                (e.target as any).src = defaultLogoUrl;
              } else {
                (e.target as any).src = "/images/logo5.png";
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-zinc-600">
            <ImageIcon className="w-14 h-14 opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          <ContestStatusBadge status={contest.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors line-clamp-2">
            {contest.title}
          </h3>
          {contest.description && (
            <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed whitespace-pre-wrap">
              {contest.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{contest._count.entries} imágenes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Cierra: {formatDate(contest.endDate)}</span>
            </div>
          </div>

          <Button className="w-full h-11 bg-secondary text-black border-2 border-secondary hover:bg-yellow-400 hover:border-yellow-400 transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg gap-2">
            <ArrowRight className="w-4 h-4" />
            {contest.status === "ACTIVE" ? "Ver y Votar" : "Ver Resultados"}
          </Button>
        </div>
      </div>
    </Link>
  );
}
