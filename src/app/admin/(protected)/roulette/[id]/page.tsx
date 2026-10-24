import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRouletteById } from "@/app/actions/roulette";
import { InteractiveWheel } from "@/components/admin/roulette/InteractiveWheel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getRouletteById(id);
  if (!result.success || !result.roulette) {
    return { title: "Ruleta no encontrada | Chimuchek" };
  }
  return {
    title: `${result.roulette.title} | Ruleta en Vivo | Chimuchek`,
  };
}

export default async function RouletteLivePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getRouletteById(id);

  if (!result.success || !result.roulette) {
    notFound();
  }

  const { roulette, games = [] } = result;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <Link
            href="/admin/roulette"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Ruletas
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
              <Sparkles className="w-5 h-5" />
            </span>
            {roulette.title}
          </h1>
          {roulette.description && (
            <p className="text-sm text-gray-400 max-w-2xl">{roulette.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/admin/roulette/${roulette.id}/edit`}>
            <Button
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600 font-bold"
            >
              <Edit3 className="w-4 h-4 mr-2 text-purple-400" />
              Editar Juegos / Config
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Wheel Stage */}
      <div className="w-full">
        <InteractiveWheel
          games={games as any}
          spinDuration={roulette.spinDuration}
          title={roulette.title}
        />
      </div>
    </div>
  );
}
