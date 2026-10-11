"use client";

import { Instagram, User } from "lucide-react";
import { VoteButton } from "./VoteButton";

interface Entry {
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
  entries,
  isLoggedIn,
  isActive,
}: VotingGalleryProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 space-y-3">
        <div className="text-5xl">📷</div>
        <p className="text-lg font-semibold">Todavía no hay imágenes en este concurso</p>
        <p className="text-sm">El administrador pronto subirá las fotos de la comunidad.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="group relative bg-zinc-950/80 border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.07)] flex flex-col"
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
          </div>

          {/* Author info + vote */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              {entry.instagramAccount && (
                <div className="flex items-center gap-1.5 text-pink-400 text-sm font-bold">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{entry.instagramAccount}</span>
                </div>
              )}
              {entry.authorName && (
                <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>{entry.authorName}</span>
                </div>
              )}
              {!entry.instagramAccount && !entry.authorName && (
                <p className="text-gray-600 text-xs italic">Autor desconocido</p>
              )}
            </div>

            {/* Vote button */}
            <div className="pt-2">
              <VoteButton
                contestId={contestId}
                entryId={entry.id}
                initialVoteCount={entry.voteCount}
                initialHasVoted={entry.hasVoted}
                isLoggedIn={isLoggedIn}
                isActive={isActive}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
