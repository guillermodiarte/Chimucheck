"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Gift, Users, Sparkles, Calendar, Trophy, Ticket, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PublicRaffleItem {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prizeImage: string | null;
  type: string;
  status: string;
  maxEntries: number | null;
  drawDate: string | Date | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  _count: {
    entries: number;
  };
  prizes?: Array<{
    id: string;
    title: string;
    order: number;
  }>;
}

export function PublicSorteosList({
  initialRaffles,
}: {
  initialRaffles: PublicRaffleItem[];
}) {
  const handleOpenLogin = () => {
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  };

  const activeRaffles = initialRaffles.filter((r) => r.status === "ACTIVE");
  const otherRaffles = initialRaffles.filter((r) => r.status !== "ACTIVE");

  return (
    <div className="space-y-12">
      {/* Sorteos Disponibles */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
          Sorteos Abiertos
        </h2>

        {activeRaffles.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
            <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No hay sorteos abiertos en este momento</h3>
            <p className="text-gray-400 text-sm">
              Pronto publicaremos nuevos sorteos oficiales. ¡Mantente atento a la comunidad!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeRaffles.map((raffle) => {
              const isFull = !!(raffle.maxEntries && raffle._count.entries >= raffle.maxEntries);

              return (
                <Link
                  key={raffle.id}
                  href={`/sorteos/${raffle.id}`}
                  className="group relative bg-zinc-950/80 border border-white/10 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between block"
                >
                  <div className="relative h-52 w-full bg-zinc-900 overflow-hidden">
                    {raffle.prizeImage ? (
                      <img
                        src={raffle.prizeImage}
                        alt={raffle.prize}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-secondary">
                        <Gift className="w-16 h-16 opacity-60" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/10">
                        {raffle.type === "OPEN" ? "SORTEO ABIERTO" : "MANUAL"}
                      </span>

                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ACTIVO
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-bold flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" /> Premio
                      </span>
                      <h3 className="text-xl font-black text-white truncate drop-shadow flex items-center justify-between">
                        <span className="truncate">{raffle.prize}</span>
                        {raffle.prizes && raffle.prizes.length > 1 && (
                          <span className="text-[11px] bg-yellow-400 text-black font-mono font-black px-2 py-0.5 rounded-full ml-2 shrink-0 shadow">
                            +{raffle.prizes.length - 1} más
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                        {raffle.title}
                      </h4>
                      {raffle.description && (
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                          {raffle.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-semibold">
                          {raffle._count.entries}
                        </span>
                        {raffle.maxEntries && (
                          <span>/ {raffle.maxEntries} participantes</span>
                        )}
                        {!raffle.maxEntries && <span>participantes</span>}
                      </div>

                      {raffle.drawDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span suppressHydrationWarning>{formatDate(raffle.drawDate)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      {isFull ? (
                        <div className="w-full py-3 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold text-center cursor-pointer">
                          Cupo máximo completado — Ver detalle
                        </div>
                      ) : (
                        <Button
                          className="w-full h-12 bg-secondary text-black border-2 border-secondary hover:bg-yellow-400 hover:border-yellow-400 transition-all duration-300 font-black tracking-wider text-sm uppercase shadow-lg gap-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Ver Sorteo e Inscribirme
                        </Button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Sorteos Finalizados / Historial */}
      {otherRaffles.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-white/10">
          <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Historial de Ganadores
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherRaffles.map((raffle) => (
              <div
                key={raffle.id}
                className="bg-zinc-950/60 border border-white/5 rounded-2xl p-5 space-y-4 grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase">
                    {raffle.status === "FINISHED" ? "Finalizado" : "En Sorteo"}
                  </span>
                  <span className="text-xs text-yellow-400 font-bold">
                    🎁 {raffle.prize}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white">{raffle.title}</h4>

                {raffle.winnerAlias && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
                    {raffle.winnerImage ? (
                      <img
                        src={raffle.winnerImage}
                        alt={raffle.winnerAlias}
                        className="w-10 h-10 rounded-full object-cover border border-yellow-400"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-base">
                        🏆
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-yellow-400">
                        Ganador
                      </span>
                      <p className="font-black text-white text-sm">
                        {raffle.winnerAlias}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
