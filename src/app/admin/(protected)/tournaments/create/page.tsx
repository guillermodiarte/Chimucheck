
import TournamentForm from "@/components/admin/TournamentForm";

export default function CreateTournamentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Nuevo Torneo</h2>
      </div>
      <TournamentForm />
    </div>
  );
}
