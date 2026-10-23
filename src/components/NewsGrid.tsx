"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { News } from "@prisma/client";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface NewsGridProps {
  news: News[];
}

export default function NewsGrid({ news }: NewsGridProps) {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  // Responsive visible cards count: 1 on mobile, 2 on tablet, 3 on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisibleCount(3);
      } else if (window.innerWidth >= 768) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, news.length - visibleCount);

  // Keep index within bounds if window resized
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  const handleNext = useCallback(() => {
    if (news.length <= visibleCount) return;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [news.length, visibleCount, maxIndex]);

  const handlePrev = useCallback(() => {
    if (news.length <= visibleCount) return;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [news.length, visibleCount, maxIndex]);

  // Autoplay: advances slowly horizontally, pauses on hover, resumes on mouse leave
  useEffect(() => {
    if (news.length <= visibleCount || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4500);

    return () => clearInterval(interval);
  }, [news.length, visibleCount, isPaused, handleNext]);

  if (news.length === 0) return null;

  const showControls = news.length > visibleCount;

  return (
    <>
      <div
        className="relative group/carousel px-2 sm:px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation Buttons */}
        {showControls && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/80 border border-white/20 text-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 shadow-xl backdrop-blur-md active:scale-95 cursor-pointer"
              aria-label="Noticia anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={handleNext}
              type="button"
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/80 border border-white/20 text-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 shadow-xl backdrop-blur-md active:scale-95 cursor-pointer"
              aria-label="Siguiente noticia"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Carousel Window */}
        <div className="overflow-hidden -mx-3 sm:-mx-4 py-2">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            }}
          >
            {news.map((item) => (
              <div
                key={item.id}
                className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-3 sm:px-4 flex flex-col"
              >
                <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all hover:transform hover:-translate-y-2 group flex flex-col h-full">
                  {/* Image Container */}
                  <div
                    className={`aspect-square relative overflow-hidden bg-black flex items-center justify-center ${item.imageUrl ? "cursor-pointer" : ""}`}
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/70 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-md transition-opacity font-medium shadow-lg">
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
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicators */}
        {showControls && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? "w-8 bg-primary"
                    : "w-2 bg-white/20 hover:bg-white/50"
                }`}
                aria-label={`Ir a noticia ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-[95vw] max-w-[95vw] max-h-[95vh] w-auto h-auto p-2 overflow-hidden bg-black/90 border border-white/15 shadow-2xl flex items-center justify-center rounded-2xl"
        >
          <DialogTitle className="sr-only">Imagen: {selectedNews?.title}</DialogTitle>
          {selectedNews?.imageUrl && (
            <img
              src={selectedNews.imageUrl}
              alt={selectedNews.title}
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
