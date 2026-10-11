"use client";

import { useState, useEffect } from "react";
import { Instagram, User } from "lucide-react";
import { VoteButton } from "./VoteButton";
import { SwitchVoteModal } from "./SwitchVoteModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface Entry {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  voteCount: number;
  hasVoted: boolean;
}

interface VotingGalleryProps {
  contestId: string;
  entries: Entry[];
  isLoggedIn: boolean;
  isActive: boolean;
}

export function VotingGallery({
  contestId,
  entries: initialEntries,
  isLoggedIn,
  isActive,
}: VotingGalleryProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);

  // Keep state synced if props change
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Modal state for switching vote
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [modalPreviousEntry, setModalPreviousEntry] = useState<Entry | null>(null);
  const [modalNewEntry, setModalNewEntry] = useState<Entry | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 space-y-3">
        <div className="text-5xl">📷</div>
        <p className="text-lg font-semibold">Todavía no hay imágenes en este concurso</p>
        <p className="text-sm">El administrador pronto subirá las fotos de la comunidad.</p>
      </div>
    );
  }

  // Handle click on vote button
  const handleVoteClick = (targetEntry: Entry) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-login-modal"));
      return;
    }
    if (!isActive) return;

    // Check if player has an active vote in this contest
    const currentVotedEntry = entries.find((e) => e.hasVoted);

    // Case 1: Clicking the same entry that was already voted -> remove vote (toggle off)
    if (currentVotedEntry && currentVotedEntry.id === targetEntry.id) {
      executeVote(targetEntry.id, false, null);
      return;
    }

    // Case 2: User has already voted for a DIFFERENT entry -> OPEN MODAL!
    if (currentVotedEntry && currentVotedEntry.id !== targetEntry.id) {
      setModalPreviousEntry(currentVotedEntry);
      setModalNewEntry(targetEntry);
      setSwitchModalOpen(true);
      return;
    }

    // Case 3: User hasn't voted for any entry yet -> vote directly
    executeVote(targetEntry.id, true, null);
  };

  // Execute API call with optimistic update
  const executeVote = async (
    targetEntryId: string,
    isAddingVote: boolean,
    previousVotedId: string | null
  ) => {
    setPendingEntryId(targetEntryId);

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === targetEntryId) {
          return {
            ...e,
            hasVoted: isAddingVote,
            voteCount: isAddingVote ? e.voteCount + 1 : Math.max(0, e.voteCount - 1),
          };
        }
        if (previousVotedId && e.id === previousVotedId) {
          return {
            ...e,
            hasVoted: false,
            voteCount: Math.max(0, e.voteCount - 1),
          };
        }
        return e;
      })
    );

    try {
      const res = await fetch(`/api/voting/${contestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: targetEntryId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al registrar el voto");
        router.refresh();
        return;
      }

      const data = await res.json();
      if (data.switched) {
        toast.success("¡Tu voto ha sido cambiado exitosamente!");
      } else if (data.voted) {
        toast.success("¡Voto registrado!");
      } else {
        toast.info("Voto eliminado");
      }
      router.refresh();
    } catch {
      toast.error("Error de conexión al votar");
      router.refresh();
    } finally {
      setPendingEntryId(null);
    }
  };

  // Confirm vote switch from modal
  const handleConfirmSwitch = async () => {
    if (!modalPreviousEntry || !modalNewEntry) return;

    setIsSwitching(true);
    await executeVote(modalNewEntry.id, true, modalPreviousEntry.id);
    setIsSwitching(false);
    setSwitchModalOpen(false);
    setModalPreviousEntry(null);
    setModalNewEntry(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`group relative bg-zinc-950/80 border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
              entry.hasVoted
                ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] ring-1 ring-red-500/40"
                : "border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.07)]"
            }`}
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-zinc-900">
              <img
                src={entry.imageUrl}
                alt={entry.authorName || "Imagen del concurso"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {entry.hasVoted && (
                <div className="absolute top-3 right-3 bg-red-600/90 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-xs border border-red-400/30">
                  Tu voto
                </div>
              )}
            </div>

            {/* Author info + vote */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                {entry.instagramAccount && (
                  <div className="flex items-center gap-1.5 text-pink-400 text-sm font-bold">
                    <Instagram className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{entry.instagramAccount}</span>
                  </div>
                )}
                {entry.authorName && (
                  <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                    <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{entry.authorName}</span>
                  </div>
                )}
                {!entry.instagramAccount && !entry.authorName && (
                  <p className="text-gray-600 text-xs italic">Autor desconocido</p>
                )}
              </div>

              {/* Vote button */}
              <div className="pt-2">
                <VoteButton
                  entryId={entry.id}
                  voteCount={entry.voteCount}
                  hasVoted={entry.hasVoted}
                  onVote={() => handleVoteClick(entry)}
                  isLoggedIn={isLoggedIn}
                  isActive={isActive}
                  isPending={pendingEntryId === entry.id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Switch Vote Confirmation Modal */}
      <SwitchVoteModal
        isOpen={switchModalOpen}
        onClose={() => {
          if (!isSwitching) {
            setSwitchModalOpen(false);
            setModalPreviousEntry(null);
            setModalNewEntry(null);
          }
        }}
        onConfirm={handleConfirmSwitch}
        previousEntry={modalPreviousEntry}
        newEntry={modalNewEntry}
        isSubmitting={isSwitching}
      />
    </>
  );
}
