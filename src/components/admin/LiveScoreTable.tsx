"use client";

import { useState, useEffect } from "react";
import { useScoreHistory } from "@/hooks/useScoreHistory";
import { updatePlayerScore } from "@/app/actions/scores";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Maximize2, Minimize2, Search, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PlayerScore = {
  playerId: string;
  alias: string;
  image: string;
  score: number;
};

export function LiveScoreTable({ tournamentId, initialData }: { tournamentId: string, initialData: PlayerScore[] }) {
  const [players, setPlayers] = useState<PlayerScore[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { addAction, undo, redo, canUndo, canRedo } = useScoreHistory();
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [sumValues, setSumValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setPlayers(initialData);
  }, [initialData]);

  const handleScoreChange = async (playerId: string, newScore: number) => {
    const player = players.find(p => p.playerId === playerId);
    if (!player) return;

    const previousScore = player.score;
    if (previousScore === newScore) return;

    addAction({ playerId, previousScore, newScore, timestamp: new Date() });

    // Optimistic UI Update
    setPlayers(prev => prev.map(p => p.playerId === playerId ? { ...p, score: newScore } : p));
    setPendingValues(prev => { const next = { ...prev }; delete next[playerId]; return next; });

    const res = await updatePlayerScore({ tournamentId, playerId, newScore });
    if (!res.success) {
      toast.error(res.message);
      // Revert on error
      setPlayers(prev => prev.map(p => p.playerId === playerId ? { ...p, score: previousScore } : p));
    } else {
      toast.success(`Puntaje actualizado: ${newScore} pts`);
    }
  };

  const handleUndo = async () => {
    const action = undo();
    if (!action) return;

    setPlayers(prev => prev.map(p => p.playerId === action.playerId ? { ...p, score: action.previousScore } : p));
    await updatePlayerScore({ tournamentId, playerId: action.playerId, newScore: action.previousScore });
  };

  const handleRedo = async () => {
    const action = redo();
    if (!action) return;

    setPlayers(prev => prev.map(p => p.playerId === action.playerId ? { ...p, score: action.newScore } : p));
    await updatePlayerScore({ tournamentId, playerId: action.playerId, newScore: action.newScore });
  };

  const sortedPlayers = [...players]
    .filter(p => p.alias.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.score - a.score || a.alias.localeCompare(b.alias));

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-8 overflow-auto' : 'space-y-6'}`}>
      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-black/50 border-white/10 text-white"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 disabled:opacity-50" title="Deshacer">
            <Undo2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 disabled:opacity-50" title="Rehacer">
            <Redo2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={() => setIsFullscreen(!isFullscreen)} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 disabled:opacity-50" title={isFullscreen ? "Salir" : "Proyector"}>
            {isFullscreen ? <Minimize2 className="w-5 h-5 mr-2" /> : <Maximize2 className="w-5 h-5 mr-2" />}
            {isFullscreen ? "Cerrar Proyector" : "Proyector"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <AnimatePresence>
          {sortedPlayers.map((player, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              key={player.playerId}
              className="flex items-center justify-between bg-zinc-900 border border-white/5 rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-gray-400 font-black text-lg">
                  {index + 1}
                </div>
                <Avatar className="w-10 h-10 border border-gray-700">
                  <AvatarImage src={player.image || ""} alt={player.alias} className="object-cover" />
                  <AvatarFallback className="bg-gray-800 text-gray-500 text-xs">
                    {player.alias?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white uppercase">{player.alias}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-6 ml-4">

                {/* Adjust Score Input */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">Ajustar Puntos</span>
                  <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const val = parseInt(sumValues[player.playerId] || "0");
                        if (!isNaN(val) && val !== 0) {
                          handleScoreChange(player.playerId, player.score - Math.abs(val));
                          setSumValues({ ...sumValues, [player.playerId]: "" });
                        }
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 shrink-0 rounded-md"
                      title="Restar"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      placeholder="0"
                      value={sumValues[player.playerId] || ""}
                      onChange={(e) => setSumValues({ ...sumValues, [player.playerId]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(sumValues[player.playerId] || "0");
                          if (!isNaN(val) && val !== 0) {
                            handleScoreChange(player.playerId, player.score + val);
                            setSumValues({ ...sumValues, [player.playerId]: "" });
                          }
                        }
                      }}
                      className="w-16 h-8 text-center text-lg font-bold bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-gray-600"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const val = parseInt(sumValues[player.playerId] || "0");
                        if (!isNaN(val) && val !== 0) {
                          handleScoreChange(player.playerId, player.score + Math.abs(val));
                          setSumValues({ ...sumValues, [player.playerId]: "" });
                        }
                      }}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/20 h-8 w-8 shrink-0 rounded-md"
                      title="Sumar"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Total Score Display */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">Total</span>
                  <div className="flex items-center gap-2 bg-black border border-white/10 px-4 py-2 rounded-lg h-[44px]">
                    <span className="text-xl font-bold text-white min-w-[2rem] text-center">
                      {player.score}
                    </span>
                    <span className="text-primary font-bold text-sm">PTS</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sortedPlayers.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No se encontraron jugadores.
          </div>
        )}
      </div>
    </div>
  );
}
