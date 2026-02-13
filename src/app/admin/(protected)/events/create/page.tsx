import { EventForm } from "@/components/admin/EventForm";

export default function CreateEventPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Evento</h1>
          <p className="text-gray-400">Programa un nuevo evento en la agenda.</p>
        </div>

        <EventForm />
      </div>
    </div>
  );
}
