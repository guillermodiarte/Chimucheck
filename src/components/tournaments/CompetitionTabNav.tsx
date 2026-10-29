"use client";

import Link from "next/link";
import { Trophy, Swords } from "lucide-react";

interface CompetitionTabNavProps {
  currentTab: "torneos" | "desafios";
  tournamentsCount?: number;
  challengesCount?: number;
  baseHref?: string;
}

export function CompetitionTabNav({
  currentTab,
  tournamentsCount,
  challengesCount,
  baseHref = "/torneos",
}: CompetitionTabNavProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-2 bg-black/60 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md shadow-2xl">
        <Link
          href={`${baseHref}?tab=torneos`}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm md:text-base font-black uppercase tracking-wider transition-all duration-300 ${
            currentTab === "torneos"
              ? "bg-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-105"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Torneos</span>
          {tournamentsCount !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                currentTab === "torneos" ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
              }`}
            >
              {tournamentsCount}
            </span>
          )}
        </Link>

        <Link
          href={`${baseHref}?tab=desafios`}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm md:text-base font-black uppercase tracking-wider transition-all duration-300 ${
            currentTab === "desafios"
              ? "bg-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-105"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Swords className="w-5 h-5" />
          <span>Desafíos</span>
          {challengesCount !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                currentTab === "desafios" ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
              }`}
            >
              {challengesCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

