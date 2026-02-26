"use client";

import { useState } from "react";
import { updateRequestStatus } from "@/app/actions/requests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface RequestsTableProps {
  initialRequests: any[];
}

export function RequestsTable({ initialRequests: requests }: RequestsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const result = await updateRequestStatus(id, status);
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
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="text-xs uppercase bg-zinc-800/50 text-gray-400 border-b border-zinc-800">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold">Jugador</th>
            <th scope="col" className="px-6 py-4 font-semibold">Torneo</th>
            <th scope="col" className="px-6 py-4 font-semibold">Fecha de Solicitud</th>
            <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-zinc-700">
                    <AvatarImage src={request.player.image || ""} />
                    <AvatarFallback className="bg-zinc-800 text-white">
                      {(request.player.alias || request.player.name || "?").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-white">
                      {request.player.alias || request.player.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {request.player.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Link
                  href={`/admin/tournaments`}
                  className="font-medium text-blue-400 hover:underline flex flex-col"
                >
                  <span className="text-white font-bold">{request.tournament.name}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(request.tournament.date), "dd/MM/yy")}
                  </span>
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-4 h-4" />
                  {format(new Date(request.registeredAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => handleAction(request.id, "REJECTED")}
                    disabled={processingId !== null}
                    variant="destructive"
                    size="sm"
                    className="bg-red-900/40 text-red-500 hover:bg-red-900 hover:text-red-300 border border-red-900/50"
                  >
                    {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => handleAction(request.id, "APPROVED")}
                    disabled={processingId !== null}
                    size="sm"
                    className="bg-green-900/40 text-green-500 hover:bg-green-900 hover:text-green-300 border border-green-900/50"
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
  );
}
