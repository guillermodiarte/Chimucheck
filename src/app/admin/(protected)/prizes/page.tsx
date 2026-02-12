import { getPrizes } from "@/app/actions/prizes";
import PrizesListManager from "@/components/admin/prizes/PrizesListManager";

export default async function AdminPrizesPage() {
  const prizes = await getPrizes();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Administrar Premios</h1>
        <p className="text-gray-400">Gestiona el catálogo de premios.</p>
      </div>
      <PrizesListManager initialPrizes={prizes} />
    </div>
  );
}
