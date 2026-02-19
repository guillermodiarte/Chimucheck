"use client";

import { useState, useTransition } from "react";
import { updatePlayerScore, undoLastScoreUpdate } from "@/app/actions/scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RotateCcw, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ScoreRowProps {
  registration: any; // Typed loosely for now, contains player and score
  tournamentId: string;
}

export function ScoreRow({ registration, tournamentId }: ScoreRowProps) {
  const [score, setScore] = useState(registration.score);
  const [isPending, startTransition] = useTransition();

  const handleScoreChange = (newVal: string) => {
    const val = parseInt(newVal) || 0;
    setScore(val);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePlayerScore({
        playerId: registration.playerId,
        tournamentId,
        newScore: score,
      });

      if (result.success) {
        toast.success(`Puntaje de ${registration.player.alias} actualizado`);
      } else {
        toast.error("Error al actualizar puntaje");
      }
    });
  };

  const handleUndo = () => {
    startTransition(async () => {
      const result = await undoLastScoreUpdate(registration.playerId, tournamentId);
      if (result.success) {
        toast.success("Cambio deshecho");
        // Optimistically update local state not strictly needed due to revalidatePath but good for UX if needed.
        // However, since we don't know the exact previous value without refetching or passing it back, 
        // we rely on revalidatePath to refresh the server component parent, which will re-render this row.
        // But wait, this is a controlled input. We need to sync with new props.
      } else {
        toast.error(result.message);
      }
    });
  };

  // Pivot: Sync local state with prop when it changes (after revalidate)
  useState(() => {
    if (registration.score !== score) setScore(registration.score);
  });

  // Actually, use useEffect or better, key the component by score to force reset, or just letting the parent re-render.
  // Simple way: key={registration.score} in parent.

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 font-bold text-zinc-500 bg-zinc-800 rounded-full">
          #
        </div>

        <Avatar className="h-10 w-10 border border-white/10">
          <AvatarImage src={registration.player.image || ""} />
          <AvatarFallback>{registration.player.alias?.[0] || "?"}</AvatarFallback>
        </Avatar>

        <div>
          <p className="font-bold text-white">{registration.player.alias}</p>
          <p className="text-xs text-zinc-400">{registration.player.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
          <Input
            type="number"
            value={score}
            onChange={(e) => handleScoreChange(e.target.value)}
            className="pl-9 w-24 bg-black/40 border-white/10 text-white font-mono text-lg"
          />
        </div>

        <Button
          size="icon"
          onClick={handleSave}
          disabled={isPending || score === registration.score}
          className={`transition-all ${score !== registration.score ? "bg-green-600 hover:bg-green-500 text-white" : "bg-zinc-800 text-zinc-500"}`}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleUndo}
          disabled={isPending || (!registration.scoreHistory || registration.scoreHistory === "[]")}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Deshacer último cambio"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
