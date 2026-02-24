"use client";

import { useState, useEffect } from "react";

interface TournamentTabsProps {
  activeContent: React.ReactNode;
  finishedContent: React.ReactNode;
}

const STORAGE_KEY = "tournaments_active_tab";

export default function TournamentTabs({ activeContent, finishedContent }: TournamentTabsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "finished">(() => {
    // Will be overridden by useEffect on client, but set a default for SSR
    return "active";
  });
  const [mounted, setMounted] = useState(false);

  // On mount, read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "active" || stored === "finished") {
      setActiveTab(stored);
    }
    setMounted(true);
  }, []);

  const handleTabChange = (tab: "active" | "finished") => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  };

  // Prevent hydration mismatch by not rendering until client mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex gap-1 bg-black/40 border border-white/10 rounded-lg p-1 w-fit">
          <button className="px-5 py-2.5 rounded-md text-sm font-bold bg-primary text-black shadow-lg">
            Activos
          </button>
          <button className="px-5 py-2.5 rounded-md text-sm font-bold text-gray-400">
            Finalizados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-black/40 border border-white/10 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleTabChange("active")}
          className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${activeTab === "active"
            ? "bg-primary text-black shadow-lg"
            : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          Activos
        </button>
        <button
          onClick={() => handleTabChange("finished")}
          className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${activeTab === "finished"
            ? "bg-primary text-black shadow-lg"
            : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          Finalizados
        </button>
      </div>

      {/* Content */}
      <div key={activeTab}>
        {activeTab === "active" ? activeContent : finishedContent}
      </div>
    </div>
  );
}
