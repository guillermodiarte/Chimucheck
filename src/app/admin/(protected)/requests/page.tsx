import { getPendingRequests, getRejectedRequests } from "@/app/actions/requests";
import { RequestsTable } from "@/components/admin/RequestsTable";
import { RejectedTable } from "@/components/admin/RejectedTable";
import { UserCheck } from "lucide-react";

export default async function RequestsPage() {
  const pendingRequests = await getPendingRequests();
  const rejectedRequests = await getRejectedRequests();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-primary" />
            Solicitudes Pendientes
          </h1>
          <p className="text-gray-400 mt-1">
            Gestiona las inscripciones a torneos restrictivos
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <RequestsTable initialRequests={pendingRequests} />
      </div>

      <RejectedTable initialRequests={rejectedRequests} />
    </div>
  );
}
