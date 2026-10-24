"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Edit3, Trash2, Timer, Gamepad2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRoulette } from "@/app/actions/roulette";

interface GameInfo {
  id: string;
  name: string;
  categoryId: string;
  images?: string | null;
}

interface RouletteCardProps {
  roulette: {
    id: string;
    title: string;
    description: string | null;
    spinDuration: number;
    gameCount?: number;
    games?: any[];
    createdAt: Date;
  };
}

function getGameImage(imagesField?: string | null): string | null {
  if (!imagesField) return null;
  try {
    const parsed = JSON.parse(imagesField);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === "string") return parsed;
  } catch {
    if (imagesField.startsWith("http") || imagesField.startsWith("/")) return imagesField;
  }
  return null;
}

export function RouletteCard({ roulette }: RouletteCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteRoulette(roulette.id);
      setShowConfirm(false);
    });
  };

  const previewGames = (roulette.games || []).slice(0, 6);
  const remainingCount = Math.max(0, (roulette.gameCount || 0) - previewGames.length);

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl bg-gray-900/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 shadow-xl overflow-hidden backdrop-blur-md hover:shadow-2xl hover:shadow-purple-500/10">
      {/* Top Banner with Glow */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Ruleta de Juegos
            </div>
            <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors tracking-tight line-clamp-1 mt-2">
              {roulette.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-800/80 border border-white/10 text-gray-300 text-xs font-semibold shrink-0">
            <Timer className="w-3.5 h-3.5 text-pink-400" />
            {roulette.spinDuration}s
          </div>
        </div>

        {roulette.description && (
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {roulette.description}
          </p>
        )}

        {/* Game Avatars Preview */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
              Juegos incluidos
            </span>
            <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md">
              {roulette.gameCount || 0}
            </span>
          </div>

          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {previewGames.map((game, i) => {
              const img = getGameImage(game.images);
              return (
                <div
                  key={game.id + i}
                  title={game.name}
                  className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-900 bg-gray-800 shadow-md flex-shrink-0"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={game.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-black">
                      {game.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}

            {remainingCount > 0 && (
              <div className="relative w-10 h-10 rounded-xl bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-xs font-black text-gray-300 shadow-md">
                +{remainingCount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-gray-950/60 border-t border-white/10 flex items-center justify-between gap-2">
        {showConfirm ? (
          <div className="w-full flex items-center justify-between gap-2 p-1">
            <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> ¿Eliminar?
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="text-xs h-7 px-2.5 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
              >
                No
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs h-7 px-2.5 bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <Link href={`/admin/roulette/${roulette.id}/edit`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 border-white/10 text-xs font-bold"
                  title="Editar configuración y juegos"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  Editar
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirm(true)}
                className="h-9 w-9 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                title="Eliminar ruleta"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Link href={`/admin/roulette/${roulette.id}`} className="flex-1 max-w-[180px]">
              <Button
                size="sm"
                className="w-full h-9 bg-gradient-to-r from-purple-600 hover:from-purple-500 to-pink-600 hover:to-pink-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/20"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
                Jugar / En Vivo
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
