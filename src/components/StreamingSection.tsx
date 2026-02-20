"use client";

import { motion } from "framer-motion";
import { Tv, Youtube } from "lucide-react";

interface StreamingConfig {
  twitchId?: string;
  twitchEnabled?: boolean;
  youtubeId?: string;
  youtubeEnabled?: boolean;
}

export default function StreamingSection({ config }: { config: StreamingConfig | null }) {
  if (!config) return null;

  const showTwitch = config.twitchEnabled && config.twitchId;
  const showYoutube = config.youtubeEnabled && config.youtubeId;

  if (!showTwitch && !showYoutube) return null;

  const isSingle = (showTwitch && !showYoutube) || (!showTwitch && showYoutube);

  return (
    <section className="py-20 bg-black/95 relative overflow-hidden border-t border-b border-gray-900/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05)_0%,rgba(0,0,0,0)_100%)] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE AHORA
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Nuestras <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Transmisiones</span>
          </h2>
        </motion.div>

        <div className={`grid gap-8 ${isSingle ? "grid-cols-1 max-w-4xl mx-auto" : "grid-cols-1 lg:grid-cols-2"}`}>
          {/* Twitch */}
          {showTwitch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xl ml-2">
                <Tv className="w-6 h-6" />
                Twitch.tv/{config.twitchId}
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-gray-900">
                <iframe
                  src={`https://player.twitch.tv/?channel=${config.twitchId}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`}
                  frameBorder="0"
                  allowFullScreen
                  scrolling="no"
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </motion.div>
          )}

          {/* YouTube */}
          {showYoutube && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-red-500 font-bold text-xl ml-2">
                <Youtube className="w-6 h-6" />
                YouTube Live
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-gray-900">
                <iframe
                  src={`https://www.youtube.com/embed/${config.youtubeId}?autoplay=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
