"use client";

import { motion } from "framer-motion";
import { Monitor, Youtube } from "lucide-react";

export default function GamingSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
            ZONA <span className="text-primary">GAMING</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Vive la acción en directo. Sigue nuestros streams y mejores jugadas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Twitch Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative rounded-2xl overflow-hidden border border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/20 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-600 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Twitch Live</h3>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl relative group-hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all">
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <p>Embed de Twitch aquí (Placeholder)</p>
                  {/* Aquí iría el iframe de Twitch real */}
                </div>
              </div>

              <a
                href="https://www.twitch.tv/ChimuCheck"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block w-full py-4 text-center bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                VER CANAL
              </a>
            </div>
          </motion.div>

          {/* YouTube Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative rounded-2xl overflow-hidden border border-red-500/30 bg-red-900/10 hover:bg-red-900/20 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-600 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">YouTube Highlights</h3>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl relative group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all">
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <p>Embed de YouTube aquí (Placeholder)</p>
                  {/* Aquí iría el iframe de YouTube real */}
                </div>
              </div>

              <a
                href="https://www.youtube.com/ChimuCheck"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block w-full py-4 text-center bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                SUSCRIBIRSE
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
