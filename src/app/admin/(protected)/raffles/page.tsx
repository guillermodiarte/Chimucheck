import { getRaffles } from "@/app/actions/raffles";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Ticket } from "lucide-react";
import { RaffleListClient } from "@/components/admin/raffles/RaffleListClient";

export default async function AdminRafflesPage() {
  const raffles = await getRaffles();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-secondary" />
            Sorteos
          </h1>
          <p className="text-gray-400 mt-1">
            Gestioná sorteos abiertos y manuales para tus jugadores.
          </p>
        </div>
        <Link href="/admin/raffles/new">
          <Button className="bg-secondary text-black hover:bg-yellow-400 gap-2 font-bold">
            <Plus className="w-4 h-4" />
            Nuevo Sorteo
          </Button>
        </Link>
      </div>

      <RaffleListClient initialRaffles={raffles as any} />
    </div>
  );
}
