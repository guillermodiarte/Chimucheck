"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  Power,
  Edit2,
  Trash2,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  reorderAllBanners,
  toggleBannerStatus,
  toggleTopPlayersBanner,
  deleteBanner,
  updateBannerInterval,
} from "@/app/actions/banners";

export interface BannerItemData {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  active: boolean;
  order: number;
}

export type UnifiedRowItem =
  | {
      type: "banner";
      id: string;
      title: string;
      subtitle?: string | null;
      imageUrl: string;
      link?: string | null;
      active: boolean;
      order: number;
    }
  | {
      type: "top_players";
      id: "top_players";
      title: string;
      subtitle?: string | null;
      imageUrl?: string;
      link?: string | null;
      active: boolean;
      order: number;
    };

interface BannersManagerProps {
  initialBanners: BannerItemData[];
  initialTopPlayersEnabled: boolean;
  initialTopPlayersOrder: number;
  initialInterval?: number;
}

export function BannersManager({
  initialBanners,
  initialTopPlayersEnabled,
  initialTopPlayersOrder,
  initialInterval = 5,
}: BannersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [topEnabled, setTopEnabled] = useState(initialTopPlayersEnabled);
  const [interval, setIntervalState] = useState(initialInterval);

  // Build unified items list ordered by position
  const buildSortedList = (): UnifiedRowItem[] => {
    const list: UnifiedRowItem[] = [
      ...initialBanners.map((b) => ({
        type: "banner" as const,
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        link: b.link,
        active: b.active,
        order: b.order,
      })),
      {
        type: "top_players" as const,
        id: "top_players",
        title: "TOP MEJORES JUGADORES",
        subtitle: "Slide Dinámico de Ranking Top 5",
        active: topEnabled,
        order: initialTopPlayersOrder,
      },
    ];

    // Sort strictly by order
    return list.sort((a, b) => a.order - b.order);
  };

  const [items, setItems] = useState<UnifiedRowItem[]>(buildSortedList);

  // Move item by delta (-1 = up, +1 = down)
  const handleMove = (index: number, delta: number) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newList = [...items];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    // Reassign 1-based order
    const updated = newList.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setItems(updated);

    startTransition(async () => {
      const payload = updated.map((it) => ({
        id: it.id,
        type: it.type,
      }));
      const res = await reorderAllBanners(payload);
      if (res.success) {
        toast.success(`"${moved.title}" movido a la posición ${targetIndex + 1}`);
        router.refresh();
      } else {
        toast.error("Error al actualizar la posición");
        setItems(items); // revert
      }
    });
  };

  // Change position directly via select dropdown
  const handleChangePosition = (index: number, newPositionOneBased: number) => {
    const targetIndex = newPositionOneBased - 1;
    if (targetIndex === index || targetIndex < 0 || targetIndex >= items.length) return;

    const newList = [...items];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    const updated = newList.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setItems(updated);

    startTransition(async () => {
      const payload = updated.map((it) => ({
        id: it.id,
        type: it.type,
      }));
      const res = await reorderAllBanners(payload);
      if (res.success) {
        toast.success(`"${moved.title}" ahora está en la posición ${newPositionOneBased}`);
        router.refresh();
      } else {
        toast.error("Error al actualizar la posición");
        setItems(items);
      }
    });
  };

  // Toggle Top 5
  const handleToggleTop5 = (enabled: boolean) => {
    setTopEnabled(enabled);
    setItems((prev) =>
      prev.map((it) =>
        it.type === "top_players" ? { ...it, active: enabled } : it
      )
    );

    startTransition(async () => {
      const res = await toggleTopPlayersBanner(enabled);
      if (res.success) {
        toast.success(
          enabled
            ? "Top 5 Jugadores activado en el carrusel"
            : "Top 5 Jugadores desactivado del carrusel"
        );
        router.refresh();
      } else {
        toast.error("Error al cambiar estado");
        setTopEnabled(!enabled);
      }
    });
  };

  // Toggle standard banner status
  const handleToggleBanner = (id: string, currentStatus: boolean) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, active: !currentStatus } : it
      )
    );

    startTransition(async () => {
      await toggleBannerStatus(id, currentStatus);
      toast.success("Estado del banner actualizado");
      router.refresh();
    });
  };

  const handleSaveInterval = (newSeconds: number) => {
    const clamped = Math.max(2, Math.min(60, Number(newSeconds) || 5));
    setIntervalState(clamped);
    startTransition(async () => {
      const res = await updateBannerInterval(clamped);
      if (res.success) {
        toast.success(`Tiempo del carrusel configurado a ${clamped} segundos`);
        router.refresh();
      } else {
        toast.error("Error al guardar el tiempo del carrusel");
      }
    });
  };

  const topPlayersItem = items.find((i) => i.type === "top_players");
  const topPlayersCurrentIndex = items.findIndex((i) => i.type === "top_players");

  return (
    <div className="space-y-6">
      {/* Top 5 Highlight Control Card */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900/95 to-amber-950/25 border-2 border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                Top 5 Mejores Jugadores
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  topEnabled
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                }`}
              >
                {topEnabled ? `Activo (Posición ${topPlayersCurrentIndex + 1})` : "Desactivado"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Muestra automáticamente una diapositiva premium con los 5 líderes en Chimucoins. Su posición es compartida y consistente con todos los demás banners.
            </p>
          </div>
        </div>

        {/* Position & Toggle Control for Top 5 */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-800">
          <div className="flex items-center gap-2 bg-gray-950/80 border border-gray-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-gray-300 font-semibold">Posición:</span>
            <select
              value={topPlayersCurrentIndex + 1}
              onChange={(e) =>
                handleChangePosition(topPlayersCurrentIndex, Number(e.target.value))
              }
              disabled={isPending}
              className="bg-gray-900 border border-gray-700 text-amber-400 font-bold text-sm rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {items.map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  #{idx + 1} {idx === 0 ? "(Primero)" : idx === items.length - 1 ? "(Último)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-gray-950/80 border border-gray-800 px-3.5 py-1.5 rounded-xl">
            <span className="text-xs text-white font-medium">Visible:</span>
            <Switch
              checked={topEnabled}
              onCheckedChange={handleToggleTop5}
              disabled={isPending}
              className="data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Carrusel Auto-advance Timer Control Card */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900/95 to-cyan-950/25 border-2 border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                Tiempo de Transición Automática
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                {interval} segundos por banner
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Configura cuántos segundos permanece cada diapositiva en pantalla antes de cambiar automáticamente a la siguiente.
            </p>
          </div>
        </div>

        {/* Quick presets and input */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-800">
          <div className="flex items-center gap-1.5 bg-gray-950/80 border border-gray-800 p-1.5 rounded-xl">
            {[3, 5, 7, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleSaveInterval(sec)}
                disabled={isPending}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  interval === sec
                    ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-gray-950/80 border border-gray-800 px-3 py-1.5 rounded-xl">
            <input
              type="number"
              min={2}
              max={60}
              value={interval}
              onChange={(e) => setIntervalState(Number(e.target.value))}
              onBlur={() => handleSaveInterval(interval)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInterval(interval);
              }}
              disabled={isPending}
              className="w-14 bg-gray-900 border border-gray-700 text-white font-mono font-bold text-sm text-center rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <span className="text-xs text-gray-400 font-medium">seg</span>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSaveInterval(interval)}
              disabled={isPending}
              className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 text-xs px-2.5 py-1 h-auto cursor-pointer"
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>

      {/* Unified Table Description */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400 px-1">
        <span>
          Total de diapositivas en carrusel: <strong className="text-white">{items.length}</strong> (Organizados sin duplicados)
        </span>
        <span className="hidden sm:inline text-gray-500">
          Usa las flechas ▲/▼ o el selector para reordenar
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-gray-800 rounded-xl overflow-hidden bg-black/50 shadow-2xl">
        <Table>
          <TableHeader className="bg-gray-900/90">
            <TableRow className="border-gray-800 hover:bg-gray-900/90">
              <TableHead className="text-gray-300 w-[140px]">Posición</TableHead>
              <TableHead className="text-gray-300 w-[100px]">Vista Previa</TableHead>
              <TableHead className="text-gray-300">Título & Tipo</TableHead>
              <TableHead className="text-gray-300 w-[120px]">Estado</TableHead>
              <TableHead className="text-right text-gray-300 w-[160px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-black divide-y divide-gray-800/80">
            {items.map((item, index) => {
              const isTop5 = item.type === "top_players";
              const isFirst = index === 0;
              const isLast = index === items.length - 1;

              return (
                <TableRow
                  key={item.id}
                  className={`border-gray-800 transition-colors ${
                    isTop5
                      ? "bg-amber-950/15 hover:bg-amber-950/25 border-l-4 border-l-amber-400"
                      : "hover:bg-gray-900/40"
                  }`}
                >
                  {/* Position selector and reorder buttons */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={index + 1}
                        onChange={(e) => handleChangePosition(index, Number(e.target.value))}
                        disabled={isPending}
                        className={`font-black text-sm rounded-lg px-2 py-1 border cursor-pointer ${
                          isTop5
                            ? "bg-amber-950 border-amber-500/50 text-amber-300"
                            : "bg-gray-900 border-gray-700 text-white"
                        }`}
                      >
                        {items.map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            #{idx + 1}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMove(index, -1)}
                          disabled={isFirst || isPending}
                          title="Subir posición"
                          className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-900 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          disabled={isLast || isPending}
                          title="Bajar posición"
                          className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-900 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </TableCell>

                  {/* Thumbnail */}
                  <TableCell>
                    {isTop5 ? (
                      <div className="w-16 h-10 rounded border border-amber-500/40 bg-gradient-to-br from-amber-950 to-gray-900 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        <Trophy className="w-5 h-5" />
                      </div>
                    ) : item.imageUrl?.endsWith(".mp4") || item.imageUrl?.endsWith(".webm") ? (
                      <video
                        src={item.imageUrl}
                        className="w-16 h-10 object-cover rounded border border-gray-800"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-10 object-cover rounded border border-gray-800"
                      />
                    )}
                  </TableCell>

                  {/* Title & Type badge */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {item.title}
                        </span>
                        {isTop5 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            <Sparkles className="w-3 h-3" /> Dinámico
                          </span>
                        ) : null}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-gray-400">{item.subtitle}</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        item.active
                          ? "bg-green-900/30 text-green-400 border border-green-900"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isTop5 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleTop5(!item.active)}
                          className="text-gray-400 hover:text-white"
                          title={item.active ? "Desactivar Top 5" : "Activar Top 5"}
                        >
                          <Power className={`w-4 h-4 ${item.active ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleBanner(item.id, item.active)}
                            className="text-gray-400 hover:text-white"
                            title={item.active ? "Desactivar" : "Activar"}
                          >
                            <Power className={`w-4 h-4 ${item.active ? "text-green-500" : "text-gray-500"}`} />
                          </Button>
                          <Link href={`/admin/banners/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <DeleteButton
                            id={item.id}
                            deleteAction={deleteBanner}
                            itemName="Banner"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {items.map((item, index) => {
          const isTop5 = item.type === "top_players";
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border space-y-3 ${
                isTop5
                  ? "bg-gradient-to-b from-amber-950/20 to-gray-900 border-amber-500/40"
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {isTop5 ? (
                  <div className="w-16 h-16 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-7 h-7" />
                  </div>
                ) : item.imageUrl?.endsWith(".mp4") || item.imageUrl?.endsWith(".webm") ? (
                  <video
                    src={item.imageUrl}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-800 border border-gray-700 shrink-0"
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-800 border border-gray-700 shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-white text-base truncate">
                      {item.title}
                    </h3>
                    {isTop5 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        Top 5
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">Posición:</span>
                    <select
                      value={index + 1}
                      onChange={(e) => handleChangePosition(index, Number(e.target.value))}
                      disabled={isPending}
                      className="bg-gray-800 border border-gray-700 text-white font-bold text-xs rounded px-2 py-1"
                    >
                      {items.map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          #{idx + 1}
                        </option>
                      ))}
                    </select>

                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        item.active
                          ? "bg-green-900/30 text-green-400 border border-green-900"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order buttons & Actions row */}
              <div className="flex items-center justify-between border-t border-gray-800 pt-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMove(index, -1)}
                    disabled={isFirst || isPending}
                    className="h-8 px-2 bg-gray-800 border-gray-700 text-gray-300"
                  >
                    <ArrowUp className="w-3.5 h-3.5 mr-1" /> Subir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMove(index, 1)}
                    disabled={isLast || isPending}
                    className="h-8 px-2 bg-gray-800 border-gray-700 text-gray-300"
                  >
                    <ArrowDown className="w-3.5 h-3.5 mr-1" /> Bajar
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  {isTop5 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleTop5(!item.active)}
                      className="h-8 bg-gray-800 border-gray-700 text-gray-300"
                    >
                      <Power className={`w-3.5 h-3.5 mr-1 ${item.active ? "text-green-500" : "text-gray-500"}`} />
                      {item.active ? "Desactivar" : "Activar"}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleBanner(item.id, item.active)}
                        className="h-8 bg-gray-800 border-gray-700 text-gray-300"
                      >
                        <Power className={`w-3.5 h-3.5 ${item.active ? "text-green-500" : "text-gray-500"}`} />
                      </Button>
                      <Link href={`/admin/banners/${item.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 bg-gray-800 border-gray-700 text-blue-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <DeleteButton
                        id={item.id}
                        deleteAction={deleteBanner}
                        itemName="Banner"
                        className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
