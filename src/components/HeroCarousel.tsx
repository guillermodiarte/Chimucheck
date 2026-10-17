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
}

export default function HeroCarousel({
  slides = [],
  topPlayers = [],
  showTopPlayers = false,
  topPlayersOrder = 2,
  unifiedSlides,
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

  // Auto-advance timer (pauses when hovering)
  useEffect(() => {
    if (allSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % allSlides.length);
    }, 8500); // 8.5 seconds per slide

    return () => clearInterval(timer);
  }, [allSlides.length, isPaused]);

  if (!allSlides || allSlides.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        No banners available
      </div>
    );
  }

  const nextSlide = () => setCurrent((prev) => (prev + 1) % allSlides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + allSlides.length) % allSlides.length);

  const activeSlide = allSlides[current] || allSlides[0];

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        {activeSlide.type === "top_players" ? (
          <motion.div
            key="top_players_slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <TopPlayersBannerSlide players={activeSlide.players} />
          </motion.div>
        ) : (
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {activeSlide.imageUrl.endsWith(".mp4") || activeSlide.imageUrl.endsWith(".webm") ? (
              <video
                src={activeSlide.imageUrl}
                autoPlay
                muted
                loop
                playsInline
                className="object-cover w-full h-full opacity-60"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={activeSlide.imageUrl}
                  alt={activeSlide.title}
                  fill
                  className="object-cover opacity-60"
                  priority
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

            {/* Banner Titles and CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
              <motion.h1
                key={`title-${activeSlide.id}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary drop-shadow-[0_0_25px_rgba(0,240,255,0.4)] mb-4 pb-2 leading-normal overflow-visible uppercase"
              >
                {activeSlide.title}
              </motion.h1>
              {activeSlide.subtitle && (
                <motion.p
                  key={`sub-${activeSlide.id}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-xl md:text-3xl font-medium text-white tracking-widest uppercase border-b-2 border-primary pb-3 mb-6"
                >
                  {activeSlide.subtitle}
                </motion.p>
              )}
              {activeSlide.link && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <Link
                    href={activeSlide.link}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-black uppercase tracking-wider hover:bg-yellow-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                  >
                    Ver Más
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Diapositiva anterior"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-primary hover:scale-110 transition-all cursor-pointer drop-shadow-lg"
          >
            <ChevronLeft size={44} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Siguiente diapositiva"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-primary hover:scale-110 transition-all cursor-pointer drop-shadow-lg"
          >
            <ChevronRight size={44} />
          </button>
        </>
      )}

      {/* Indicators */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 z-30 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
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
