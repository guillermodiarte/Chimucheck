"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createChallenge, updateChallenge, unregisterPlayerFromChallenge } from "@/app/actions/challenges";
import { LocalImageUpload } from "./LocalImageUpload";
import { AddManualPlayerModal } from "./AddManualPlayerModal";
import { Plus, X, Gamepad2, Users, Trash2, Camera, Search, Swords, ChevronDown, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type GameEntry = {
  name: string;
  image: string;
  format: string;
  gameId?: string;
  categoryId?: string;
  pendingFile?: File | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  SHOOTER: "Shooter",
  RACING: "Racing",
  KOMBAT: "Kombat",
  SPORTS: "Sports",
  BOARD_GAME: "Juegos de Mesa",
  ARENA_MULTIGAMES: "⚔️ Arena Multigames",
};

const ChallengeFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha inválida",
  }),
  maxPlayers: z.coerce.number().min(2, "Mínimo 2 jugadores"),
  active: z.boolean().default(true),
  isRestricted: z.boolean().default(false),
});

interface ChallengeFormProps {
  challenge?: any;
  gamesCatalog?: any[];
  allPlayers?: { id: string; alias?: string | null; name?: string | null; image?: string | null }[];
}

export default function ChallengeForm({ challenge, gamesCatalog = [], allPlayers = [] }: ChallengeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; name: string } | null>(null);

  const availablePlayers = useMemo(() => {
    const registeredIds = new Set(
      challenge?.registrations?.map((r: any) => r.playerId) || []
    );
    return allPlayers.filter((p) => !registeredIds.has(p.id));
  }, [allPlayers, challenge?.registrations]);

  // --- Games state ---
  const existingGames: GameEntry[] = (() => {
    if (challenge?.games) {
      const parsed = typeof challenge.games === "string"
        ? JSON.parse(challenge.games)
        : challenge.games;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: any) => ({
          name: g.name || "",
          image: g.image || "",
          format: g.format || "1vs1",
          gameId: g.gameId,
          categoryId: g.categoryId,
        }));
      }
    }
    return [];
  })();

  const [games, setGames] = useState<GameEntry[]>(existingGames);
  const [gameSearch, setGameSearch] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group catalog games by category and filter by search term
  const categorizedGames = useMemo(() => {
    const searchLower = gameSearch.toLowerCase().trim();
    const map: Record<string, any[]> = {};

    gamesCatalog.forEach((game) => {
      // Exclude already added games
      const alreadyAdded = games.some((g) => g.gameId === game.id || g.name === game.name);
      if (alreadyAdded) return;

      if (searchLower && !game.name.toLowerCase().includes(searchLower)) {
        return;
      }

      let parsedImages = [];
      try {
        parsedImages = JSON.parse(game.images);
      } catch {}
      const coverImage = Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : "";

      const cat = game.categoryId || "GENERAL";
      if (!map[cat]) map[cat] = [];
      map[cat].push({ ...game, coverImage });
    });

    return map;
  }, [gamesCatalog, games, gameSearch]);

  // --- Prizes state ---
  const existingPrizes = (() => {
    if (challenge?.prizePool) {
      try {
        const parsed = JSON.parse(challenge.prizePool);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          const imgs: string[] = Array.isArray(parsed.images)
            ? parsed.images
            : (parsed.image ? [parsed.image] : []);
          return {
            type: parsed.type || "TEXTO",
            first: parsed.first || "",
            second: parsed.second || "",
            third: parsed.third || "",
            chimucoinsFirst: parsed.chimucoinsFirst || "",
            chimucoinsSecond: parsed.chimucoinsSecond || "",
            chimucoinsThird: parsed.chimucoinsThird || "",
            imageFirst: parsed.imageFirst || imgs[0] || "",
            imageSecond: parsed.imageSecond || imgs[1] || "",
            imageThird: parsed.imageThird || imgs[2] || "",
          };
        }
      } catch {
        return {
          type: "TEXTO",
          first: challenge.prizePool,
          second: "",
          third: "",
          chimucoinsFirst: "",
          chimucoinsSecond: "",
          chimucoinsThird: "",
          imageFirst: "",
          imageSecond: "",
          imageThird: "",
        };
      }
    }
    return {
      type: "TEXTO",
      first: "",
      second: "",
      third: "",
      chimucoinsFirst: "",
      chimucoinsSecond: "",
      chimucoinsThird: "",
      imageFirst: "",
      imageSecond: "",
      imageThird: "",
    };
  })();

  const [prizes, setPrizes] = useState(existingPrizes);

  type PrizeImageState = { url: string; pendingFile?: File | null };
  const [prizeImageFirst, setPrizeImageFirst] = useState<PrizeImageState>(() => ({
    url: existingPrizes.imageFirst,
    pendingFile: null,
  }));
  const [prizeImageSecond, setPrizeImageSecond] = useState<PrizeImageState>(() => ({
    url: existingPrizes.imageSecond,
    pendingFile: null,
  }));
  const [prizeImageThird, setPrizeImageThird] = useState<PrizeImageState>(() => ({
    url: existingPrizes.imageThird,
    pendingFile: null,
  }));

  const handlePrizeImageFile = (pos: "first" | "second" | "third", file: File) => {
    const previewUrl = URL.createObjectURL(file);
    if (pos === "first") setPrizeImageFirst({ url: previewUrl, pendingFile: file });
    else if (pos === "second") setPrizeImageSecond({ url: previewUrl, pendingFile: file });
    else setPrizeImageThird({ url: previewUrl, pendingFile: file });
  };

  const handlePrizeImageUrl = (pos: "first" | "second" | "third", url: string) => {
    if (pos === "first") setPrizeImageFirst({ url, pendingFile: null });
    else if (pos === "second") setPrizeImageSecond({ url, pendingFile: null });
    else setPrizeImageThird({ url, pendingFile: null });
  };

  const handlePrizeImageRemove = (pos: "first" | "second" | "third") => {
    if (pos === "first") setPrizeImageFirst({ url: "", pendingFile: null });
    else if (pos === "second") setPrizeImageSecond({ url: "", pendingFile: null });
    else setPrizeImageThird({ url: "", pendingFile: null });
  };

  const form = useForm<z.infer<typeof ChallengeFormSchema>>({
    resolver: zodResolver(ChallengeFormSchema) as any,
    defaultValues: {
      name: challenge?.name || "",
      description: challenge?.description || "",
      date: challenge?.date
        ? (() => {
            const d = new Date(challenge.date);
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          })()
        : "",
      maxPlayers: challenge?.maxPlayers || 32,
      active: challenge?.active ?? true,
      isRestricted: challenge?.isRestricted ?? false,
    },
  });

  // --- Game entry helpers ---
  function handleAddGame(gameObj: any) {
    if (!gameObj) return;

    let parsedImages = [];
    try {
      parsedImages = JSON.parse(gameObj.images);
    } catch {}
    const coverImage = Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : (gameObj.coverImage || "");

    setGames((prev) => [
      ...prev,
      {
        name: gameObj.name,
        image: coverImage,
        format: "1vs1",
        gameId: gameObj.id,
        categoryId: gameObj.categoryId,
      },
    ]);
    setGameSearch("");
    setIsDropdownOpen(false);
  }

  function removeGame(index: number) {
    setGames((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGameFormat(index: number, format: string) {
    setGames((prev) => prev.map((g, i) => (i === index ? { ...g, format } : g)));
  }

  // --- Players helpers ---
  async function confirmRemovePlayer() {
    if (!playerToDelete) return;
    const toastId = toast.loading("Eliminando inscripción...");
    const result = await unregisterPlayerFromChallenge(challenge.id, playerToDelete.id);

    if (result.success) {
      toast.success(result.message, { id: toastId });
      router.refresh();
    } else {
      toast.error(result.message || "Error al eliminar jugador", { id: toastId });
    }
    setPlayerToDelete(null);
  }

  // --- Submit ---
  async function onSubmit(data: z.infer<typeof ChallengeFormSchema>) {
    setIsSubmitting(true);

    try {
      // Upload pending prize images
      const uploadPrizeImage = async (
        imgState: PrizeImageState,
        label: string
      ): Promise<string> => {
        if (imgState.pendingFile) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", imgState.pendingFile);
          uploadFormData.append("folder", "imagenes");
          const toastId = toast.loading(`Subiendo imagen de premio (${label})...`);
          const response = await fetch("/api/upload", { method: "POST", body: uploadFormData });
          const uploadResult = await response.json();
          toast.dismiss(toastId);
          if (response.ok && uploadResult.success) return uploadResult.url as string;
          toast.error(`Error al subir imagen de premio (${label})`);
          throw new Error("upload-failed");
        }
        return imgState.url;
      };

      let finalImageFirst = "";
      let finalImageSecond = "";
      let finalImageThird = "";
      try {
        finalImageFirst = await uploadPrizeImage(prizeImageFirst, "1er Puesto");
        finalImageSecond = await uploadPrizeImage(prizeImageSecond, "2do Puesto");
        finalImageThird = await uploadPrizeImage(prizeImageThird, "3er Puesto");
      } catch {
        setIsSubmitting(false);
        return;
      }

      const prizesJson = JSON.stringify({
        type: prizes.type,
        first: prizes.first.trim(),
        second: prizes.second.trim(),
        third: prizes.third.trim(),
        chimucoinsFirst: prizes.chimucoinsFirst,
        chimucoinsSecond: prizes.chimucoinsSecond,
        chimucoinsThird: prizes.chimucoinsThird,
        imageFirst: finalImageFirst,
        imageSecond: finalImageSecond,
        imageThird: finalImageThird,
      });

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("date", data.date);
      formData.append("maxPlayers", String(data.maxPlayers));
      formData.append("prizePool", prizesJson);
      formData.append("active", String(data.active));
      formData.append("isRestricted", String(data.isRestricted));
      formData.append("games", JSON.stringify(games));

      const result = challenge
        ? await updateChallenge(challenge.id, null, formData)
        : await createChallenge(null, formData);

      if (result?.success) {
        toast.success(result.message);
        router.push("/admin/challenges");
        router.refresh();
      } else {
        toast.error(result?.message || "Error al guardar desafío");
      }
    } catch (error) {
      toast.error("Error inesperado al guardar");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Swords className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {challenge ? "Editar Desafío" : "Crear Nuevo Desafío"}
          </h2>
          <p className="text-sm text-gray-400">
            Los desafíos permiten juegos de cualquier categoría con rotación continua por turnos y puntajes acumulados.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ===== LEFT COLUMN: Challenge Info ===== */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">
                Datos del Desafío
              </h3>

              {/* Challenge Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Desafío</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-gray-800 border-gray-700"
                        placeholder="Ej: Desafío Arcade Multijuegos"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date + Max Players */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="bg-gray-800 border-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cupo Máximo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-gray-800 border-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Prizes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Premios</label>
                  <select
                    value={prizes.type}
                    onChange={(e) => setPrizes((p) => ({ ...p, type: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 text-white text-xs h-8 px-2 rounded-md focus:border-white/20 transition-all appearance-none"
                  >
                    <option value="TEXTO">Texto (Clásico)</option>
                    <option value="CHIMUCOINS">Chimucoins</option>
                    <option value="AMBOS">Ambos</option>
                  </select>
                </div>

                {/* Texto Block with inline image uploads */}
                {(prizes.type === "TEXTO" || prizes.type === "AMBOS") && (
                  <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      Premios en Texto
                    </label>

                    {/* 1st Place */}
                    <div>
                      <label className="text-_2xs text-gray-400 mb-1 block">
                        {prizes.second ? "🥇 Primer Puesto" : "🏆 Premio del Desafío"}
                      </label>
                      <div className="flex gap-2 items-start">
                        <Input
                          value={prizes.first}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPrizes((p) => ({
                              ...p,
                              first: val,
                              second: val ? p.second : "",
                              third: val && p.second ? p.third : "",
                            }));
                            if (!val) {
                              setPrizeImageFirst({ url: "", pendingFile: null });
                              setPrizeImageSecond({ url: "", pendingFile: null });
                              setPrizeImageThird({ url: "", pendingFile: null });
                            }
                          }}
                          className="bg-gray-800 border-gray-700 flex-1"
                          placeholder="Ej: $100.000 + Skins"
                        />
                        <div className="shrink-0">
                          {prizeImageFirst.url ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-yellow-500/40 bg-black group">
                              <img
                                src={prizeImageFirst.url}
                                alt="Premio 1"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handlePrizeImageRemove("first")}
                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-red-400"
                                title="Quitar imagen"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <LocalImageUpload
                              label=""
                              onFileSelect={(f) => handlePrizeImageFile("first", f)}
                              onUrlSelect={(url) => handlePrizeImageUrl("first", url)}
                              defaultFolder="imagenes"
                              compact
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2nd Place */}
                    <div>
                      <label className="text-_2xs text-gray-400 mb-1 block">
                        🥈 Segundo Puesto (opcional)
                      </label>
                      <div className="flex gap-2 items-start">
                        <Input
                          value={prizes.second}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPrizes((p) => ({ ...p, second: val, third: val ? p.third : "" }));
                            if (!val) {
                              setPrizeImageSecond({ url: "", pendingFile: null });
                              setPrizeImageThird({ url: "", pendingFile: null });
                            }
                          }}
                          disabled={!prizes.first}
                          className="bg-gray-800 border-gray-700 disabled:opacity-40 flex-1"
                          placeholder={prizes.first ? "Ej: $50.000" : "Completá Primer Puesto primero"}
                        />
                        <div className="shrink-0">
                          {prizes.first && prizeImageSecond.url ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-500/40 bg-black group">
                              <img
                                src={prizeImageSecond.url}
                                alt="Premio 2"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handlePrizeImageRemove("second")}
                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-red-400"
                                title="Quitar imagen"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : prizes.first ? (
                            <LocalImageUpload
                              label=""
                              onFileSelect={(f) => handlePrizeImageFile("second", f)}
                              onUrlSelect={(url) => handlePrizeImageUrl("second", url)}
                              defaultFolder="imagenes"
                              compact
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-gray-700 flex items-center justify-center opacity-30">
                              <Camera className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div>
                      <label className="text-_2xs text-gray-400 mb-1 block">
                        🥉 Tercer Puesto (opcional)
                      </label>
                      <div className="flex gap-2 items-start">
                        <Input
                          value={prizes.third}
                          onChange={(e) => setPrizes((p) => ({ ...p, third: e.target.value }))}
                          disabled={!prizes.first || !prizes.second}
                          className="bg-gray-800 border-gray-700 disabled:opacity-40 flex-1"
                          placeholder={
                            !prizes.first || !prizes.second
                              ? "Completá Primer y Segundo Puesto"
                              : "Ej: $25.000"
                          }
                        />
                        <div className="shrink-0">
                          {prizes.first && prizes.second && prizeImageThird.url ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-orange-500/30 bg-black group">
                              <img
                                src={prizeImageThird.url}
                                alt="Premio 3"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handlePrizeImageRemove("third")}
                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-red-400"
                                title="Quitar imagen"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : prizes.first && prizes.second ? (
                            <LocalImageUpload
                              label=""
                              onFileSelect={(f) => handlePrizeImageFile("third", f)}
                              onUrlSelect={(url) => handlePrizeImageUrl("third", url)}
                              defaultFolder="imagenes"
                              compact
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-gray-700 flex items-center justify-center opacity-30">
                              <Camera className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chimucoins Block */}
                {(prizes.type === "CHIMUCOINS" || prizes.type === "AMBOS") && (
                  <div className="space-y-3 p-3 bg-blue-900/10 rounded-lg border border-blue-800/30">
                    <label className="text-xs font-semibold text-blue-400 block flex items-center gap-2">
                      <span>💎 Premios en Chimucoins</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                        Se entregan auto. al finalizar
                      </span>
                    </label>
                    <div>
                      <label className="text-_2xs text-blue-200/70 mb-1 block">🥇 Primer Puesto</label>
                      <Input
                        type="number"
                        min="0"
                        value={prizes.chimucoinsFirst}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrizes((p) => ({
                            ...p,
                            chimucoinsFirst: val,
                            chimucoinsSecond: val ? p.chimucoinsSecond : "",
                            chimucoinsThird: val && p.chimucoinsSecond ? p.chimucoinsThird : "",
                          }));
                        }}
                        className="bg-gray-800 border-gray-700 font-mono"
                        placeholder="Ej: 100"
                      />
                    </div>
                    <div>
                      <label className="text-_2xs text-blue-200/70 mb-1 block">🥈 Segundo Puesto (opcional)</label>
                      <Input
                        type="number"
                        min="0"
                        value={prizes.chimucoinsSecond}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrizes((p) => ({ ...p, chimucoinsSecond: val, chimucoinsThird: val ? p.chimucoinsThird : "" }));
                        }}
                        disabled={!prizes.chimucoinsFirst}
                        className="bg-gray-800 border-gray-700 font-mono disabled:opacity-40"
                        placeholder={prizes.chimucoinsFirst ? "Ej: 50" : "Completá Primer Puesto primero"}
                      />
                    </div>
                    <div>
                      <label className="text-_2xs text-blue-200/70 mb-1 block">🥉 Tercer Puesto (opcional)</label>
                      <Input
                        type="number"
                        min="0"
                        value={prizes.chimucoinsThird}
                        onChange={(e) => setPrizes((p) => ({ ...p, chimucoinsThird: e.target.value }))}
                        disabled={!prizes.chimucoinsFirst || !prizes.chimucoinsSecond}
                        className="bg-gray-800 border-gray-700 font-mono disabled:opacity-40"
                        placeholder={!prizes.chimucoinsFirst || !prizes.chimucoinsSecond ? "Completá Primer y Segundo Puesto" : "Ej: 25"}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-gray-800 border-gray-700 min-h-[120px]"
                        placeholder="Reglas y detalles del desafío..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ===== RIGHT COLUMN: Games Multi-category with Live Search ===== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  Juegos del Desafío
                </h3>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  Todas las categorías permitidas
                </span>
              </div>

              {/* Single Unified Searchable Game Combobox */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={gameSearch}
                    onChange={(e) => {
                      setGameSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Escribí para buscar o seleccioná un juego del catálogo..."
                    className="pl-9 pr-10 bg-gray-900 border-gray-700 text-sm h-11 text-white focus:border-primary/60 rounded-lg shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1.5 transition-colors"
                    title={isDropdownOpen ? "Cerrar catálogo" : "Desplegar todos los juegos"}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Floating Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-gray-950 border border-gray-700 rounded-xl shadow-2xl backdrop-blur-md divide-y divide-gray-800">
                    {Object.keys(categorizedGames).length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        {gameSearch
                          ? `No se encontró ningún juego para "${gameSearch}"`
                          : "No hay más juegos disponibles en el catálogo."}
                      </div>
                    ) : (
                      Object.keys(categorizedGames).map((category) => (
                        <div key={category} className="p-1.5">
                          <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 flex items-center justify-between rounded ${category === "ARENA_MULTIGAMES" ? "text-yellow-400 bg-yellow-900/20" : "text-primary bg-gray-900/60"}`}>
                            <span>━━ {CATEGORY_LABELS[category] || category} ━━</span>
                            <span className="text-[9px] text-gray-400 font-normal">
                              {categorizedGames[category].length} {categorizedGames[category].length === 1 ? "juego" : "juegos"}
                            </span>
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {categorizedGames[category].map((game) => (
                              <button
                                key={game.id}
                                type="button"
                                onClick={() => handleAddGame(game)}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/80 text-left transition-colors group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded overflow-hidden bg-black shrink-0 relative border border-gray-800">
                                    {game.coverImage ? (
                                      <img
                                        src={game.coverImage}
                                        alt={game.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Gamepad2 className="w-4 h-4 text-gray-600 m-auto" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                                    {game.name}
                                  </span>
                                </div>
                                <span className="text-xs bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0">
                                  <Plus className="w-3 h-3" /> Añadir
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {games.length === 0 && (
                <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                  <Gamepad2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No hay juegos agregados al desafío.</p>
                  <p className="text-gray-600 text-xs">Podes agregar juegos de cualquier categoría.</p>
                </div>
              )}

              {/* Added Games List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {games.map((game, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-800/60 border border-gray-700 rounded-lg p-3 flex gap-4 items-center"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700 bg-black shrink-0">
                      {game.image ? (
                        <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Gamepad2 size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white text-base leading-tight">{game.name}</p>
                          {game.categoryId && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${game.categoryId === "ARENA_MULTIGAMES" ? "text-yellow-400 bg-yellow-900/30" : "text-gray-400 bg-gray-700/60"}`}>
                              {CATEGORY_LABELS[game.categoryId] || game.categoryId}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGame(index)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          title="Eliminar juego"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Formato / Modalidad</label>
                        <Input
                          value={game.format}
                          onChange={(e) => updateGameFormat(index, e.target.value)}
                          className="bg-gray-900 border-gray-600 h-8 text-sm w-full max-w-[200px]"
                          placeholder="Ej: 1vs1, Puntos, Tiempo"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== FULL-WIDTH BOTTOM: Active / Restricted ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active checkbox */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-800 p-4 h-full">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Desafío Activo</FormLabel>
                    <p className="text-sm text-gray-400">
                      Si está desactivado, no aparecerá en la lista pública de desafíos.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* isRestricted checkbox */}
            <FormField
              control={form.control}
              name="isRestricted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-800 p-4 bg-yellow-900/10 border-yellow-900/30 h-full">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-yellow-500 font-bold">
                      Desafío Restrictivo (Requiere Aprobación)
                    </FormLabel>
                    <p className="text-sm text-yellow-600/80">
                      Si se activa, los jugadores quedarán &quot;Pendientes&quot; de aprobación. El menú &quot;Solicitudes&quot; se habilitará automáticamente en el panel mientras el desafío esté vigente.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Registered Players List (Edit Mode Only) */}
          {challenge && (
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Jugadores Inscriptos ({challenge.registrations?.length || 0})
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowAddPlayerModal(true)}
                  className="bg-primary/20 hover:bg-primary hover:text-black text-primary font-bold text-xs h-8 gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Agregar Jugador Manual
                </Button>
              </div>

              {challenge.registrations && challenge.registrations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {challenge.registrations.map((reg: any) => (
                    <div key={reg.playerId} className="flex items-center justify-between bg-gray-800/40 border border-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-black shrink-0 relative">
                          {reg.player?.image ? (
                            <img src={reg.player.image} alt={reg.player.alias || "Avatar"} className="object-cover w-full h-full" />
                          ) : (
                            <Users className="w-4 h-4 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {reg.player?.alias || reg.player?.name || "Sin nombre"}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {reg.score} pts · {reg.timesPlayed || 0} jugadas
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPlayerToDelete({ id: reg.playerId, name: reg.player?.alias || reg.player?.name || "Sin nombre" })}
                        className="text-gray-500 hover:text-red-400 shrink-0 h-8 w-8"
                        title="Eliminar inscripción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                  <p className="text-gray-400 text-xs mb-2">No hay jugadores inscriptos en este desafío todavía.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddPlayerModal(true)}
                    className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-7"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" /> Agregar primer jugador
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-black hover:bg-yellow-400 font-bold disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : challenge ? "Guardar Cambios" : "Crear Desafío"}
          </Button>
        </form>
      </Form>

      {challenge && (
        <AddManualPlayerModal
          challengeId={challenge.id}
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          availablePlayers={availablePlayers}
        />
      )}

      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Inscripción?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              ¿Estás seguro de que deseas eliminar la inscripción de <strong className="text-white">{playerToDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800 text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmRemovePlayer}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

