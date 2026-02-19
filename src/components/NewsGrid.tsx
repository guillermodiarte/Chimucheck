"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { News } from "@prisma/client";
import { ExternalLink } from "lucide-react";

interface NewsGridProps {
  news: News[];
}

export default function NewsGrid({ news }: NewsGridProps) {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  if (news.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-gray-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all hover:transform hover:-translate-y-2 group flex flex-col h-full"
          >
            {/* Image Container */}
            <div
              className={`aspect-video relative overflow-hidden ${item.imageUrl ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (item.imageUrl) setSelectedNews(item);
              }}
            >
              {item.imageUrl ? (
                <>
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm transition-opacity">
                      Ver Imagen
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                  Sin Imagen
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-grow">
                {item.content}
              </p>

              {(item as any).url && (
                <div className="mt-auto pt-4 border-t border-white/5">
                  <a
                    href={(item as any).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-sm font-bold uppercase tracking-wide"
                  >
                    Ver Más <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Imagen: {selectedNews?.title}</DialogTitle>
          {selectedNews?.imageUrl && (
            <img
              src={selectedNews.imageUrl}
              alt={selectedNews.title}
              className="max-w-full max-h-[85vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
