"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PointsTable from "@/components/tournament/PointsTable";
import { PodiumModal } from "@/components/tournament/PodiumModal";
import { formatDate } from "@/lib/utils";

interface LiveTournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LiveTournamentPage({ params }: LiveTournamentPageProps) {
  const [tournament, setTournament] = useState<any>(null);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [showPodium, setShowPodium] = useState(false);
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setUnwrappedParams);
  }, [params]);

  const fetchData = async () => {
    if (!unwrappedParams?.id) return;
    try {
      // We use a custom API route or server action wrapper if needed, 
      // but for now let's use the fetch pattern to get fresh data
      // Actually, since this is a client component now, we can't directly use Prisma.
      // We need a server action or API route to fetch data.
      // Let's create a server action for this specific fetch to ensure it's fresh.
      const res = await fetch(`/api/tournaments/${unwrappedParams.id}/live`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data);

        const ranking = data.registrations
          .map((reg: any) => ({
            playerId: reg.playerId,
            alias: reg.player.alias || "Anónimo",
            name: reg.player.name || "",
            image: reg.player.image,
            score: reg.score,
            position: 0,
          }))
          .sort((a: any, b: any) => b.score - a.score)
          .map((item: any, index: number) => ({ ...item, position: index + 1 }));

        setRankingData(ranking);

        if (data.status === "FINALIZADO" && !showPodium) {
          setShowPodium(true);
        }
      }
    } catch (error) {
      console.error("Error polling live data", error);
    }
  };

  useEffect(() => {
    if (unwrappedParams?.id) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [unwrappedParams]);

  if (!tournament) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/torneos">
              <Button variant="ghost" className="text-zinc-500 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </Link>
            <div className="h-12 w-[1px] bg-zinc-800"></div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/30 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                {tournament.image ? (
                  <Image src={tournament.image} alt={tournament.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-2xl text-zinc-600">
                    {tournament.name[0]}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                  {tournament.name}
                  {tournament.status === "EN_JUEGO" && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">EN VIVO</span>
                  )}
                  {tournament.status === "FINALIZADO" && (
                    <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">FINALIZADO</span>
                  )}
                </h1>
                <p className="text-zinc-400 font-mono text-sm">
                  {formatDate(tournament.date)} • {tournament.format || "General"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-primary block rounded-sm"></span>
              Tabla de Posiciones
            </h2>
            <PointsTable data={rankingData} />
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <h3 className="text-xl font-bold mb-4 text-zinc-300">Detalles</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Formato</span>
                  <span className="font-bold">{tournament.format || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Participantes</span>
                  <span className="font-bold">{tournament.registrations.length} / {tournament.maxPlayers}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Premio</span>
                  <span className="font-bold text-primary">{tournament.prizePool || "Honor"}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-black border border-primary/20 flex flex-col items-center text-center">
              <p className="text-primary font-bold uppercase tracking-widest text-xs mb-2">Líder Actual</p>
              <p className="text-2xl font-black text-white">
                {rankingData[0]?.alias || "Nadie"}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {tournament.status === "FINALIZADO" ? "Ganador del Torneo" : "Liderando la competencia"}
              </p>
            </div>
          </div>
        </main>

        <PodiumModal
          isOpen={showPodium}
          onClose={() => setShowPodium(false)}
          winners={rankingData.slice(0, 3)}
        />
      </div>
    </div>
  );
}
