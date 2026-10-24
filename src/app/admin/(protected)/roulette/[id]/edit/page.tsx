import React from "react";
import { notFound } from "next/navigation";
import { getRouletteById } from "@/app/actions/roulette";
import { getGames } from "@/app/actions/games";
import { RouletteForm } from "@/components/admin/roulette/RouletteForm";

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
    title: `Editar ${result.roulette.title} | Admin Chimuchek`,
  };
}

export default async function EditRoulettePage({ params }: PageProps) {
  const { id } = await params;

  const [rouletteRes, gamesRes] = await Promise.all([
    getRouletteById(id),
    getGames(),
  ]);

  if (!rouletteRes.success || !rouletteRes.roulette) {
    notFound();
  }

  const { roulette } = rouletteRes;
  const allGames = gamesRes.success && gamesRes.games ? gamesRes.games : [];

  let gameIds: string[] = [];
  try {
    gameIds = JSON.parse(roulette.gameIds || "[]");
  } catch {
    gameIds = [];
  }

  const initialData = {
    id: roulette.id,
    title: roulette.title,
    description: roulette.description,
    spinDuration: roulette.spinDuration,
    gameIds,
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      <RouletteForm
        initialData={initialData}
        allGames={allGames}
        isEditing={true}
      />
    </div>
  );
}
