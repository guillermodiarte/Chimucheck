"use client";

import { useState } from "react";

interface TournamentTabsProps {
  activeContent: React.ReactNode;
  finishedContent: React.ReactNode;
}

export default function TournamentTabs({ activeContent, finishedContent }: TournamentTabsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "finished">("active");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-black/40 border border-white/10 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${activeTab === "active"
              ? "bg-primary text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          Activos
        </button>
        <button
          onClick={() => setActiveTab("finished")}
          className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${activeTab === "finished"
              ? "bg-primary text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          Finalizados
        </button>
      </div>

      {/* Content */}
      {activeTab === "active" ? activeContent : finishedContent}
    </div>
  );
}
