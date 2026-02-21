import { useState, useCallback } from "react";

export type ScoreHistoryEntry = {
  playerId: string;
  previousScore: number;
  newScore: number;
  timestamp: Date;
};

export function useScoreHistory() {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<ScoreHistoryEntry[]>([]);

  const addAction = useCallback((entry: ScoreHistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  const undo = useCallback((): ScoreHistoryEntry | null => {
    if (history.length === 0) return null;

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    return lastAction;
  }, [history]);

  const redo = useCallback((): ScoreHistoryEntry | null => {
    if (redoStack.length === 0) return null;

    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, nextAction]);

    return nextAction;
  }, [redoStack]);

  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;

  return { addAction, undo, redo, canUndo, canRedo };
}
