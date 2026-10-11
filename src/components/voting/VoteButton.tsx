"use client";

import { useState, useTransition } from "react";
import { Heart, LogIn } from "lucide-react";
import { toast } from "sonner";

interface VoteButtonProps {
  contestId: string;
  entryId: string;
  initialVoteCount: number;
  initialHasVoted: boolean;
  isLoggedIn: boolean;
  isActive: boolean;
}

export function VoteButton({
  contestId,
  entryId,
  initialVoteCount,
  initialHasVoted,
  isLoggedIn,
  isActive,
}: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isPending, startTransition] = useTransition();

  function handleOpenLogin() {
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  }

  async function handleVote() {
    if (!isLoggedIn) {
      handleOpenLogin();
      return;
    }

    startTransition(async () => {
      // Optimistic update
      const newHasVoted = !hasVoted;
      setHasVoted(newHasVoted);
      setVoteCount((c) => (newHasVoted ? c + 1 : c - 1));

      try {
        const res = await fetch(`/api/voting/${contestId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId }),
        });

        if (!res.ok) {
          const data = await res.json();
          // Revert
          setHasVoted(!newHasVoted);
          setVoteCount((c) => (!newHasVoted ? c + 1 : c - 1));
          toast.error(data.error || "Error al votar");
          return;
        }

        const data = await res.json();
        // Sync with server response
        setHasVoted(data.voted);
      } catch {
        // Revert
        setHasVoted(!newHasVoted);
        setVoteCount((c) => (!newHasVoted ? c + 1 : c - 1));
        toast.error("Error de conexión");
      }
    });
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
        onClick={handleOpenLogin}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-gray-300 hover:border-primary/50 hover:text-primary transition-all duration-200 text-xs font-bold group"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Iniciar sesión para votar</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 select-none ${
        hasVoted
          ? "bg-red-500/20 border border-red-500/60 text-red-400 hover:bg-red-500/30"
          : "bg-black/40 border border-white/20 text-gray-300 hover:border-red-400/60 hover:text-red-400"
      } ${isPending ? "opacity-60 cursor-not-allowed" : "active:scale-95 cursor-pointer"}`}
      aria-label={hasVoted ? "Quitar voto" : "Votar por esta imagen"}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-300 ${
          hasVoted ? "fill-red-400 scale-110" : ""
        }`}
      />
      <span>{voteCount}</span>
      {hasVoted && <span className="text-xs opacity-70">votado</span>}
    </button>
  );
}
