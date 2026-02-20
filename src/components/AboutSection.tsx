"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, User } from "lucide-react";
import { useEffect } from "react";

interface AboutData {
  title?: string;
  bio?: string;
  location?: string;
  role?: string;
  headlinePart1?: string;
  headlinePart2?: string;
  imageUrl?: string;
  image?: string;
  stats?: {
    followers?: string;
    followersLabel?: string;
    tournaments?: string;
    tournamentsLabel?: string;
    uptime?: string;
    uptimeLabel?: string;
  };
}

export default function AboutSection({ initialData }: { initialData: any }) {
  const data: AboutData = initialData || {};

  useEffect(() => {
    // Force scroll to top on mount
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, []);

  return (
    <section className="pb-24 pt-0 bg-black relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={data.imageUrl || data.image || "/images/about/dario.jpg"}
                alt={data.title || "Dario Ruiz"}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

              <div className="absolute bottom-8 left-8 right-8">
                <h3 className="text-4xl font-black text-white mb-2">{data.title?.toUpperCase() || "DARIO RUIZ"}</h3>
                <div className="flex items-center gap-2 text-primary">
                  <MapPin size={18} />
                  <span className="font-bold tracking-wider">{data.location?.toUpperCase() || "CÓRDOBA, ARGENTINA"}</span>
                </div>
              </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-gray-400 mb-8">
              <User size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">{data.role || "Creador & Fundador"}</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
              {data.headlinePart1 || "PASIÓN POR"} <br /> <span className="text-primary">{data.headlinePart2 || "EL GAMING"}</span>
            </h2>

            <div className="space-y-6 text-lg text-gray-300 leading-relaxed font-light">
              <p className="whitespace-pre-wrap">
                {data.bio || "Desde el corazón de Argentina, ChimuCheck nació con una misión simple: conectar a los jugadores."}
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex gap-12">
              <div>
                <span className="block text-4xl font-black text-white">{data.stats?.followers || "10K+"}</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">{data.stats?.followersLabel || "SEGUIDORES"}</span>
              </div>
              <div>
                <span className="block text-4xl font-black text-white">{data.stats?.tournaments || "50+"}</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">{data.stats?.tournamentsLabel || "TORNEOS"}</span>
              </div>
              <div>
                <span className="block text-4xl font-black text-white">{data.stats?.uptime || "24/7"}</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">{data.stats?.uptimeLabel || "DIVERSIÓN"}</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
