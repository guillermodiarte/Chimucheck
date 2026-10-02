import { db } from "@/lib/prisma";
import { RaffleForm } from "@/components/admin/raffles/RaffleForm";

export default async function NewRafflePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Nuevo Sorteo</h1>
        <p className="text-gray-400 mt-1">Creá un sorteo abierto o manual para tus jugadores.</p>
      </div>
      <RaffleForm />
    </div>
  );
}
