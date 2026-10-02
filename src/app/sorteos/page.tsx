import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getPlayerRaffles } from "@/app/actions/raffles";
import { Ticket, Gift, Sparkles, Trophy, Users, Calendar } from "lucide-react";
import { PublicSorteosList } from "@/components/raffles/PublicSorteosList";

export default async function PublicSorteosPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/player/dashboard/raffles");
  }

  const raffles = await getPlayerRaffles();

  return (
    <div className="relative min-h-screen pt-48 pb-16 px-4 md:px-8">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-yellow-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-16 animate-in fade-in duration-500">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Sorteos Oficiales ChimuCheck
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
            Sorteos y <span className="text-primary">Premios</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg drop-shadow-md">
            Participa por premios increíbles, hardware gaming y Chimucoins. Inicia sesión en tu cuenta para inscribirte en los sorteos abiertos.
          </p>
        </div>

        <PublicSorteosList initialRaffles={raffles as any} />
      </div>
    </div>
  );
}
