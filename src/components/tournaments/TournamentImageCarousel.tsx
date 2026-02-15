"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";

interface GameImage {
  name: string;
  image: string;
}

interface TournamentImageCarouselProps {
  images: GameImage[];
  fallbackImage?: string | null;
  alt: string;
  autoPlayMs?: number;
}

export default function TournamentImageCarousel({
  images,
  fallbackImage,
  alt,
  autoPlayMs = 4000,
}: TournamentImageCarouselProps) {
  // Build list of valid images
  const allImages = images
    .filter((g) => g.image)
    .map((g) => ({ src: g.image, label: g.name }));

  // If no game images, try fallback
  if (allImages.length === 0 && fallbackImage) {
    allImages.push({ src: fallbackImage, label: alt });
  }

  const [current, setCurrent] = useState(0);
  const hasMultiple = allImages.length > 1;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Auto-play
  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [hasMultiple, next, autoPlayMs]);

  if (allImages.length === 0) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <Trophy className="w-12 h-12 text-gray-600" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {allImages.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? "opacity-100" : "opacity-0"
            }`}
        >
          <Image
            src={img.src}
            alt={img.label || alt}
            fill
            className="object-cover"
          />
        </div>
      ))}

      {/* Arrow controls */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current
                    ? "bg-primary w-4"
                    : "bg-white/40 hover:bg-white/60"
                  }`}
                aria-label={`Imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
