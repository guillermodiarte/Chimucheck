"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { toast } from "sonner";
import { createRaffle, updateRaffle, RaffleFormData } from "@/app/actions/raffles";
import {
  Gift,
  Calendar as CalendarIcon,
  Users,
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface RafflePrizeItem {
  id?: string;
  title: string;
  description: string;
  image: string;
  order: number;
}

interface RaffleFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    prize: string;
    prizeImage: string | null;
    images?: string | null;
    type: string;
    status: string;
    maxEntries: number | null;
    requiresLogin: boolean;
    drawDate: string | Date | null;
    prizes?: Array<{
      id?: string;
      title: string;
      description?: string | null;
      image?: string | null;
      order: number;
    }>;
  };
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

export function RaffleForm({ initialData }: RaffleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Parse existing images
  const initialImagesList: string[] = useMemo(() => {
    if (initialData?.images) {
      try {
        const parsed = JSON.parse(initialData.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (initialData?.prizeImage) return [initialData.prizeImage];
    return [];
  }, [initialData]);

  // Parse existing prizes or default to single prize
  const initialPrizesList: RafflePrizeItem[] = useMemo(() => {
    if (initialData?.prizes && initialData.prizes.length > 0) {
      return initialData.prizes.map((p, idx) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        image: p.image || "",
        order: p.order || idx + 1,
      }));
    }
    return [
      {
        order: 1,
        title: initialData?.prize || "",
        description: "",
        image: initialData?.prizeImage || "",
      },
    ];
  }, [initialData]);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [prizes, setPrizes] = useState<RafflePrizeItem[]>(initialPrizesList);

  const handleAddPrize = () => {
    setPrizes((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        title: "",
        description: "",
        image: "",
      },
    ]);
  };

  const handleRemovePrize = (index: number) => {
    if (prizes.length <= 1) {
      toast.error("Debe haber al menos un premio");
      return;
    }
    setPrizes((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((p, idx) => ({ ...p, order: idx + 1 }))
    );
  };

  const handleUpdatePrize = (index: number, field: keyof RafflePrizeItem, value: any) => {
    setPrizes((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  // Multiple Images State
  const [images, setImages] = useState<string[]>(initialImagesList);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [urlInput, setUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [type, setType] = useState<"OPEN" | "MANUAL">(
    (initialData?.type as "OPEN" | "MANUAL") || "OPEN"
  );
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED">(
    (initialData?.status as "DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED") || "DRAFT"
  );
  const [maxEntries, setMaxEntries] = useState<string>(
    initialData?.maxEntries ? String(initialData.maxEntries) : ""
  );

  // Date and Time Picker State
  const initialDateObj = initialData?.drawDate ? new Date(initialData.drawDate) : null;
  const [drawDate, setDrawDate] = useState<Date | null>(initialDateObj);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Calendar navigation state
  const [viewDate, setViewDate] = useState<Date>(initialDateObj || new Date());
  const [selectedHour, setSelectedHour] = useState<number>(
    initialDateObj ? initialDateObj.getHours() : 20
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(
    initialDateObj ? initialDateObj.getMinutes() : 0
  );

  // Handle image upload from LocalImageUpload
  const handleFileSelect = async (file: File) => {
    setUploadingImage(true);
    const toastId = toast.loading("Subiendo imagen...");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "sorteos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        toast.dismiss(toastId);
        toast.error("Error al subir imagen");
        setUploadingImage(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        setImages((prev) => [...prev, data.url]);
        setActiveImageIndex(images.length);
        toast.dismiss(toastId);
        toast.success("Imagen agregada con éxito");
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Error al subir archivo");
    } finally {
      setUploadingImage(false);
    }
  };

  // Add URL directly
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setActiveImageIndex(images.length);
    setUrlInput("");
    toast.success("Imagen agregada");
  };

  // Remove image
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeImageIndex >= indexToRemove && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };

  // Set as primary / cover image (index 0)
  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const item = prev[index];
      const without = prev.filter((_, idx) => idx !== index);
      return [item, ...without];
    });
    setActiveImageIndex(0);
    toast.success("Imagen fijada como portada");
  };

  // Date picker helper calculations
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day, selectedHour, selectedMinute);
    setDrawDate(newDate);
  };

  const handleApplyDateTime = () => {
    if (drawDate) {
      const updated = new Date(drawDate);
      updated.setHours(selectedHour);
      updated.setMinutes(selectedMinute);
      setDrawDate(updated);
    } else {
      const now = new Date(currentYear, currentMonth, 1, selectedHour, selectedMinute);
      setDrawDate(now);
    }
    setIsDatePickerOpen(false);
    toast.success("Fecha y horario actualizados");
  };

  const handleClearDate = () => {
    setDrawDate(null);
    setIsDatePickerOpen(false);
  };

  // Presets
  const setPresetToday = () => {
    const today = new Date();
    today.setHours(20, 0, 0, 0);
    setDrawDate(today);
    setSelectedHour(20);
    setSelectedMinute(0);
    setIsDatePickerOpen(false);
  };

  const setPresetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    setDrawDate(tomorrow);
    setSelectedHour(20);
    setSelectedMinute(0);
    setIsDatePickerOpen(false);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    const validPrizes = prizes
      .filter((p) => p.title.trim().length > 0)
      .map((p, idx) => ({
        id: p.id,
        title: p.title.trim(),
        description: p.description.trim() || undefined,
        image: p.image.trim() || undefined,
        order: idx + 1,
      }));

    if (validPrizes.length === 0) {
      toast.error("Debes ingresar al menos un premio");
      return;
    }

    setLoading(true);

    try {
      const payload: RaffleFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        prize: validPrizes[0].title,
        prizeImage: images[0] || validPrizes[0].image || undefined,
        images,
        type,
        status,
        maxEntries: maxEntries ? parseInt(maxEntries, 10) : null,
        requiresLogin: true,
        drawDate: drawDate ? drawDate.toISOString() : null,
        prizes: validPrizes,
      };

      if (initialData?.id) {
        const res = await updateRaffle(initialData.id, payload);
        if (res.success) {
          toast.success("Sorteo actualizado correctamente");
          router.push(`/admin/raffles/${initialData.id}`);
          router.refresh();
        } else {
          toast.error(res.message || "Error al actualizar");
        }
      } else {
        const res = await createRaffle(payload);
        if (res.success && res.raffle) {
          toast.success("Sorteo creado exitosamente");
          router.push(`/admin/raffles/${res.raffle.id}`);
          router.refresh();
        } else {
          toast.error(res.message || "Error al crear sorteo");
        }
      }
    } catch (error: unknown) {
      console.error("Submit error:", error);
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {/* 2-Column Responsive Grid that maximizes screen width */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Main Information (7 cols) */}
        <div className="lg:col-span-7 space-y-6 bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-secondary" />
              Información Principal
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Configura el título, premios por puestos, detalles y modalidad del sorteo.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-200 font-semibold text-sm">
              Título del Sorteo <span className="text-secondary">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Gran Sorteo Aniversario ChimuCheck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/60 border-zinc-800 focus:border-secondary text-white h-11 text-base"
              required
            />
          </div>

          {/* PREMIOS Y PUESTOS (MULTIPLE PRIZES) */}
          <div className="space-y-4 pt-3 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-gray-200 font-bold text-base flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary" />
                  Premios por Puestos ({prizes.length})
                </Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  En el sorteo en vivo se sorteará del último puesto al primer puesto (1º Gran Ganador).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPrize}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 text-xs font-bold transition-all cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                Agregar Puesto
              </button>
            </div>

            <div className="space-y-3">
              {prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border border-zinc-800 rounded-2xl p-4 space-y-3 relative group hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider ${
                          p.order === 1
                            ? "bg-yellow-400 text-black shadow-md shadow-yellow-500/20"
                            : p.order === 2
                            ? "bg-zinc-200 text-black"
                            : p.order === 3
                            ? "bg-amber-600 text-white"
                            : "bg-zinc-800 text-gray-300 border border-zinc-700"
                        }`}
                      >
                        {p.order === 1
                          ? "🥇 1º PUESTO (GRAN PREMIO)"
                          : p.order === 2
                          ? "🥈 2º PUESTO"
                          : p.order === 3
                          ? "🥉 3º PUESTO"
                          : `🎖️ ${p.order}º PUESTO`}
                      </span>
                    </div>

                    {prizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePrize(idx)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20 transition-colors cursor-pointer"
                        title="Eliminar este puesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Nombre del Premio *
                      </span>
                      <Input
                        placeholder={
                          p.order === 1
                            ? "Ej: PlayStation 5 / PC Gamer"
                            : p.order === 2
                            ? "Ej: Auriculares HyperX Cloud"
                            : "Ej: Mouse Gamer + Pad XL"
                        }
                        value={p.title}
                        onChange={(e) => handleUpdatePrize(idx, "title", e.target.value)}
                        className="bg-zinc-950 border-zinc-800 focus:border-secondary text-white h-10 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Detalle / Especificación (opcional)
                      </span>
                      <Input
                        placeholder="Ej: Nuevo en caja, color a elección"
                        value={p.description}
                        onChange={(e) => handleUpdatePrize(idx, "description", e.target.value)}
                        className="bg-zinc-950 border-zinc-800 focus:border-secondary text-white h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <Label htmlFor="description" className="text-gray-200 font-semibold text-sm">
              Descripción, Bases y Condiciones
            </Label>
            <Textarea
              id="description"
              placeholder="Explica detalladamente qué incluye el sorteo, requisitos especiales y cómo se entregarán los premios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/60 border-zinc-800 focus:border-secondary text-white min-h-[120px] text-sm leading-relaxed"
            />
          </div>

          {/* Type & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-zinc-800/80">
            {/* Type selector */}
            <div className="space-y-3">
              <Label className="text-gray-200 font-semibold text-sm">Modalidad</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setType("OPEN")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    type === "OPEN"
                      ? "bg-secondary/15 border-secondary text-white shadow-lg shadow-yellow-500/10"
                      : "bg-black/40 border-zinc-800 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold text-sm text-secondary">ABIERTO</div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    Inscripción libre para jugadores aprobados.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setType("MANUAL")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    type === "MANUAL"
                      ? "bg-blue-500/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                      : "bg-black/40 border-zinc-800 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold text-sm text-blue-400">MANUAL</div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    El admin selecciona a los participantes.
                  </p>
                </button>
              </div>
            </div>

            {/* Status selector */}
            <div className="space-y-3">
              <Label className="text-gray-200 font-semibold text-sm">Estado Actual</Label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED")
                }
                className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-secondary h-12"
              >
                <option value="DRAFT">Borrador (Oculto para jugadores)</option>
                <option value="ACTIVE">Activo (Visible e inscripciones abiertas)</option>
                <option value="DRAWING">En Sorteo (Inscripciones cerradas)</option>
                <option value="FINISHED">Finalizado (Ganador anunciado)</option>
              </select>
              <p className="text-[11px] text-gray-500">
                Selecciona <strong className="text-emerald-400">Activo</strong> para que aparezca disponible para todos.
              </p>
            </div>
          </div>

          {/* Max Entries & Interactive Date/Time Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-zinc-800/80">
            {/* Max entries */}
            <div className="space-y-2">
              <Label htmlFor="maxEntries" className="text-gray-200 font-semibold text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                Cupo Máximo de Participantes
              </Label>
              <Input
                id="maxEntries"
                type="number"
                min="1"
                placeholder="Sin límite (Ilimitado)"
                value={maxEntries}
                onChange={(e) => setMaxEntries(e.target.value)}
                className="bg-black/60 border-zinc-800 focus:border-secondary text-white h-11"
              />
              <p className="text-[11px] text-gray-500">
                Dejar vacío para permitir participantes ilimitados.
              </p>
            </div>

            {/* INTERACTIVE DATE & TIME SELECTOR TRIGGER */}
            <div className="space-y-2">
              <Label className="text-gray-200 font-semibold text-sm flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-secondary" />
                Fecha y Horario del Sorteo
              </Label>

              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full h-11 px-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-secondary/60 text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <CalendarIcon className="w-4 h-4 text-secondary shrink-0" />
                  {drawDate ? (
                    <span className="text-white font-medium text-sm">
                      {formatDate(drawDate)} •{" "}
                      {String(drawDate.getHours()).padStart(2, "0")}:
                      {String(drawDate.getMinutes()).padStart(2, "0")} hs
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Elegir fecha y horario en calendario...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-secondary font-bold shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{drawDate ? "Modificar" : "Seleccionar"}</span>
                </div>
              </button>

              {drawDate && (
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"
                >
                  <X className="w-3.5 h-3.5" /> Quitar fecha estimada
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Multiple Images Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-6 bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
          <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-secondary" />
                Imágenes del Premio ({images.length})
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Sube una o varias fotos del premio. La primera será la portada.
              </p>
            </div>
            {images.length > 0 && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                {images.length} foto(s)
              </span>
            )}
          </div>

          {/* Large Main Preview */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-zinc-800 bg-black flex items-center justify-center group shadow-xl">
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt="Vista previa premio"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                  {activeImageIndex === 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      Portada Principal
                    </>
                  ) : (
                    <span>Foto {activeImageIndex + 1} de {images.length}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(activeImageIndex)}
                  className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-700 text-white p-2 rounded-full transition-colors shadow-lg"
                  title="Eliminar esta imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-8 space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-gray-500">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-gray-300">
                  Sin imágenes cargadas todavía
                </p>
                <p className="text-xs text-gray-500">
                  Usa los botones abajo para subir fotos del premio
                </p>
              </div>
            )}
          </div>

          {/* Upload and URL input */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <LocalImageUpload
                onFileSelect={handleFileSelect}
                onUrlSelect={(url) => {
                  setImages((prev) => [...prev, url]);
                  setActiveImageIndex(images.length);
                  toast.success("Imagen agregada desde biblioteca");
                }}
                label={uploadingImage ? "Subiendo..." : "Subir Imagen / Fotos"}
                className="w-full"
              />
            </div>

            {/* Direct URL input */}
            <div className="flex gap-2">
              <Input
                placeholder="O pega una URL: https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className="bg-black/60 border-zinc-800 text-xs text-white h-10"
              />
              <Button
                type="button"
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
                className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 h-10 text-xs px-3 shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>

          {/* Thumbnail Gallery & Management */}
          {images.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <Label className="text-xs text-gray-400 font-semibold">
                Miniaturas (haz clic para verla en grande o cambiar la portada):
              </Label>
              <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {images.map((imgUrl, idx) => {
                  const isSelected = activeImageIndex === idx;
                  const isCover = idx === 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                        isSelected
                          ? "border-secondary ring-2 ring-secondary/30 scale-102"
                          : "border-zinc-800 hover:border-zinc-600 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {isCover && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          PORTADA
                        </div>
                      )}

                      {!isCover && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCover(idx);
                          }}
                          className="absolute bottom-1 left-1 right-1 bg-black/80 hover:bg-secondary hover:text-black text-white text-[9px] font-bold py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-center"
                          title="Hacer foto principal"
                        >
                          Hacer Portada
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="flex items-center justify-between p-6 bg-zinc-950/80 border border-zinc-800 rounded-3xl backdrop-blur-md">
        <Link href={initialData?.id ? `/admin/raffles/${initialData.id}` : "/admin/raffles"}>
          <Button
            type="button"
            className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white border border-zinc-700 px-6 font-semibold"
            disabled={loading}
          >
            Cancelar
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading || uploadingImage}
            className="bg-secondary text-black hover:bg-yellow-400 font-black text-base px-8 py-6 h-auto rounded-2xl shadow-xl shadow-yellow-500/20 gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? "Guardando..." : initialData?.id ? "Actualizar Sorteo" : "Crear Sorteo"}
          </Button>
        </div>
      </div>

      {/* POPUP / MODAL: INTERACTIVE CALENDAR & TIME PICKER */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-bold text-white">Fecha y Horario del Sorteo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={setPresetToday}
                className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-gray-300 font-semibold rounded-xl transition-colors"
              >
                Hoy 20:00 hs
              </button>
              <button
                type="button"
                onClick={setPresetTomorrow}
                className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-gray-300 font-semibold rounded-xl transition-colors"
              >
                Mañana 20:00 hs
              </button>
            </div>

            {/* CALENDAR VIEW */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              {/* Month & Year Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-zinc-800 text-gray-300 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white text-sm">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-zinc-800 text-gray-300 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500">
                {DAY_NAMES.map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty placeholders for offset */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Actual Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    drawDate &&
                    drawDate.getDate() === day &&
                    drawDate.getMonth() === currentMonth &&
                    drawDate.getFullYear() === currentYear;

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-9 w-full rounded-xl text-sm font-semibold transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-secondary text-black font-black shadow-lg shadow-yellow-500/30 scale-105"
                          : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIME SELECTOR (Hours & Minutes) */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Clock className="w-4 h-4 text-secondary" />
                <span>Horario de Realización (Hora y Minutos):</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                {/* Hour */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 uppercase font-mono mb-1">Hora</span>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-lg text-center focus:border-secondary focus:outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-2xl font-bold text-gray-500 mt-4">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 uppercase font-mono mb-1">Minutos</span>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                    className="bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-lg text-center focus:border-secondary focus:outline-none"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 41, 45, 50, 55].map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-sm font-bold text-gray-400 mt-4 font-mono">HS</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                onClick={handleClearDate}
                className="bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white text-xs border border-zinc-700"
              >
                Limpiar Fecha
              </Button>

              <Button
                type="button"
                onClick={handleApplyDateTime}
                className="bg-secondary text-black hover:bg-yellow-400 font-bold text-sm px-6"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Aplicar Fecha
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
