"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, Gift, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Prize } from "@prisma/client";

interface PrizesViewProps {
  prizes: Prize[];
  config: any;
}

export default function PrizesView({ prizes, config }: PrizesViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ [key: string]: number }>({});

  const toggleImage = (prizeId: string, max: number) => {
    setSelectedImageIndex(prev => ({
      ...prev,
      [prizeId]: ((prev[prizeId] || 0) + 1) % max
    }));
  };

  // Default values fallback
  const headerTitle = config?.headerTitle || "PREMIOS EXCLUSIVOS";
  const headerSubtitle = config?.headerSubtitle || "Tu esfuerzo tiene recompensa. Canjea tus ChimuCoins por el mejor equipamiento.";
  const infoTitle = config?.infoTitle || "ACUMULA. GANA. RECLAMA.";
  const infoDescription = config?.infoDescription || "Cada torneo, cada victoria y cada participación te otorga ChimuCoins. Úsalas sabiamente para desbloquear premios físicos reales. No es solo un juego, es tu recompensa por ser el mejor.";
  const infoImage = config?.infoImage || "/images/prizes/premio-info-v2.jpg";
  const comboImage = config?.comboImage || "/images/prizes/premio-combo.jpg";
  const steps = config?.steps || [
    { title: "Paso 1", description: "Juega Torneos" },
    { title: "Paso 2", description: "Gana ChimuCoins" },
    { title: "Paso 3", description: "Elige tu Premio" },
    { title: "Paso 4", description: "Canjealos en el Torneo" }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-24">

        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center p-4 bg-secondary/10 rounded-full mb-6 ring-1 ring-secondary/50">
            <Trophy className="w-12 h-12 text-secondary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary mb-6">
            {headerTitle}
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            {headerSubtitle}
          </p>
        </motion.div>

        {/* Info Section - Similar to News */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Side - Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-square md:aspect-video lg:aspect-auto lg:h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-gray-900 group"
          >
            <Image
              src={infoImage}
              alt="Información de Canje"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-none whitespace-pre-line">
                {infoTitle}
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                {infoDescription}
              </p>
            </div>

            {/* Combo Image as support */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={comboImage}
                alt="Combo de Premios"
                fill
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {steps.map((step: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors">
                  <span className="block text-2xl font-bold text-primary mb-1">{step.title}</span>
                  <span className="text-sm text-gray-400">{step.description}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>


        {/* Prize Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {prizes.map((prize, index) => {
            // Safe parsing of images.
            // If seed used arrays, prisma returns them as object/array.
            // If manually input as string, we might need to handle that, but UI enforces array format usually or string.
            // In the DB it is Json. 
            let images: string[] = [];
            if (Array.isArray(prize.images)) {
              images = prize.images as string[];
            } else if (typeof prize.images === 'string') {
              // Try parse if it's a JSON string, otherwise array of 1
              try {
                const parsed = JSON.parse(prize.images);
                if (Array.isArray(parsed)) images = parsed;
                else images = [prize.images];
              } catch {
                images = [prize.images];
              }
            }

            return (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-gray-900 rounded-3xl border border-white/10 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col"
              >
                {/* Image Container */}
                <div className="aspect-square relative overflow-hidden bg-white/5">
                  {images.length > 0 && (
                    <Image
                      src={images[(selectedImageIndex[prize.id] || 0)]}
                      alt={prize.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}

                  {/* Image Navigation if multiple images */}
                  {images.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleImage(prize.id, images.length);
                      }}
                      className="absolute bottom-4 right-4 bg-black/80 backdrop-blur p-2 rounded-full text-white hover:bg-primary transition-colors z-10 border border-white/20"
                    >
                      <ArrowRight size={20} />
                      <span className="sr-only">Siguiente Imagen</span>
                    </button>
                  )}

                  {/* Price Tag */}
                  <div className="absolute top-4 left-4 bg-black/90 backdrop-blur border border-secondary text-secondary font-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Gift size={16} />
                    {prize.price}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-black text-white mb-2 uppercase italic">{prize.title}</h3>
                  <p className="text-gray-400 mb-6 flex-grow">{prize.description}</p>
                  <button className="w-full py-4 bg-white text-black font-black uppercase tracking-wider rounded-xl transition-all duration-300 hover:bg-primary hover:text-black hover:shadow-lg hover:scale-[1.02]">
                    Canjear Ahora
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
