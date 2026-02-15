
import TournamentForm from "@/components/admin/TournamentForm";
import { getTournamentById } from "@/app/actions/tournaments";
import { notFound } from "next/navigation";

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Editar Torneo</h2>
      </div>
      <TournamentForm tournament={tournament} />
    </div>
  );
}
