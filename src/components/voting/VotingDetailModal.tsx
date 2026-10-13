"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Instagram,
  User,
  ExternalLink,
  Users,
  Search,
  LogIn,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Voter {
  id: string;
  playerId: string;
  name: string | null;
  alias: string | null;
  image: string | null;
  createdAt: string;
}

export interface VotingDetailEntry {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  voteCount: number;
  hasVoted: boolean;
  voters?: Voter[];
}

interface VotingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: VotingDetailEntry | null;
  entries: VotingDetailEntry[];
  onSelectEntry: (entry: VotingDetailEntry) => void;
  onVote: (entry: VotingDetailEntry) => void;
  isLoggedIn: boolean;
  isActive: boolean;
  isPending?: boolean;
  currentUserId?: string;
}

function formatVoteTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "reciente";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "hace instantes";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays}d`;
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function VotingDetailModal({
  isOpen,
  onClose,
  entry,
  entries,
  onSelectEntry,
  onVote,
  isLoggedIn,
  isActive,
  isPending = false,
  currentUserId,
}: VotingDetailModalProps) {
  const [search, setSearch] = useState("");

  const currentIndex = useMemo(() => {
    if (!entry) return -1;
    return entries.findIndex((e) => e.id === entry.id);
  }, [entry, entries]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < entries.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectEntry(entries[currentIndex - 1]);
      setSearch("");
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectEntry(entries[currentIndex + 1]);
      setSearch("");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (hasPrev) {
          onSelectEntry(entries[currentIndex - 1]);
          setSearch("");
        }
      } else if (e.key === "ArrowRight") {
        if (hasNext) {
          onSelectEntry(entries[currentIndex + 1]);
          setSearch("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrev, hasNext, currentIndex, entries, onClose, onSelectEntry]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset search filter when switching entries
  useEffect(() => {
    setSearch("");
  }, [entry?.id]);

  const voters = entry?.voters || [];

  const filteredVoters = useMemo(() => {
    if (!search.trim()) return voters;
    const q = search.toLowerCase();
    return voters.filter((v) => {
      const alias = (v.alias || "").toLowerCase();
      const name = (v.name || "").toLowerCase();
      return alias.includes(q) || name.includes(q);
    });
  }, [voters, search]);

  if (!isOpen || !entry) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-6xl max-h-[94vh] md:max-h-[90vh] bg-zinc-950 border border-white/15 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.95)] z-10 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-zinc-900/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                Imagen {currentIndex + 1} de {entries.length}
              </span>
              {entry.hasVoted && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tu voto
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={entry.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir imagen original en nueva pestaña"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver original</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Main Content */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
            {/* Left Column: Image Viewer */}
            <div className="relative flex-1 bg-black/80 flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-[280px] sm:min-h-[380px] md:min-h-0 select-none group">
              {/* Image with natural aspect ratio and max height */}
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <img
                  src={entry.imageUrl}
                  alt={entry.authorName || "Imagen del concurso"}
                  className="max-h-[46vh] sm:max-h-[55vh] md:max-h-[74vh] w-auto max-w-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
                />
              </div>

              {/* Prev Navigation Button */}
              {hasPrev && (
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-xl backdrop-blur-xs hover:scale-105 active:scale-95 transition-all cursor-pointer opacity-90 hover:opacity-100 z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Navigation Button */}
              {hasNext && (
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Imagen siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-xl backdrop-blur-xs hover:scale-105 active:scale-95 transition-all cursor-pointer opacity-90 hover:opacity-100 z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Right Column: Author, Vote Action & Voter List */}
            <div className="w-full md:w-[380px] lg:w-[420px] bg-zinc-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-hidden min-h-0">
              {/* Author & Vote Action Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 space-y-4 shrink-0 bg-zinc-900/40">
                {/* Author Details */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black tracking-wider uppercase text-gray-400">
                    Autor de la foto
                  </span>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {entry.instagramAccount ? (
                      <a
                        href={`https://instagram.com/${entry.instagramAccount.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold text-base transition-colors"
                      >
                        <Instagram className="w-4 h-4 shrink-0" />
                        <span>@{entry.instagramAccount.replace("@", "")}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-300 font-semibold text-sm">
                        <User className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>{entry.authorName || "Autor desconocido"}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-black text-sm">
                      <Heart className="w-4 h-4 fill-red-400" />
                      <span>{entry.voteCount} votos</span>
                    </div>
                  </div>

                  {entry.instagramAccount && entry.authorName && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-500 shrink-0" />
                      <span>{entry.authorName}</span>
                    </p>
                  )}
                </div>

                {/* Voting Action Button */}
                {isActive ? (
                  !isLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                    >
                      <LogIn className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <span>Iniciá sesión para votar esta imagen</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onVote(entry)}
                      disabled={isPending}
                      className={`w-full py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg select-none disabled:opacity-60 disabled:cursor-not-allowed ${
                        entry.hasVoted
                          ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/60 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                          : "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:opacity-95 text-white active:scale-[0.98] shadow-[0_0_25px_rgba(244,63,94,0.3)]"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Actualizando voto...</span>
                        </>
                      ) : entry.hasVoted ? (
                        <>
                          <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                          <span>Tu voto está registrado (Clic para quitar)</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-white" />
                          <span>Votar por esta imagen</span>
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <span>🏆 Votación finalizada</span>
                  </div>
                )}
              </div>

              {/* Voters List Header */}
              <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                    Usuarios que votaron ({voters.length})
                  </span>
                </div>
              </div>

              {/* Voters Search Filter (if > 4 voters) */}
              {voters.length > 4 && (
                <div className="p-3 border-b border-white/10 shrink-0 bg-zinc-950">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por alias o nombre..."
                      className="w-full bg-zinc-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Voters Scrollable List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar min-h-0">
                {voters.length === 0 ? (
                  <div className="py-12 text-center space-y-2.5 px-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                      <Heart className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-300">
                      Aún no hay votos para esta imagen
                    </p>
                    {isActive ? (
                      <p className="text-xs text-gray-500">
                        ¡Sé el primero en darle tu voto y sumarle puntos!
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Esta imagen no recibió votos en este concurso.
                      </p>
                    )}
                  </div>
                ) : filteredVoters.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No se encontraron votantes que coincidan con &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filteredVoters.map((voter) => {
                    const isMe = currentUserId && voter.playerId === currentUserId;
                    const initial = (voter.alias || voter.name || "?")[0]?.toUpperCase() || "?";

                    return (
                      <div
                        key={voter.id}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                          isMe
                            ? "bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                            : "bg-white/[0.03] border-white/5 hover:border-white/10"
                        }`}
                      >
                        <Avatar className="w-9 h-9 border border-white/10 shrink-0">
                          <AvatarImage src={voter.image || ""} alt={voter.alias || "Usuario"} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-600/30 text-white font-bold text-xs">
                            {initial}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-white truncate">
                              {voter.alias || voter.name || "Usuario"}
                            </p>
                            {isMe && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-500/25 border border-red-500/40 text-red-400">
                                Tú
                              </span>
                            )}
                          </div>

                          {voter.alias && voter.name && voter.alias !== voter.name && (
                            <p className="text-[11px] text-gray-400 truncate">{voter.name}</p>
                          )}
                        </div>

                        {voter.createdAt && (
                          <span className="text-[11px] text-gray-500 font-mono shrink-0">
                            {formatVoteTime(voter.createdAt)}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
