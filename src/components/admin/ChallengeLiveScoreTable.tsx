"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Search,
  Plus,
  Minus,
  Trophy,
  Crown,
  UserX,
  UserCheck,
  ArrowUpDown,
  ListOrdered,
  Medal,
  Clock,
  Swords,
  Play,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateChallengePlayerScore,
  toggleChallengePlayerAbsent,
  finishChallenge,
  reactivateChallenge,
} from "@/app/actions/challenges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PodiumModal } from "@/components/tournament/PodiumModal";
import { MediaSelectorModal } from "@/components/admin/MediaSelectorModal";

export type ChallengeLivePlayer = {
  id: string; // playerId
  name: string;
  alias: string;
  image: string;
  score: number;
  timesPlayed: number;
  lastPlayedAt?: string | null;
  registeredAt: string;
  isAbsent: boolean;
};

type HistoryEntry = {
  playerId: string;
  previousScore: number;
  newScore: number;
  previousTimesPlayed: number;
  newTimesPlayed: number;
  previousLastPlayedAt?: string | null;
};

interface ChallengeLiveScoreTableProps {
  challengeId: string;
  challengeName: string;
  initialStatus: string;
  initialPlayers: ChallengeLivePlayer[];
  prizePool?: string;
  readOnly?: boolean; // For public live viewer
}

