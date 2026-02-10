"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Wallet, Swords, Award } from "lucide-react";

export default function ChimuCoinSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ChimuCoins Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 text-secondary mb-6">
              <Wallet className="w-8 h-8" />
              <span className="font-bold tracking-widest uppercase">Moneda Oficial</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-8">
              DESCUBRE LAS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-yellow-200 to-yellow-600">
                CHIMUCOINS
              </span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              La moneda que mueve nuestra economía. Participa en la comunidad, gana torneos y canjea tus monedas por premios reales. No es crypto, es <span className="font-bold text-white">pura diversión</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="bg-secondary/20 p-3 rounded-lg">
                  <Swords className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Gana Jugando</h4>
                  <p className="text-sm text-gray-400">Torneos semanales</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="bg-primary/20 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Gana Viendo</h4>
                  <p className="text-sm text-gray-400">Drops en streams</p>
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
                src="/images/chimucoin/main.jpg"
                alt="ChimuCoin"
                fill
                className="object-contain drop-shadow-[0_0_50px_rgba(255,215,0,0.3)] z-10"
              />
            </div>
          </motion.div>
        </div>

        {/* Gaming Competition Section */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gray-900/50 p-8 md:p-12">
          <div className="absolute inset-0 bg-[url('/images/chimucoin/game-1.jpg')] bg-cover bg-center opacity-10" />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black text-white mb-8"
            >
              ¿TIENES LO QUE SE NECESITA?
            </motion.h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.1)] group">
                <Image
                  src="/images/chimucoin/game-1.jpg"
                  alt="Competencia Gaming 1"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <h4 className="text-2xl font-bold text-white">CS2 Competitivo</h4>
                </div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-secondary/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] group">
                <Image
                  src="/images/chimucoin/game-2.jpg"
                  alt="Competencia Gaming 2"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <h4 className="text-2xl font-bold text-white">Valorant Cups</h4>
                </div>
              </div>
            </div>

            <a
              href="#"
              className="inline-block px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:bg-primary hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              INSCRIBIRSE AL TORNEO
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
