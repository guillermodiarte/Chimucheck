"use client";

import { useState } from "react";
import { updateRequestStatus, deleteRegistration } from "@/app/actions/requests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Clock, Loader2, RefreshCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface RejectedTableProps {
  initialRequests: any[];
}

export function RejectedTable({ initialRequests: requests }: RejectedTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, actionName: "APPROVED" | "PENDING" | "DELETE") => {
    setProcessingId(id);
    try {
      let result;

      if (actionName === "DELETE") {
        result = await deleteRegistration(id);
      } else {
        result = await updateRequestStatus(id, actionName);
      }

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return null; // Don't show anything if there are no rejected requests
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <XCircle className="w-6 h-6 text-red-500" />
        Solicitudes Rechazadas
      </h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-zinc-800/50 text-gray-400 border-b border-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Jugador</th>
                <th scope="col" className="px-6 py-4 font-semibold">Torneo</th>
                <th scope="col" className="px-6 py-4 font-semibold">Fecha de Rechazo</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-zinc-700 opacity-50">
                        <AvatarImage src={request.player.image || ""} />
                        <AvatarFallback className="bg-zinc-800 text-white">
                          {(request.player.alias || request.player.name || "?").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-gray-300 line-through decoration-red-500/50">
                          {request.player.alias || request.player.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {request.player.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/tournaments`}
                      className="font-medium text-gray-500 hover:text-blue-400 hover:underline flex flex-col"
                    >
                      <span className="font-bold">{request.tournament.name}</span>
                      <span className="text-xs text-gray-600">
                        {format(new Date(request.tournament.date), "dd/MM/yy")}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-4 h-4" />
                      {format(new Date(request.registeredAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleAction(request.id, "DELETE")}
                        disabled={processingId !== null}
                        variant="ghost"
                        size="icon"
                        title="Eliminar registro"
                        className="text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                      >
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>

                      <Button
                        onClick={() => handleAction(request.id, "PENDING")}
                        disabled={processingId !== null}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/20 border border-transparent hover:border-yellow-900/50"
                      >
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1.5" />}
                        Revisar
                      </Button>

                      <Button
                        onClick={() => handleAction(request.id, "APPROVED")}
                        disabled={processingId !== null}
                        size="sm"
                        className="bg-green-900/20 text-green-600 hover:bg-green-900/40 hover:text-green-400 border border-green-900/30"
                      >
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                        Aprobar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
