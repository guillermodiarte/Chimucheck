"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface GamingSectionContent {
  title: string;
  description: string;
  card1: {
    title: string;
    description?: string;
    link: string;
    imageUrl: string;
    tag?: string;
  };
  card2: {
    title: string;
    description?: string;
    link: string;
    imageUrl: string;
    tag?: string;
  };
  ctaButton: {
    text: string;
    link: string;
    enabled: boolean;
  };
}

export default function GamingSection({ content }: { content?: GamingSectionContent | null }) {
  // Safe defaults - Targeted ChimuCoin Design (CS2/Valorant)
  const defaultData = {
    title: "¿TIENES LO QUE SE NECESITA?",
    description: "Participa en nuestros torneos y demuestra tu habilidad.",
    card1: {
      title: "CS2 Competitivo",
      description: "",
      link: "/torneos/cs2",
      imageUrl: "/images/chimucoin/game-1.jpg",
      tag: "FPS"
    },
    card2: {
      title: "Valorant Cups",
      description: "",
      link: "/torneos/valorant",
      imageUrl: "/images/chimucoin/game-2.jpg",
      tag: "TACTICAL"
    },
    ctaButton: {
      text: "INSCRIBIRSE AL TORNEO",
      link: "/registro",
      enabled: true
    }
  };

  // Deep merge strategy: Use content values if they exist, otherwise default.
  // Specifically for images, if content.imageUrl is empty string "", we want default.
  // For text, if content.title is present (even if empty, but here we expect user text), use it.

  const mergedCard1 = {
    ...defaultData.card1,
    ...(content?.card1 || {}),
    imageUrl: content?.card1?.imageUrl || defaultData.card1.imageUrl // Fallback on empty string
  };

  const mergedCard2 = {
    ...defaultData.card2,
    ...(content?.card2 || {}),
    imageUrl: content?.card2?.imageUrl || defaultData.card2.imageUrl
  };

  const mergedCta = {
    ...defaultData.ctaButton,
    ...(content?.ctaButton || {})
  };

  const data = {
    title: content?.title || defaultData.title,
    description: content?.description || defaultData.description,
    card1: mergedCard1,
    card2: mergedCard2,
    ctaButton: mergedCta
  };

  return (
    <section className="py-20 bg-black" data-version="v2-merged">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gray-900/50 p-8 md:p-12">
          {/* Background Pattern - Use fallback to ensure image always shows */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url('${data.card1.imageUrl}')` }}
          />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black text-white mb-8 uppercase"
            >
              {data.title}
            </motion.h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Card 1 */}
              <Link href={data.card1.link} className="block group w-full">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.1)] group">
                  <Image
                    src={data.card1.imageUrl}
                    alt={data.card1.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                    <h4 className="text-2xl font-bold text-white text-left">{data.card1.title}</h4>
                  </div>
                </div>
              </Link>

              {/* Card 2 */}
              <Link href={data.card2.link} className="block group w-full">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-secondary/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] group">
                  <Image
                    src={data.card2.imageUrl}
                    alt={data.card2.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                    <h4 className="text-2xl font-bold text-white text-left">{data.card2.title}</h4>
                  </div>
                </div>
              </Link>
            </div>

            {/* CTA Button */}
            {data.ctaButton?.enabled && (
              <Link
                href={data.ctaButton.link}
                className="inline-block px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:bg-primary hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {data.ctaButton.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
