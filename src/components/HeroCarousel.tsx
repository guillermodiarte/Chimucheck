"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import TopPlayersBannerSlide, { TopPlayerItem } from "@/components/TopPlayersBannerSlide";

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  active: boolean;
  order: number;
}

export type UnifiedSlide =
  | {
      type: "banner";
      id: string;
      title: string;
      subtitle: string | null;
      imageUrl: string;
      link: string | null;
    }
  | {
      type: "top_players";
      id: string;
      players: TopPlayerItem[];
    };

interface HeroCarouselProps {
  slides?: Banner[];
  topPlayers?: TopPlayerItem[];
  showTopPlayers?: boolean;
  topPlayersOrder?: number;
  unifiedSlides?: UnifiedSlide[];
  interval?: number;
}

export default function HeroCarousel({
  slides = [],
  topPlayers = [],
  showTopPlayers = false,
  topPlayersOrder = 2,
  unifiedSlides,
  interval = 5,
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Combine regular banners and Top Players slide ordered strictly by position
  const allSlides: UnifiedSlide[] = useMemo(() => {
    if (unifiedSlides && unifiedSlides.length > 0) {
      return unifiedSlides;
    }

    const list: (UnifiedSlide & { order: number })[] = slides.map((b) => ({
      type: "banner" as const,
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      link: b.link,
      order: b.order,
    }));

    if (showTopPlayers) {
      list.push({
        type: "top_players",
        id: "slide-top-players",
        players: topPlayers,
        order: topPlayersOrder,
      });
    }

    return list.sort((a, b) => a.order - b.order);
  }, [slides, topPlayers, showTopPlayers, topPlayersOrder, unifiedSlides]);

  // Handle case where slides become shorter or empty
  useEffect(() => {
    if (current >= allSlides.length && allSlides.length > 0) {
      setCurrent(0);
    }
  }, [allSlides.length, current]);

  // Auto-advance timer (resets on slide change; pauses on interaction)
  useEffect(() => {
    if (allSlides.length <= 1 || isPaused) return;

    const ms = Math.max(2, interval) * 1000;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % allSlides.length);
    }, ms);

    return () => clearInterval(timer);
  }, [allSlides.length, isPaused, interval, current]);

  if (!allSlides || allSlides.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        No banners available
      </div>
    );
  }

  const nextSlide = () => setCurrent((prev) => (prev + 1) % allSlides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + allSlides.length) % allSlides.length);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black select-none">
      {/* Persistent Layered Slides with GPU-accelerated smooth cross-fade */}
      {allSlides.map((slide, index) => {
        const isActive = index === current;
        const isTopPlayers = slide.type === "top_players";

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive
                ? "opacity-100 z-10 pointer-events-auto"
                : "opacity-0 z-0 pointer-events-none"
            }`}
            style={{ willChange: "opacity" }}
            aria-hidden={!isActive}
          >
            {isTopPlayers ? (
              <div
                className="w-full h-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <TopPlayersBannerSlide players={slide.players} />
              </div>
            ) : (
              <div className="relative w-full h-full">
                {slide.imageUrl.endsWith(".mp4") || slide.imageUrl.endsWith(".webm") ? (
                  <video
                    src={slide.imageUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="object-cover w-full h-full opacity-60"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      sizes="100vw"
                      className="object-cover opacity-60"
                      priority={index <= 1}
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />

                {/* Banner Titles and CTA */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4 pointer-events-none">
                  <h1
                    className={`text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary drop-shadow-[0_0_25px_rgba(0,240,255,0.4)] mb-4 pb-2 leading-normal uppercase transition-all duration-700 delay-150 transform ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                  >
                    {slide.title}
                  </h1>
                  {slide.subtitle && (
                    <p
                      className={`text-xl md:text-3xl font-medium text-white tracking-widest uppercase border-b-2 border-primary pb-3 mb-6 transition-all duration-700 delay-300 transform ${
                        isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.link && (
                    <div
                      className={`transition-all duration-700 delay-500 transform pointer-events-auto ${
                        isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                      }`}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                    >
                      <Link
                        href={slide.link}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-black uppercase tracking-wider hover:bg-yellow-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                      >
                        Ver Más
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation Buttons */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Diapositiva anterior"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-primary hover:scale-110 transition-all cursor-pointer drop-shadow-lg"
          >
            <ChevronLeft size={44} />
          </button>
          <button
            onClick={nextSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Siguiente diapositiva"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-primary hover:scale-110 transition-all cursor-pointer drop-shadow-lg"
          >
            <ChevronRight size={44} />
          </button>
        </>
      )}

      {/* Indicators */}
      {allSlides.length > 1 && (
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 z-30 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10"
        >
          {allSlides.map((slide, index) => {
            const isTopPlayersSlide = slide.type === "top_players";
            const isActive = index === current;

            return (
              <button
                key={slide.id || index}
                onClick={() => setCurrent(index)}
                aria-label={`Ir a diapositiva ${index + 1}`}
                className={`transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isActive
                    ? isTopPlayersSlide
                      ? "bg-amber-400 text-black px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                      : "bg-primary w-8 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                    : isTopPlayersSlide
                    ? "bg-amber-400/40 hover:bg-amber-400/80 w-2.5 h-2.5 rounded-full"
                    : "bg-white/30 hover:bg-white w-2.5 h-2.5 rounded-full"
                }`}
              >
                {isActive && isTopPlayersSlide && (
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    <span className="hidden sm:inline">TOP 5</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
