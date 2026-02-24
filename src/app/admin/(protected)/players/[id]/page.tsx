import { db } from "@/lib/prisma";
import { PlayerForm } from "@/components/admin/PlayerForm";
import { notFound } from "next/navigation";

interface EditPlayerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const resolvedParams = await params;
  const player = await db.player.findUnique({
    where: { id: resolvedParams.id },
    include: { stats: true },
  });

  if (!player) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">Editar Jugador</h1>
          <p className="text-gray-400">Modifica los detalles del jugador.</p>
        </div>

        <PlayerForm initialData={player} />
      </div>
    </div>
  );
}
