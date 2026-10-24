import { getRaffles, getRecentRaffleWinners } from "@/app/actions/raffles";
import { getGlobalSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Ticket } from "lucide-react";
import { RaffleListClient } from "@/components/admin/raffles/RaffleListClient";
import { RecentWinnersList } from "@/components/admin/raffles/RecentWinnersList";

export default async function AdminRafflesPage() {
  const [raffles, settings] = await Promise.all([
    getRaffles(),
    getGlobalSettings(),
  ]);

  const cooldownDays = (settings as any)?.raffleWinnerCooldownDays ?? 7;
  const recentWinners = await getRecentRaffleWinners(cooldownDays);

  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto">
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

      {/* Lista de últimos ganadores con margen configurable */}
      <RecentWinnersList
        initialWinners={recentWinners}
        initialDays={cooldownDays}
      />
    </div>
  );
}
