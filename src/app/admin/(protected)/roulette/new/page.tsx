import React from "react";
import { getGames } from "@/app/actions/games";
import { RouletteForm } from "@/components/admin/roulette/RouletteForm";

export const metadata = {
  title: "Nueva Ruleta de Juegos | Admin Chimuchek",
};

export default async function NewRoulettePage() {
  const result = await getGames();
  const allGames = result.success && result.games ? result.games : [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      <RouletteForm allGames={allGames} />
    </div>
  );
}
