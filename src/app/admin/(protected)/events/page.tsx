import { db } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Power } from "lucide-react";
import Link from "next/link";
import { deleteEvent, toggleEventStatus } from "@/app/actions/events";
import { SectionToggle } from "@/components/admin/SectionToggle";

export default async function EventsPage() {
  const events = await db.event.findMany({
    orderBy: { date: "asc" },
  });

  const section = await db.siteSection.findUnique({ where: { key: "events_section" } });
  const isEnabled = (section?.content as any)?.enabled ?? true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-gray-400">Gestiona la agenda de eventos.</p>
        </div>
        <div className="flex gap-3">
          <SectionToggle sectionKey="events_section" initialEnabled={isEnabled} label="Mostrar Secc." />
          <Link href="/admin/events/create">
            <Button className="bg-secondary text-black hover:bg-yellow-400 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Evento
            </Button>
          </Link>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-900">
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-300">Nombre</TableHead>
              <TableHead className="text-gray-300">Fecha</TableHead>
              <TableHead className="text-gray-300">Ubicación</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-black">
            {events.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No hay eventos programados.
                </TableCell>
              </TableRow>
            ) : (
              events.map((item: any) => (
                <TableRow key={item.id} className="border-gray-800 hover:bg-gray-900/50">
                  <TableCell className="font-medium text-white">{item.name}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(item.date).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-400">{item.location || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${item.active
                        ? "bg-green-900/30 text-green-400 border border-green-900"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleEventStatus.bind(null, item.id, item.active)}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title={item.active ? "Desactivar" : "Activar"}>
                          <Power className={`w-4 h-4 ${item.active ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      </form>
                      <Link href={`/admin/events/${item.id}`}>
                        <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </Button>
                      </Link>
                      <form action={deleteEvent.bind(null, item.id)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
