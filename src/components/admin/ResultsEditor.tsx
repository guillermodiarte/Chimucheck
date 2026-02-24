"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { bulkUpdateScores } from "@/app/actions/scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Coins, Trophy, Crown, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { revertTournamentChimucoins, setTournamentWinners, WinnerEntry } from "@/app/actions/tournaments";

interface ResultsEditorProps {
  tournament: any;
  sortedRegistrations: any[];
}

const POSITION_ICONS: Record<number, { icon: any; color: string; label: string }> = {
  1: { icon: Crown, color: "text-yellow-400", label: "1°" },
  2: { icon: Medal, color: "text-gray-300", label: "2°" },
  3: { icon: Trophy, color: "text-amber-600", label: "3°" },
};

export function ResultsEditor({ tournament, sortedRegistrations }: ResultsEditorProps) {
  const [chimucoinsMap, setChimucoinsMap] = useState<Record<string, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [positions, setPositions] = useState<Record<string, number>>({}); // playerId -> position (1,2,3 or 0)
  const [reverted, setReverted] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isReverting, setIsReverting] = useState(false);

  // Initialize scores from registrations
  useEffect(() => {
    const initial: Record<string, number> = {};
    for (const reg of sortedRegistrations) {
      initial[reg.playerId] = reg.score;
    }
    setScores(initial);
  }, [sortedRegistrations]);

  // On mount: revert existing chimucoins and load previous positions
  useEffect(() => {
    if (tournament.status === "FINALIZADO" && !reverted) {
      let prevWinners: WinnerEntry[] = [];
      try { prevWinners = JSON.parse(tournament.winners || "[]"); } catch { }

      // Pre-fill chimucoins and positions from previous winners
      const initialCoins: Record<string, number> = {};
      const initialPositions: Record<string, number> = {};
      for (const w of prevWinners) {
        if (w.playerId) {
          initialCoins[w.playerId] = w.chimucoins || 0;
          initialPositions[w.playerId] = w.position || 0;
        }
      }
      setChimucoinsMap(initialCoins);
      setPositions(initialPositions);

      // Only revert if there were actual chimucoins assigned
      const hasChimucoins = prevWinners.some(w => w.chimucoins > 0);
      if (hasChimucoins) {
        setIsReverting(true);
        revertTournamentChimucoins(tournament.id).then((res) => {
          setIsReverting(false);
          if (res.success) {
            setReverted(true);
          }
        });
      } else {
        setReverted(true);
      }
    } else {
      setReverted(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort players by score (current edited values)
  const sortedPlayers = useMemo(() => {
    return [...sortedRegistrations].sort((a, b) => {
      const sa = scores[a.playerId] ?? a.score;
      const sb = scores[b.playerId] ?? b.score;
      return sb - sa;
    });
  }, [sortedRegistrations, scores]);

  // Auto-assign positions (top 3 by score) — only when positions haven't been manually set
  const effectivePositions = useMemo(() => {
    // If any positions are manually set, use those
    const hasManual = Object.values(positions).some(p => p > 0);
    if (hasManual) return positions;

    // Otherwise, auto-assign
    const auto: Record<string, number> = {};
    sortedPlayers.forEach((reg, idx) => {
      if (idx < 3) {
        auto[reg.playerId] = idx + 1;
      }
    });
    return auto;
  }, [sortedPlayers, positions]);

  const handleChimucoinsChange = (playerId: string, value: string) => {
    setChimucoinsMap(prev => ({
      ...prev,
      [playerId]: parseInt(value) || 0,
    }));
  };

  const handleScoreChange = (playerId: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [playerId]: parseInt(value) || 0,
    }));
    // Reset manual positions so auto-assign kicks in from new scores
    setPositions({});
  };

  const handlePositionToggle = (playerId: string, position: number) => {
    setPositions(prev => {
      const newPos = { ...prev };
      // If this player already has this position, remove it
      if (newPos[playerId] === position) {
        delete newPos[playerId];
        return newPos;
      }
      // Remove this position from any other player
      for (const pid of Object.keys(newPos)) {
        if (newPos[pid] === position) {
          delete newPos[pid];
        }
      }
      // Assign this position to this player
      newPos[playerId] = position;
      return newPos;
    });
  };

  const handleSaveResults = () => {
    startSaving(async () => {
      // 1. Save all scores in bulk
      const scoreEntries = sortedRegistrations.map(reg => ({
        playerId: reg.playerId,
        score: scores[reg.playerId] ?? reg.score,
      }));
      const scoreResult = await bulkUpdateScores(tournament.id, scoreEntries);
      if (!scoreResult.success) {
        toast.error("Error al guardar puntajes");
        return;
      }

      // 2. Build winner entries from positions
      const winners: WinnerEntry[] = [];
      for (const reg of sortedPlayers) {
        const pos = effectivePositions[reg.playerId];
        const coins = chimucoinsMap[reg.playerId] || 0;
        if (pos && pos >= 1 && pos <= 3) {
          winners.push({
            position: pos,
            playerId: reg.playerId,
            playerAlias: reg.player.alias || reg.player.name || "",
            chimucoins: coins,
          });
        } else if (coins > 0) {
          // Players with chimucoins but no podium position
          winners.push({
            position: 0,
            playerId: reg.playerId,
            playerAlias: reg.player.alias || reg.player.name || "",
            chimucoins: coins,
          });
        }
      }

      // Sort winners by position
      winners.sort((a, b) => (a.position || 99) - (b.position || 99));

      const result = await setTournamentWinners(tournament.id, winners);
      if (result.success) {
        toast.success("Resultados guardados y ChimuCoins asignados");
      } else {
        toast.error(result.message || "Error al guardar resultados");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Save results button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveResults}
          disabled={isSaving || isReverting}
          className="bg-green-600 hover:bg-green-500 text-white font-bold gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Resultados
        </Button>
      </div>

      {isReverting && (
        <div className="p-4 text-center border border-yellow-500/20 rounded-lg bg-yellow-500/5">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-yellow-500" />
          <span className="text-yellow-400">Preparando edición de resultados...</span>
        </div>
      )}

      {/* Table header */}
      {sortedRegistrations.length > 0 && (
        <div className="flex items-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="w-12 text-center">Puesto</div>
          <div className="flex-1 ml-4">Jugador</div>
          <div className="w-32 text-center">Puntaje</div>
          <div className="w-32 text-center">ChimuCoins</div>
        </div>
      )}

      {/* Player rows sorted by score */}
      {sortedRegistrations.length === 0 ? (
        <div className="p-12 text-center border border-white/10 rounded-lg bg-zinc-900/50">
          <p className="text-gray-500">No hay jugadores inscritos en este torneo.</p>
        </div>
      ) : (
        sortedPlayers.map((reg) => {
          const pos = effectivePositions[reg.playerId] || 0;
          const posInfo = POSITION_ICONS[pos];

          return (
            <div key={reg.id} className={`flex items-center p-4 rounded-lg border transition-colors ${pos === 1 ? "bg-yellow-500/10 border-yellow-500/30" :
                pos === 2 ? "bg-gray-400/10 border-gray-400/30" :
                  pos === 3 ? "bg-amber-600/10 border-amber-600/30" :
                    "bg-zinc-900/50 border-white/5 hover:border-white/10"
              }`}>
              {/* Position selector */}
              <div className="w-12 flex flex-col items-center gap-1">
                {posInfo ? (
                  <div className={`flex items-center justify-center w-8 h-8 ${posInfo.color}`}>
                    <posInfo.icon className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 text-zinc-600 font-bold text-sm">
                    —
                  </div>
                )}
                {/* Mini position buttons */}
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(p => (
                    <button
                      key={p}
                      onClick={() => handlePositionToggle(reg.playerId, p)}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${effectivePositions[reg.playerId] === p
                          ? p === 1 ? "bg-yellow-500 text-black" : p === 2 ? "bg-gray-400 text-black" : "bg-amber-600 text-white"
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                        }`}
                    >
                      {p}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Player info */}
              <div className="flex items-center gap-3 flex-1 min-w-0 ml-4">
                <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                  <AvatarImage src={reg.player.image || ""} />
                  <AvatarFallback>{reg.player.alias?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{reg.player.alias}</p>
                  <p className="text-xs text-zinc-400 truncate">{reg.player.name}</p>
                </div>
              </div>

              {/* Score field */}
              <div className="w-32 flex justify-center">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-yellow-500">Ptos</span>
                  <Input
                    type="number"
                    value={scores[reg.playerId] ?? 0}
                    onChange={(e) => handleScoreChange(reg.playerId, e.target.value)}
                    className="pl-11 w-24 bg-black/40 border-white/10 text-white font-mono text-lg"
                  />
                </div>
              </div>

              {/* ChimuCoins field */}
              <div className="w-32 flex justify-center">
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                  <Input
                    type="number"
                    value={chimucoinsMap[reg.playerId] || 0}
                    onChange={(e) => handleChimucoinsChange(reg.playerId, e.target.value)}
                    className="pl-9 w-24 bg-black/40 border-white/10 text-white font-mono text-lg"
                    min={0}
                  />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
