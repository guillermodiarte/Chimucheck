import GameForm from "@/components/admin/games/GameForm";
import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";

export default function CreateGamePage() {
  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto py-2">
      <Link
        href="/admin/games"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver a Juegos
      </Link>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Gamepad2 className="w-8 h-8 text-primary" />
          Agregar Nuevo Juego
        </h1>
        <p className="text-gray-400 text-sm">
          Añade un juego al catálogo para poder seleccionarlo al crear torneos.
        </p>
      </div>

      <GameForm />
    </div>
  );
}
