"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Wallet, Swords, Award } from "lucide-react";

interface ChimuCoinData {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  card1Title?: string;
  card1Subtitle?: string;
  card2Title?: string;
  card2Subtitle?: string;
  imageUrl?: string;
}

export default function ChimuCoinSection({ data }: { data?: ChimuCoinData | null }) {
  const badge = data?.badge || "Moneda Oficial";
  const title = data?.title || "DESCUBRE LAS";
  const titleHighlight = data?.titleHighlight || "CHIMUCOINS";
  const description = data?.description || "La moneda que mueve nuestra economía. Participa en la comunidad, gana torneos y canjea tus monedas por premios reales. No es crypto, es pura diversión.";
  const card1Title = data?.card1Title || "Gana Jugando";
  const card1Subtitle = data?.card1Subtitle || "Torneos semanales";
  const card2Title = data?.card2Title || "Gana Viendo";
  const card2Subtitle = data?.card2Subtitle || "Drops en streams";
  const imageUrl = data?.imageUrl || "/images/chimucoin/main.jpg";

  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[150px]" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ChimuCoins Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 text-secondary mb-6">
              <Wallet className="w-8 h-8" />
              <span className="font-bold tracking-widest uppercase">{badge}</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-8">
              {title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-yellow-200 to-yellow-600">
                {titleHighlight}
              </span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="bg-secondary/20 p-3 rounded-lg">
                  <Swords className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{card1Title}</h4>
                  <p className="text-sm text-gray-400">{card1Subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="bg-primary/20 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{card2Title}</h4>
                  <p className="text-sm text-gray-400">{card2Subtitle}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-square w-full max-w-md mx-auto">
              <div className="absolute inset-0 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
              <Image
                src={imageUrl}
                alt={titleHighlight}
                fill
                className="object-contain drop-shadow-[0_0_50px_rgba(255,215,0,0.3)] z-10"
              />
            </div>
          </motion.div>
        </div>



      </div>
    </section>
  );
}