export function ChallengeLiveScoreTable({
  challengeId,
  challengeName,
  initialStatus,
  initialPlayers,
  prizePool,
  readOnly = false,
}: ChallengeLiveScoreTableProps) {
  const router = useRouter();
  const [players, setPlayers] = useState<ChallengeLivePlayer[]>(initialPlayers);
  const [status, setStatus] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "points">("priority");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPodium, setShowPodium] = useState(false);

  // Background for projector mode
  const [bgImage, setBgImageState] = useState("");
  const setBgImage = (url: string) => {
    setBgImageState(url);
    if (typeof window !== "undefined") localStorage.setItem("projector_bg", url);
  };

  useEffect(() => {
    const saved = localStorage.getItem("projector_bg");
    if (saved) setBgImageState(saved);
  }, []);

  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // Undo / Redo stacks
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Optimistic pending custom sum/score inputs
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [sumValues, setSumValues] = useState<Record<string, string>>({});

  // Sync with server updates
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  // Polling to keep table fresh across devices
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  // Handle score update (+1 timesPlayed, update lastPlayedAt)
  const handleScoreChange = async (playerId: string, newScore: number) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const previousScore = player.score;
    const previousTimesPlayed = player.timesPlayed;
    const previousLastPlayedAt = player.lastPlayedAt;

    if (previousScore === newScore) return;

    const newTimesPlayed = previousTimesPlayed + 1;
    const newLastPlayedAt = new Date().toISOString();

    // Push to undo stack
    setHistory((prev) => [
      ...prev,
      {
        playerId,
        previousScore,
        newScore,
        previousTimesPlayed,
        newTimesPlayed,
        previousLastPlayedAt,
      },
    ]);
    setRedoStack([]);

    // Optimistic UI update
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              score: newScore,
              timesPlayed: newTimesPlayed,
              lastPlayedAt: newLastPlayedAt,
            }
          : p
      )
    );
    setPendingValues((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });

    const res = await updateChallengePlayerScore(challengeId, playerId, newScore);
    if (!res.success) {
      toast.error(res.message);
      // Revert on error
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                score: previousScore,
                timesPlayed: previousTimesPlayed,
                lastPlayedAt: previousLastPlayedAt,
              }
            : p
        )
      );
    } else {
      toast.success(`${player.alias}: ${newScore} pts (Partidas: ${newTimesPlayed})`);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    const player = players.find((p) => p.id === lastAction.playerId);
    if (!player) return;

    // Optimistic revert
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === lastAction.playerId
          ? {
              ...p,
              score: lastAction.previousScore,
              timesPlayed: lastAction.previousTimesPlayed,
              lastPlayedAt: lastAction.previousLastPlayedAt,
            }
          : p
      )
    );

    await updateChallengePlayerScore(challengeId, lastAction.playerId, lastAction.previousScore, {
      isUndo: true,
    });
    toast.info(`Deshecho: ${player.alias} vuelve a ${lastAction.previousScore} pts`);
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, nextAction]);

    const player = players.find((p) => p.id === nextAction.playerId);
    if (!player) return;

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === nextAction.playerId
          ? {
              ...p,
              score: nextAction.newScore,
              timesPlayed: nextAction.newTimesPlayed,
              lastPlayedAt: new Date().toISOString(),
            }
          : p
      )
    );

    await updateChallengePlayerScore(challengeId, nextAction.playerId, nextAction.newScore);
    toast.info(`Rehecho: ${player.alias} a ${nextAction.newScore} pts`);
  };

  const handleToggleAbsent = async (playerId: string, isAbsent: boolean) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, isAbsent } : p))
    );

    const res = await toggleChallengePlayerAbsent(challengeId, playerId, isAbsent);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message || "Error al actualizar estado");
      // Revert
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, isAbsent: !isAbsent } : p))
      );
    }
  };

  const handleFinalize = async () => {
    const result = await finishChallenge(challengeId);
    if (result.success) {
      toast.success(`Desafío "${challengeName}" finalizado`);
      setStatus("FINALIZADO");
      setShowPodium(true);
    } else {
      toast.error(result.message || "Error al finalizar");
    }
  };

  const handleReactivate = async () => {
    const result = await reactivateChallenge(challengeId);
    if (result.success) {
      toast.success(`Desafío "${challengeName}" reactivado`);
      setStatus("EN_JUEGO");
    } else {
      toast.error(result.message || "Error al reactivar");
    }
  };

  // Filter players by search
  const filteredPlayers = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return players;
    return players.filter(
      (p) =>
        p.alias.toLowerCase().includes(search) ||
        (p.name && p.name.toLowerCase().includes(search))
    );
  }, [players, searchTerm]);

  // Separate active and absent players
  const activePlayers = useMemo(() => {
    const list = filteredPlayers.filter((p) => !p.isAbsent);

    if (sortBy === "points") {
      // Order by points DESC, then less timesPlayed, then alias
      return [...list].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timesPlayed !== b.timesPlayed) return a.timesPlayed - b.timesPlayed;
        return a.alias.localeCompare(b.alias);
      });
    }

    // Default: Turn / Priority Queue
    return [...list].sort((a, b) => {
      // 1. Fewer times played first
      if (a.timesPlayed !== b.timesPlayed) {
        return a.timesPlayed - b.timesPlayed;
      }
      // 2. Tie breaker:
      // If 0 games played: order of arrival / registration (FIFO)
      if (a.timesPlayed === 0) {
        return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
      }
      // If already played: who played longest ago comes first (lastPlayedAt ASC)
      const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
      const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;

      return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
    });
  }, [filteredPlayers, sortBy]);

  const absentPlayers = useMemo(() => {
    return filteredPlayers.filter((p) => p.isAbsent);
  }, [filteredPlayers]);

  // Winners podium data
  const podiumWinners = useMemo(() => {
    const sortedByPoints = [...players].sort((a, b) => b.score - a.score);
    return sortedByPoints.slice(0, 3).map((p, idx) => ({
      position: idx + 1,
      alias: p.alias || p.name,
      image: p.image || null,
      score: p.score,
    }));
  }, [players]);

  return (
    <div
      className={`space-y-6 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-black/95 p-6 overflow-y-auto"
          : "relative"
      }`}
      style={
        isFullscreen && bgImage
          ? {
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar jugador..."
              className="pl-9 bg-gray-800/80 border-gray-700 h-9 text-sm"
            />
          </div>
        </div>

        {/* View mode toggle: Priority vs Points */}
        <div className="flex items-center gap-1 bg-gray-800/80 p-1 rounded-lg border border-gray-700">
          <button
            type="button"
            onClick={() => setSortBy("priority")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              sortBy === "priority"
                ? "bg-primary text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
            title="Orden de turnos: juegan primero los que menos jugaron"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Cola de Turnos</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy("points")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              sortBy === "points"
                ? "bg-primary text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
            title="Tabla de posiciones por puntaje acumulado"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Por Puntos</span>
          </button>
        </div>

        {/* Admin Action Buttons */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-white h-9"
              title="Deshacer último puntaje"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-white h-9"
              title="Rehacer"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            {status === "FINALIZADO" ? (
              <Button
                type="button"
                onClick={handleReactivate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold h-9 text-xs"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Reactivar Desafío
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold h-9 text-xs"
                  >
                    <Trophy className="w-3.5 h-3.5 mr-1" />
                    Finalizar Desafío
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Finalizar Desafío?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Al finalizar, los jugadores con mayor puntaje acumulado serán proclamados ganadores en el podio.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800 text-white">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleFinalize}
                    >
                      Finalizar Ahora
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Projector Fullscreen button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-white h-9 text-xs"
              title="Modo pantalla completa / proyector"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 mr-1" /> Salir
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 mr-1" /> Proyector
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Mode hint badge */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          {sortBy === "priority" ? (
            <>
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                Mostrando <strong>orden de turnos</strong>: primero quienes jugaron menos o están en espera.
              </span>
            </>
          ) : (
            <>
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                Mostrando <strong>tabla por puntos</strong>: clasificación general por mayor puntaje acumulado.
              </span>
            </>
          )}
        </span>
        <span>
          Jugadores activos: <strong>{activePlayers.length}</strong> · Ausentes:{" "}
          <strong>{absentPlayers.length}</strong>
        </span>
      </div>

      {/* MAIN ACTIVE PLAYERS TABLE */}
      <div className="bg-black/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="divide-y divide-gray-800/60">
          {activePlayers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Swords className="w-8 h-8 opacity-20 mx-auto mb-2" />
              <p>No hay jugadores en la cola activa.</p>
            </div>
          ) : (
            activePlayers.map((player, index) => {
              const currentScore = player.score;
              const isNextToPlay = index === 0 && sortBy === "priority";

              return (
                <div
                  key={player.id}
                  className={`p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 transition-colors ${
                    isNextToPlay
                      ? "bg-yellow-500/10 border-l-4 border-l-primary"
                      : "hover:bg-gray-800/40"
                  }`}
                >
                  {/* Left: Position & Player Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Position / Turn Number */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${
                        sortBy === "points" && index === 0
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                          : sortBy === "points" && index === 1
                          ? "bg-gray-400/20 text-gray-300 border-gray-400/40"
                          : sortBy === "points" && index === 2
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                          : isNextToPlay
                          ? "bg-primary text-black border-primary"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {sortBy === "points" && index === 0 ? (
                        <Crown className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-10 h-10 border border-gray-700 shrink-0">
                      <AvatarImage src={player.image || ""} />
                      <AvatarFallback className="bg-gray-800 text-white font-bold">
                        {player.alias?.slice(0, 2).toUpperCase() || "JU"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Names */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-base truncate leading-tight">
                          {player.alias || player.name}
                        </p>
                        {isNextToPlay && (
                          <span className="text-[10px] bg-primary text-black font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            ¡Turno actual!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {player.name && player.name !== player.alias && (
                          <span className="truncate">{player.name}</span>
                        )}
                        <span className="text-gray-600">·</span>
                        <span className="text-primary font-medium">
                          {player.timesPlayed}{" "}
                          {player.timesPlayed === 1 ? "jugada" : "jugadas"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Controls & Actions */}
                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Points display & controls */}
                    <div className="flex items-center gap-2">
                      {!readOnly && (
                        <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(player.id, Math.max(0, currentScore - 1))}
                            className="w-7 h-7 rounded hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
                            title="Restar 1 punto"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <Input
                            type="number"
                            value={
                              pendingValues[player.id] !== undefined
                                ? pendingValues[player.id]
                                : currentScore
                            }
                            onChange={(e) =>
                              setPendingValues((prev) => ({
                                ...prev,
                                [player.id]: e.target.value,
                              }))
                            }
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) handleScoreChange(player.id, val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                if (!isNaN(val)) handleScoreChange(player.id, val);
                              }
                            }}
                            className="w-14 h-7 text-center font-mono font-bold text-sm bg-transparent border-none p-0 text-white focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleScoreChange(player.id, currentScore + 1)}
                            className="w-7 h-7 rounded hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
                            title="Sumar 1 punto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Score total banner */}
                      <div className="min-w-[70px] text-right">
                        <span className="text-xl font-black text-white font-mono">
                          {currentScore}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-1 font-semibold uppercase">
                          pts
                        </span>
                      </div>
                    </div>

                    {/* Absent Button */}
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAbsent(player.id, true)}
                        className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 h-8 text-xs px-2 gap-1"
                        title="Marcar como ausente (mueve a lista inferior)"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Ausente</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ABSENT PLAYERS SECTION */}
      {absentPlayers.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              Jugadores Ausentes ({absentPlayers.length})
            </h4>
            <span className="text-xs text-red-300/70">
              No se llaman para jugar hasta que sean desbloqueados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {absentPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-black/40 border border-red-900/30 p-2.5 rounded-lg"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="w-8 h-8 opacity-70">
                    <AvatarImage src={player.image || ""} />
                    <AvatarFallback className="bg-gray-800 text-xs">
                      {player.alias?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {player.alias || player.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {player.score} pts · {player.timesPlayed} jugadas
                    </p>
                  </div>
                </div>

                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAbsent(player.id, false)}
                    className="border-green-600/40 text-green-400 hover:bg-green-600/20 h-7 text-xs px-2.5 gap-1 shrink-0"
                    title="Reactivar y devolver a la cola"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Reactivar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Podium celebration modal */}
      <PodiumModal
        isOpen={showPodium}
        onClose={() => setShowPodium(false)}
        winners={podiumWinners}
        prizePool={prizePool}
      />
    </div>
  );
}

