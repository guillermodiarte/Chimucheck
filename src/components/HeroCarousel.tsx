"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  active: boolean;
  order: number;
}

interface HeroCarouselProps {
  slides: Banner[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  // If no slides, allow infinite loading or fallback
  if (!slides || slides.length === 0) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">No banners available</div>;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000); // 8 seconds per slide
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {slides[current].imageUrl.endsWith(".mp4") || slides[current].imageUrl.endsWith(".webm") ? (
            <video
              src={slides[current].imageUrl}
              autoPlay
              muted
              loop
              playsInline
              className="object-cover w-full h-full opacity-60"
            />
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={slides[current].imageUrl}
                alt={slides[current].title}
                fill
                className="object-cover opacity-60"
                priority
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
        <motion.h1
          key={`title-${current}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary drop-shadow-[0_0_25px_rgba(0,240,255,0.4)] mb-4 pb-2 leading-normal overflow-visible"
        >
          {slides[current].title}
        </motion.h1>
        {slides[current].subtitle && (
          <motion.p
            key={`sub-${current}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-3xl font-medium text-white tracking-widest uppercase border-b-2 border-primary pb-3"
          >
            {slides[current].subtitle}
          </motion.p>
        )}
      </div>

      {/* Navigation Buttons */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-primary transition-colors">
        <ChevronLeft size={48} />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-primary transition-colors">
        <ChevronRight size={48} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === current ? "bg-primary w-8" : "bg-white/30 hover:bg-white"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
