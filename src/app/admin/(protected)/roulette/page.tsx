import React from "react";
import Link from "next/link";
import { Plus, Dices, Sparkles, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoulettes } from "@/app/actions/roulette";
import { RouletteCard } from "@/components/admin/roulette/RouletteCard";

export const metadata = {
  title: "Ruletas de Juegos | Admin Chimuchek",
  description: "Administra y juega con ruletas de juegos personalizadas para eventos en vivo.",
};

export default async function RouletteListPage() {
  const result = await getRoulettes();
  const roulettes = result.success ? result.roulettes : [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wider uppercase">
            <Dices className="w-4 h-4" />
            Módulo de Sorteos & Eventos
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Ruletas de Juegos
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Crea ruletas con los juegos del catálogo para sortear en vivo durante los eventos.
            Puedes girarla con tiempo configurable o impulsarla manualmente con el mouse o la pantalla táctil.
          </p>
        </div>

        <Link href="/admin/roulette/new">
          <Button className="bg-gradient-to-r from-purple-600 hover:from-purple-500 to-pink-600 hover:to-pink-500 text-white font-extrabold shadow-lg shadow-purple-500/25 px-5 py-6 rounded-2xl flex items-center gap-2 text-sm sm:text-base">
            <Plus className="w-5 h-5" />
            Nueva Ruleta
          </Button>
        </Link>
      </div>

      {/* Roulettes Grid or Empty State */}
      {roulettes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 rounded-3xl bg-gray-900/40 border border-dashed border-white/15 text-center space-y-5">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Dices className="w-12 h-12" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-bold text-white">No hay ruletas creadas todavía</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Crea tu primera ruleta seleccionando juegos de tu catálogo para animar los eventos y torneos.
            </p>
          </div>
          <Link href="/admin/roulette/new">
            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-6">
              <Plus className="w-4 h-4 mr-2" />
              Crear Ruleta Ahora
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {roulettes.map((roulette) => (
            <RouletteCard key={roulette.id} roulette={roulette} />
          ))}
        </div>
      )}
    </div>
  );
}
