"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

interface GamingCard {
  id: string;
  title: string;
  description?: string;
  link: string;
  imageUrl: string;
}

interface GamingSectionContent {
  title: string;
  description: string;
  cards?: GamingCard[];
  card1?: any; // Legacy
  card2?: any; // Legacy
  ctaButton: {
    text: string;
    link: string;
    enabled: boolean;
  };
}

export default function GamingSection({ content }: { content?: GamingSectionContent | null }) {
  // Safe defaults
  const defaultData: GamingSectionContent = {
    title: "¿TIENES LO QUE SE NECESITA?",
    description: "Participa en nuestros torneos y demuestra tu habilidad.",
    cards: [
      {
        id: "1",
        title: "CS2 Competitivo",
        description: "",
        link: "/torneos/cs2",
        imageUrl: "/images/chimucoin/game-1.jpg",
      },
      {
        id: "2",
        title: "Valorant Cups",
        description: "",
        link: "/torneos/valorant",
        imageUrl: "/images/chimucoin/game-2.jpg",
      }
    ],
    ctaButton: {
      text: "INSCRIBIRSE AL TORNEO",
      link: "/registro",
      enabled: true
    }
  };

  // Resolve Title & Description
  const title = content?.title || defaultData.title;

  // Resolve CTA
  const ctaButton = {
    ...defaultData.ctaButton,
    ...(content?.ctaButton || {})
  };

  // Resolve Cards (Migration Strategy)
  let cards: GamingCard[] = [];
  if (content?.cards && Array.isArray(content.cards) && content.cards.length > 0) {
    cards = content.cards;
  } else if (content?.card1 || content?.card2) {
    if (content.card1) cards.push({ ...content.card1, id: "legacy-1" });
    if (content.card2) cards.push({ ...content.card2, id: "legacy-2" });
  } else {
    // Both missing (e.g. initial launch)
    cards = defaultData.cards!;
  }

  // Calculate dynamic grid classes
  const getGridClass = (length: number) => {
    switch (length) {
      case 1: return "justify-center";
      case 2: return "justify-center";
      case 3: return "justify-center";
      case 4: return "justify-center";
      default: return "justify-center";
    }
  };

  return (
    <section className="py-20 bg-black">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gray-900/50 p-8 md:p-12">
          {/* Background Pattern - Use fallback to ensure image always shows */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url('${cards[0]?.imageUrl || ""}')` }}
          />

          <div className="relative z-10 text-center max-w-[1200px] mx-auto">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black text-white mb-12 uppercase"
            >
              {title}
            </motion.h3>

            <div className={`flex flex-wrap gap-6 mb-12 ${getGridClass(cards.length)}`}>
              {cards.map((card, index) => (
                <Link key={card.id} href={card.link} className="block group" style={{ width: 'calc(20% - 1.2rem)', minWidth: '140px' }}>
                  <div className={`relative aspect-video rounded-xl overflow-hidden border shadow-[0_0_20px_rgba(255,255,255,0.05)] group ${index % 2 === 0 ? 'border-primary/30 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'border-secondary/30 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]'
                    }`}>
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                      <h4 className="text-xl md:text-2xl font-bold text-white text-left drop-shadow-md">{card.title}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            {ctaButton.enabled && (
              <Link
                href={ctaButton.link}
                className="inline-block px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:bg-primary hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {ctaButton.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
