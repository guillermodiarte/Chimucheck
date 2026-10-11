"use client";

import { Heart, LogIn, Loader2 } from "lucide-react";

interface VoteButtonProps {
  entryId: string;
  voteCount: number;
  hasVoted: boolean;
  onVote: () => void;
  isLoggedIn: boolean;
  isActive: boolean;
  isPending?: boolean;
}

export function VoteButton({
  voteCount,
  hasVoted,
  onVote,
  isLoggedIn,
  isActive,
  isPending = false,
}: VoteButtonProps) {
  function handleOpenLogin() {
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  }

  if (!isActive) {
    // Show static vote count when contest is finished
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
        <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
        <span className="text-white text-sm font-bold">{voteCount}</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleOpenLogin}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-gray-300 hover:border-primary/50 hover:text-primary transition-all duration-200 text-xs font-bold group cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Iniciar sesión para votar</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onVote}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 select-none ${
        hasVoted
          ? "bg-red-500/20 border border-red-500/60 text-red-400 hover:bg-red-500/30"
          : "bg-black/40 border border-white/20 text-gray-300 hover:border-red-400/60 hover:text-red-400"
      } ${isPending ? "opacity-60 cursor-not-allowed" : "active:scale-95 cursor-pointer"}`}
      aria-label={hasVoted ? "Quitar voto" : "Votar por esta imagen"}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
      ) : (
        <Heart
          className={`w-4 h-4 transition-all duration-300 ${
            hasVoted ? "fill-red-400 scale-110" : ""
          }`}
        />
      )}
      <span>{voteCount}</span>
      {hasVoted && <span className="text-xs opacity-70">votado</span>}
    </button>
  );
}
