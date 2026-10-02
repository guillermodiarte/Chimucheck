import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RaffleForm } from "@/components/admin/raffles/RaffleForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditRafflePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raffle = await db.raffle.findUnique({
    where: { id },
    include: {
      prizes: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!raffle) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/raffles/${id}`}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Detalle
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Editar Sorteo</h1>
        <p className="text-gray-400 mt-1">Modifica los detalles y configuración del sorteo.</p>
      </div>

      <RaffleForm initialData={raffle as any} />
    </div>
  );
}
