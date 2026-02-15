
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
    <div>
      <TournamentForm tournament={tournament} />
    </div>
  );
}
