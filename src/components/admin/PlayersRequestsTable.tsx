"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, Clock, Loader2, Trash2 } from "lucide-react";
import { updatePlayerRequestStatus, deletePlayerRequest } from "@/app/actions/requests";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PlayersRequestsTableProps {
  initialRequests: any[];
}

export function PlayersRequestsTable({ initialRequests: requests }: PlayersRequestsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (id: string, actionName: "APPROVED" | "REJECTED" | "PENDING" | "DELETE") => {
    setProcessingId(id);
    try {
      let result;
      if (actionName === "DELETE") {
        result = await deletePlayerRequest(id);
      } else {
        result = await updatePlayerRequestStatus(id, actionName);
      }

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud del jugador");
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Todo al día</h3>
        <p className="text-gray-400 max-w-sm">
          No hay solicitudes pendientes de aprobación en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#1f1f22]">
          <tr className="border-b border-zinc-800">
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alias / Nombre</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Teléfono</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {format(new Date(req.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-white">{req.alias || req.name || "Sin Nombre"}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {req.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {req.phone || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {req.registrationStatus === "PENDING" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    Pendiente
                  </span>
                ) : req.registrationStatus === "REJECTED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                    <X className="w-3.5 h-3.5" />
                    Rechazado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                    {req.registrationStatus}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex justify-end gap-2">
                  {req.registrationStatus === "REJECTED" ? (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "PENDING")}
                        disabled={processingId === req.id}
                        className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Mover a Pendiente"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Revisar</span>
                      </button>

                      <button
                        onClick={() => handleAction(req.id, "DELETE")}
                        disabled={processingId === req.id}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Eliminar Registro Permanentemente"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "REJECTED")}
                        disabled={processingId === req.id}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Rechazar"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleAction(req.id, "APPROVED")}
                        disabled={processingId === req.id}
                        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Aprobar"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
