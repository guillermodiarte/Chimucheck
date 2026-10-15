"use client";

import { useState, useEffect } from "react";
import { Instagram, Heart, Sparkles, Users, Calendar, Clock, ImageIcon } from "lucide-react";
import { VotingPodium } from "./VotingPodium";
import { VotingGallery, Entry, Voter } from "./VotingGallery";
import { VotingDetailModal } from "./VotingDetailModal";
import { SwitchVoteModal } from "./SwitchVoteModal";
import { LoginCTABanner, GalleryLoginHint } from "./LoginCTA";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ContestData {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
}

interface CurrentUser {
  id: string;
  name: string | null;
  alias: string | null;
  image: string | null;
}

interface VotingContestClientProps {
  contest: ContestData;
  initialEntries: Entry[];
  initialSelectedEntryId?: string | null;
  isLoggedIn: boolean;
  isActive: boolean;
  isFinished: boolean;
  currentUser?: CurrentUser | null;
  defaultLogoUrl?: string;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(endDate: Date | string) {
  const d = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return "Finalizado";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h restantes`;
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}

export function VotingContestClient({
  contest,
  initialEntries,
  initialSelectedEntryId,
  isLoggedIn,
  isActive,
  isFinished,
  currentUser,
  defaultLogoUrl,
}: VotingContestClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [selectedDetailEntryId, setSelectedDetailEntryId] = useState<string | null>(
    initialSelectedEntryId || null
  );
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);

  // Sync state if props change or on initial load with ?entry=
  useEffect(() => {
    setEntries(initialEntries);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const entryId = params.get("entry");
      if (entryId && initialEntries.some((e) => e.id === entryId)) {
        setSelectedDetailEntryId(entryId);
      }
    }
  }, [initialEntries]);

  const openDetailModal = (entryId: string) => {
    setSelectedDetailEntryId(entryId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("entry", entryId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const closeDetailModal = () => {
    setSelectedDetailEntryId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("entry");
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Modal state for switching vote
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [modalPreviousEntry, setModalPreviousEntry] = useState<Entry | null>(null);
  const [modalNewEntry, setModalNewEntry] = useState<Entry | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // The currently opened entry for detail modal
  const selectedDetailEntry = entries.find((e) => e.id === selectedDetailEntryId) || null;

  // Handle vote click on an entry (from gallery card or from detail modal)
  const handleVoteClick = (targetEntry: Entry) => {
    if (!isLoggedIn) {
      openDetailModal(targetEntry.id);
      window.dispatchEvent(
        new CustomEvent("open-login-modal", {
          detail: {
            callbackUrl: `${window.location.pathname}?entry=${targetEntry.id}`,
          },
        })
      );
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

    // Case 2: User has already voted for a DIFFERENT entry -> OPEN CONFIRMATION MODAL
    if (currentVotedEntry && currentVotedEntry.id !== targetEntry.id) {
      setModalPreviousEntry(currentVotedEntry);
      setModalNewEntry(targetEntry);
      setSwitchModalOpen(true);
      return;
    }

    // Case 3: User hasn't voted for any entry yet -> vote directly
    executeVote(targetEntry.id, true, null);
  };

  // Execute API call with optimistic update (updates count, hasVoted, and voters list)
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
          let updatedVoters = e.voters ? [...e.voters] : [];
          if (isAddingVote && currentUser) {
            // Add current user to top of voters
            const newVoter: Voter = {
              id: "temp-" + Date.now(),
              playerId: currentUser.id,
              name: currentUser.name,
              alias: currentUser.alias,
              image: currentUser.image,
              createdAt: new Date().toISOString(),
            };
            updatedVoters = [newVoter, ...updatedVoters.filter((v) => v.playerId !== currentUser.id)];
          } else if (!isAddingVote && currentUser) {
            updatedVoters = updatedVoters.filter((v) => v.playerId !== currentUser.id);
          }

          return {
            ...e,
            hasVoted: isAddingVote,
            voteCount: isAddingVote ? e.voteCount + 1 : Math.max(0, e.voteCount - 1),
            voters: updatedVoters,
          };
        }

        if (previousVotedId && e.id === previousVotedId) {
          let updatedVoters = e.voters ? [...e.voters] : [];
          if (currentUser) {
            updatedVoters = updatedVoters.filter((v) => v.playerId !== currentUser.id);
          }
          return {
            ...e,
            hasVoted: false,
            voteCount: Math.max(0, e.voteCount - 1),
            voters: updatedVoters,
          };
        }

        return e;
      })
    );

    try {
      const res = await fetch(`/api/voting/${contest.id}/vote`, {
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

  // Top 3 sorted by vote count (for podium)
  const top3 = [...entries]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3);

  // Remaining entries (rank 4+) for finished contests
  const restEntries = isFinished
    ? [...entries].sort((a, b) => b.voteCount - a.voteCount).slice(3)
    : entries;

  const totalVotes = entries.reduce((acc, e) => acc + e.voteCount, 0);
  const hasCustomCover = !!contest.coverImageUrl;
  const coverImage = contest.coverImageUrl || defaultLogoUrl || "/images/logo5.png";

  return (
    <div className="space-y-12">
      {/* ── 2-COLUMN HEADER: Text on Left, Cover Image OR Winners Podium on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center bg-zinc-950/60 border border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-xl shadow-2xl">
        {/* LEFT COLUMN: Badge, Title, Description, Stats */}
        <div className="lg:col-span-7 space-y-5 text-left">
          {/* Status Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Votación Abierta
              </span>
            )}
            {isFinished && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                🏆 Concurso Finalizado
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {contest.title}
          </h1>

          {/* Description */}
          {contest.description && (
            <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {contest.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm text-gray-400 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Inició: {formatDate(contest.startDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Clock className="w-4 h-4 text-gray-400" />
              {isActive ? (
                <span className="text-yellow-400 font-semibold">
                  ⏱ {formatCountdown(contest.endDate)}
                </span>
              ) : (
                <span>Cerró: {formatDate(contest.endDate)}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              <span>{entries.length} imágenes</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
              <Heart className="w-4 h-4 fill-red-400" />
              <span>{totalVotes} votos</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cover Image (when active) OR Winners Podium (when finished) */}
        <div className="lg:col-span-5 flex justify-center w-full">
          {isFinished && top3.length > 0 ? (
            /* Winners Podium replaces the Cover Image */
            <div className="w-full rounded-3xl bg-zinc-950/80 border border-yellow-500/30 p-5 sm:p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(255,215,0,0.12)] relative overflow-hidden flex flex-col items-center">
              <VotingPodium
                top3={top3}
                onSelectEntry={(entry) => openDetailModal(entry.id)}
                compact
              />
            </div>
          ) : (
            /* Cover Image Display */
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center group">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={contest.title}
                  className={`transition-all duration-500 ${
                    hasCustomCover
                      ? "w-full h-full object-cover group-hover:scale-105"
                      : "max-h-48 max-w-[75%] object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.25)] group-hover:scale-105"
                  }`}
                  onError={(e) => {
                    if (defaultLogoUrl && (e.target as any).src !== defaultLogoUrl) {
                      (e.target as any).src = defaultLogoUrl;
                    } else {
                      (e.target as any).src = "/images/logo5.png";
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-zinc-600">
                  <ImageIcon className="w-16 h-16 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                  {hasCustomCover ? "Portada Oficial" : "ChimuCheck"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login CTA for non-logged users during active contest */}
      {isActive && !isLoggedIn && <LoginCTABanner />}

      {/* ── FINISHED: Full ranking list (if > 3 entries) + Gallery ── */}
      {isFinished && (
        <div className="space-y-12">
          {/* Full ranking table */}
          {restEntries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Ranking completo
                </h3>
                <span className="text-xs text-gray-500">
                  Haz clic en cualquier imagen para verla en alta calidad y ver sus votantes
                </span>
              </div>

              <div className="space-y-3">
                {restEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    onClick={() => openDetailModal(entry.id)}
                    className="group flex items-center gap-4 bg-zinc-900/60 hover:bg-zinc-900 border border-white/10 hover:border-white/30 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]"
                  >
                    <span className="text-gray-500 font-mono font-bold w-8 text-center text-sm">
                      {idx + 4}°
                    </span>

                    <div
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black select-none"
                    >
                      <img
                        src={entry.imageUrl}
                        alt={entry.authorName || "Imagen"}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {entry.instagramAccount && (
                        <p className="text-pink-400 text-xs font-bold flex items-center gap-1">
                          <Instagram className="w-3 h-3 shrink-0" />
                          <span className="truncate">{entry.instagramAccount}</span>
                        </p>
                      )}
                      {entry.authorName && (
                        <p className="text-gray-200 text-sm font-semibold truncate">
                          {entry.authorName}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        <span>{entry.voters?.length || entry.voteCount} votantes registrados</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pr-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-black text-sm">
                        <Heart className="w-3.5 h-3.5 fill-red-400" />
                        <span>{entry.voteCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery with static vote counts */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-300 uppercase tracking-wider">
                Todas las imágenes
              </h3>
              <span className="text-xs text-gray-500">
                Haz clic en una imagen para verla en detalle
              </span>
            </div>

            <VotingGallery
              contestId={contest.id}
              entries={entries}
              isLoggedIn={isLoggedIn}
              isActive={false}
              onSelectEntry={(entry) => openDetailModal(entry.id)}
              onVote={handleVoteClick}
              pendingEntryId={pendingEntryId}
            />
          </div>
        </div>
      )}

      {/* ── ACTIVE: Gallery with vote buttons ── */}
      {isActive && (
        <div className="space-y-6">
          {!isLoggedIn && <GalleryLoginHint />}
          <VotingGallery
            contestId={contest.id}
            entries={entries}
            isLoggedIn={isLoggedIn}
            isActive={true}
            onSelectEntry={(entry) => openDetailModal(entry.id)}
            onVote={handleVoteClick}
            pendingEntryId={pendingEntryId}
          />
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <div className="text-5xl">📷</div>
          <p className="text-xl font-bold text-white">Próximamente</p>
          <p className="text-gray-400">
            Estamos cargando las imágenes de la comunidad. ¡Volvé pronto!
          </p>
        </div>
      )}

      {/* Detail Image & Voters Modal */}
      <VotingDetailModal
        isOpen={!!selectedDetailEntry}
        onClose={closeDetailModal}
        entry={selectedDetailEntry}
        entries={entries}
        onSelectEntry={(entry) => openDetailModal(entry.id)}
        onVote={handleVoteClick}
        isLoggedIn={isLoggedIn}
        isActive={isActive}
        isPending={pendingEntryId === selectedDetailEntry?.id}
        currentUserId={currentUser?.id}
      />

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
    </div>
  );
}
