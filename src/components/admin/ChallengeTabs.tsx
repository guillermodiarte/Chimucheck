"use client";

import { useState, useEffect } from "react";

interface ChallengeTabsProps {
  activeContent: React.ReactNode;
  finishedContent: React.ReactNode;
}

const STORAGE_KEY = "challenges_active_tab";

export default function ChallengeTabs({ activeContent, finishedContent }: ChallengeTabsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "finished">("active");
  const [mounted, setMounted] = useState(false);

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
        {activeContent}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-black/40 border border-white/10 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleTabChange("active")}
          className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
            activeTab === "active"
              ? "bg-primary text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => handleTabChange("finished")}
          className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
            activeTab === "finished"
              ? "bg-primary text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Finalizados
        </button>
      </div>

      <div>{activeTab === "active" ? activeContent : finishedContent}</div>
    </div>
  );
}

