"use client";

import { useState, useEffect } from "react";
import { Instagram, User, Maximize2, Users, Heart } from "lucide-react";
import { VoteButton } from "./VoteButton";
import { SwitchVoteModal } from "./SwitchVoteModal";
import { VotingDetailModal } from "./VotingDetailModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface Voter {
  id: string;
  playerId: string;
  name: string | null;
  alias: string | null;
  image: string | null;
  createdAt: string;
}

export interface Entry {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  voteCount: number;
  hasVoted: boolean;
  voters?: Voter[];
}

interface VotingGalleryProps {
  contestId: string;
  entries: Entry[];
  isLoggedIn: boolean;
  isActive: boolean;
  onSelectEntry?: (entry: Entry) => void;
  onVote?: (entry: Entry) => void;
  pendingEntryId?: string | null;
  currentUserId?: string;
}

export function VotingGallery({
  contestId,
  entries: initialEntries,
  isLoggedIn,
  isActive,
  onSelectEntry,
  onVote,
  pendingEntryId: externalPendingEntryId,
  currentUserId,
}: VotingGalleryProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [internalPendingEntryId, setInternalPendingEntryId] = useState<string | null>(null);
  const [internalSelectedEntryId, setInternalSelectedEntryId] = useState<string | null>(null);

  const pendingEntryId = externalPendingEntryId !== undefined ? externalPendingEntryId : internalPendingEntryId;

  // Keep state synced if props change
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Modal state for switching vote (used if onVote is not provided externally)
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

  // Handle open entry detail
  const handleOpenEntry = (entry: Entry) => {
    if (onSelectEntry) {
      onSelectEntry(entry);
    } else {
      setInternalSelectedEntryId(entry.id);
    }
  };

  // Handle click on vote button (if handled internally)
  const handleVoteClick = (targetEntry: Entry) => {
    if (onVote) {
      onVote(targetEntry);
      return;
    }

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

  // Execute API call with optimistic update (internal fallback)
  const executeVote = async (
    targetEntryId: string,
    isAddingVote: boolean,
    previousVotedId: string | null
  ) => {
    setInternalPendingEntryId(targetEntryId);

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
      setInternalPendingEntryId(null);
    }
  };

  // Confirm vote switch from modal (internal fallback)
  const handleConfirmSwitch = async () => {
    if (!modalPreviousEntry || !modalNewEntry) return;

    setIsSwitching(true);
    await executeVote(modalNewEntry.id, true, modalPreviousEntry.id);
    setIsSwitching(false);
    setSwitchModalOpen(false);
    setModalPreviousEntry(null);
    setModalNewEntry(null);
  };

  const selectedEntry = entries.find((e) => e.id === internalSelectedEntryId) || null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {entries.map((entry) => {
          const voterCount = entry.voters?.length || entry.voteCount;

          return (
            <div
              key={entry.id}
              className={`group relative bg-zinc-950/80 border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                entry.hasVoted
                  ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] ring-1 ring-red-500/40"
                  : "border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.07)]"
              }`}
            >
              {/* Clickable Image Thumbnail */}
              <div
                onClick={() => handleOpenEntry(entry)}
                onContextMenu={(e) => e.preventDefault()}
                className="relative aspect-square overflow-hidden bg-zinc-900 cursor-pointer select-none"
                title="Clic para ver en pantalla completa y ver quiénes votaron"
              >
                <img
                  src={entry.imageUrl}
                  alt={entry.authorName || "Imagen del concurso"}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                  loading="lazy"
                />

                {/* Ambient dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
                  <div className="px-3.5 py-1.5 rounded-full bg-black/80 border border-white/25 text-white text-xs font-bold backdrop-blur-md flex items-center gap-2 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                    <Maximize2 className="w-3.5 h-3.5 text-primary" />
                    <span>Ver foto y votantes</span>
                  </div>
                </div>

                {/* Has voted badge */}
                {entry.hasVoted && (
                  <div className="absolute top-3 right-3 bg-red-600/90 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-xs border border-red-400/30 z-10">
                    <Heart className="w-3 h-3 fill-white" />
                    Tu voto
                  </div>
                )}
              </div>

              {/* Author info + vote button */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div
                    onClick={() => handleOpenEntry(entry)}
                    className="cursor-pointer space-y-1 group/author"
                  >
                    {entry.instagramAccount && (
                      <div className="flex items-center gap-1.5 text-pink-400 text-sm font-bold group-hover/author:text-pink-300 transition-colors">
                        <Instagram className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{entry.instagramAccount}</span>
                      </div>
                    )}
                    {entry.authorName && (
                      <div className="flex items-center gap-1.5 text-gray-300 text-sm group-hover/author:text-white transition-colors">
                        <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="truncate">{entry.authorName}</span>
                      </div>
                    )}
                    {!entry.instagramAccount && !entry.authorName && (
                      <p className="text-gray-600 text-xs italic">Autor desconocido</p>
                    )}
                  </div>

                  {/* Voters count indicator badge */}
                  <button
                    type="button"
                    onClick={() => handleOpenEntry(entry)}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-gray-500" />
                    <span>
                      {voterCount} {voterCount === 1 ? "voto registrado" : "votos registrados"}
                    </span>
                  </button>
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
          );
        })}
      </div>

      {/* Internal modal fallback if onSelectEntry was not passed */}
      {!onSelectEntry && (
        <>
          <VotingDetailModal
            isOpen={!!selectedEntry}
            onClose={() => setInternalSelectedEntryId(null)}
            entry={selectedEntry}
            entries={entries}
            onSelectEntry={(entry) => setInternalSelectedEntryId(entry.id)}
            onVote={handleVoteClick}
            isLoggedIn={isLoggedIn}
            isActive={isActive}
            isPending={pendingEntryId === selectedEntry?.id}
            currentUserId={currentUserId}
          />

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
      )}
    </>
  );
}
