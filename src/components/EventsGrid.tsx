"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Event } from "@prisma/client";

interface EventsGridProps {
  events: Event[];
}

export default function EventsGrid({ events }: EventsGridProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  if (events.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col md:flex-row bg-black rounded-xl border border-gray-800 overflow-hidden hover:border-secondary/50 transition-colors">
            {/* Image Container - Clickable */}
            <div
              className="w-full md:w-1/3 relative h-48 md:h-auto cursor-pointer group"
              onClick={() => setSelectedEvent(event)}
            >
              {event.imageUrl ? (
                <>
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm transition-opacity">
                      Ver Imagen
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">Sin Imagen</div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col justify-center flex-1">
              {event.date && (
                <div className="text-secondary font-bold mb-1 uppercase tracking-wider text-sm">
                  {new Date(event.date).toLocaleString("es-ES")}
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2 text-white">{event.name}</h3>
              <p className="text-gray-400 mb-4">{event.description}</p>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  📍 {event.location}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Imagen: {selectedEvent?.name}</DialogTitle>
          {selectedEvent?.imageUrl && (
            <img
              src={selectedEvent.imageUrl}
              alt={selectedEvent.name}
              className="max-w-full max-h-[85vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
