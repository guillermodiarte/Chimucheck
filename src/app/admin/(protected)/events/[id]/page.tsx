import { db } from "@/lib/prisma";
import { EventForm } from "@/components/admin/EventForm";
import { notFound } from "next/navigation";

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const resolvedParams = await params;
  const eventItem = await db.event.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!eventItem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">Editar Evento</h1>
          <p className="text-gray-400">Modifica los detalles del evento.</p>
        </div>

        <EventForm initialData={eventItem} />
      </div>
    </div>
  );
}
