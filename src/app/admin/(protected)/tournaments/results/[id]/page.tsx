import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResultsEditor } from "@/components/admin/ResultsEditor";

interface TournamentResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TournamentResultsPage({ params }: TournamentResultsPageProps) {
  const resolvedParams = await params;
  const tournament = await db.tournament.findUnique({
    where: { id: resolvedParams.id },
    include: {
      registrations: {
        include: {
          player: true,
        },
        orderBy: {
          score: 'desc'
        }
      },
    },
  });

  if (!tournament) return notFound();

  // Re-sort registrations by score desc
  const sortedRegistrations = [...tournament.registrations].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/tournaments">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Resultados: {tournament.name}</h1>
          <p className="text-gray-400">Gestiona los puntajes y ChimuCoins de los jugadores.</p>
        </div>
      </div>

      <ResultsEditor
        tournament={JSON.parse(JSON.stringify(tournament))}
        sortedRegistrations={JSON.parse(JSON.stringify(sortedRegistrations))}
      />
    </div>
  );
}
