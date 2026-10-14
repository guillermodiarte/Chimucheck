"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown, Heart, AlertTriangle, X, Loader2, Instagram, User } from "lucide-react";
import Image from "next/image";

export interface VotingEntrySummary {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  voteCount: number;
}

interface SwitchVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previousEntry: VotingEntrySummary | null;
  newEntry: VotingEntrySummary | null;
  isSubmitting?: boolean;
}

export function SwitchVoteModal({
  isOpen,
  onClose,
  onConfirm,
  previousEntry,
  newEntry,
  isSubmitting = false,
}: SwitchVoteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && previousEntry && newEntry && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] z-10 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0 text-yellow-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                ¿Deseas cambiar tu voto?
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Solo puedes votar por 1 imagen en esta votación
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mb-6 bg-white/5 border border-white/10 rounded-xl p-3.5">
            Ya has votado previamente. Si continúas,{" "}
            <span className="text-red-400 font-semibold">se quitará tu voto anterior</span> y{" "}
            <span className="text-primary font-semibold">se asignará a la nueva imagen seleccionada</span>.
          </p>

          {/* Comparison Cards: Previous vs New */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6">
            {/* Previous Entry (Vote will be removed) */}
            <div className="w-full flex-1 bg-red-950/20 border border-red-500/30 rounded-2xl p-3 flex flex-col items-center text-center relative group">
              <span className="absolute -top-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-red-500/20 border border-red-500/40 text-red-400">
                Voto anterior (-1)
              </span>

              <div
                onContextMenu={(e) => e.preventDefault()}
                className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-xl overflow-hidden mt-2 mb-2 bg-black border border-white/10 shadow-md select-none"
              >
                <Image
                  src={previousEntry.imageUrl}
                  alt={previousEntry.authorName || "Imagen anterior"}
                  fill
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="object-cover pointer-events-none select-none"
                />
                <div className="absolute inset-0 bg-red-900/20" />
              </div>

              <div className="w-full truncate px-1">
                {previousEntry.instagramAccount ? (
                  <p className="text-pink-400 text-xs font-bold truncate flex items-center justify-center gap-1">
                    <Instagram size={12} className="shrink-0" />
                    <span className="truncate">{previousEntry.instagramAccount}</span>
                  </p>
                ) : previousEntry.authorName ? (
                  <p className="text-gray-300 text-xs font-medium truncate flex items-center justify-center gap-1">
                    <User size={12} className="shrink-0" />
                    <span className="truncate">{previousEntry.authorName}</span>
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs italic">Autor desconocido</p>
                )}
              </div>
            </div>

            {/* Transition Arrow */}
            <div className="shrink-0 text-yellow-400 p-1.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="hidden sm:inline">
                <ArrowRight size={20} />
              </span>
              <span className="sm:hidden">
                <ArrowDown size={20} />
              </span>
            </div>

            {/* New Entry (Vote will be assigned) */}
            <div className="w-full flex-1 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-3 flex flex-col items-center text-center relative group shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <span className="absolute -top-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/25 border border-emerald-500/50 text-emerald-400">
                Nuevo voto (+1)
              </span>

              <div
                onContextMenu={(e) => e.preventDefault()}
                className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-xl overflow-hidden mt-2 mb-2 bg-black border border-primary/40 shadow-md select-none"
              >
                <Image
                  src={newEntry.imageUrl}
                  alt={newEntry.authorName || "Nueva imagen"}
                  fill
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="object-cover pointer-events-none select-none"
                />
              </div>

              <div className="w-full truncate px-1">
                {newEntry.instagramAccount ? (
                  <p className="text-pink-400 text-xs font-bold truncate flex items-center justify-center gap-1">
                    <Instagram size={12} className="shrink-0" />
                    <span className="truncate">{newEntry.instagramAccount}</span>
                  </p>
                ) : newEntry.authorName ? (
                  <p className="text-gray-300 text-xs font-medium truncate flex items-center justify-center gap-1">
                    <User size={12} className="shrink-0" />
                    <span className="truncate">{newEntry.authorName}</span>
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs italic">Autor desconocido</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-yellow-400 text-black hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Cambiando voto...</span>
                </>
              ) : (
                <>
                  <Heart size={16} className="fill-black" />
                  <span>Cambiar mi voto</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
