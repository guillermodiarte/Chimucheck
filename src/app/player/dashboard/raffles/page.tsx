import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getPlayerRaffles } from "@/app/actions/raffles";
import { PlayerRafflesClient } from "@/components/player/raffles/PlayerRafflesClient";
import { Sparkles, Ticket } from "lucide-react";

export default async function PlayerDashboardRafflesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/player/login");
  }

  const raffles = await getPlayerRaffles(session.user.id);

  return (
    <div className="relative min-h-[calc(100vh-80px)] pt-8 pb-16 px-4 md:px-8">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-yellow-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Comunidad ChimuCheck
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.3)]">
            Sorteos y <span className="text-secondary">Recompensas</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg drop-shadow-md">
            Participa en los sorteos oficiales de ChimuCheck. Inscríbete con un solo clic y sigue los sorteos en vivo para ganar periféricos, Chimucoins y premios exclusivos.
          </p>
        </div>

        {/* Client Interactive Component */}
        <PlayerRafflesClient
          initialRaffles={raffles as any}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
