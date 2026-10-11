"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Trophy, FileText, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface VotingContestFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    startDate: string | Date;
    endDate: string | Date;
    status: string;
  };
}

function toDatetimeLocal(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VotingContestForm({ initialData }: VotingContestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [startDate, setStartDate] = useState(toDatetimeLocal(initialData?.startDate));
  const [endDate, setEndDate] = useState(toDatetimeLocal(initialData?.endDate));
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");

  const isEditing = !!initialData;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      toast.error("Completá todos los campos requeridos");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/admin/voting/${initialData.id}`
        : "/api/admin/voting";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          startDate,
          endDate,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      const data = await res.json();
      toast.success(isEditing ? "Concurso actualizado" : "Concurso creado");

      if (!isEditing) {
        router.push(`/admin/voting/${data.contest.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = [
    { value: "DRAFT", label: "Borrador", color: "text-gray-400" },
    { value: "ACTIVE", label: "Activo", color: "text-emerald-400" },
    { value: "FINISHED", label: "Finalizado", color: "text-yellow-400" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/voting">
          <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {isEditing ? "Editar Concurso" : "Nuevo Concurso de Votación"}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEditing
              ? "Modificá los datos del concurso"
              : "Creá un nuevo concurso para que la comunidad vote sus imágenes favoritas"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6 bg-zinc-900/60 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-wider mb-4">
            <FileText className="w-4 h-4" />
            Información General
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-semibold">
              Título del Concurso <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: La mejor foto gamer de octubre"
              className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-semibold">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí de qué trata este concurso, qué tipo de imágenes se van a votar..."
              rows={4}
              className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary resize-none"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-white font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-secondary" />
              Estado
            </Label>
            <div className="flex gap-3">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    status === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-white/10 bg-black/20 text-gray-400 hover:border-white/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column – Dates */}
        <div className="space-y-6 bg-zinc-900/60 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-wider mb-4">
            <Calendar className="w-4 h-4" />
            Fechas de Votación
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-white font-semibold">
              Fecha y hora de inicio <span className="text-red-400">*</span>
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-black/40 border-white/10 text-white focus:border-secondary [color-scheme:dark]"
              required
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-white font-semibold">
              Fecha y hora de cierre <span className="text-red-400">*</span>
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-black/40 border-white/10 text-white focus:border-secondary [color-scheme:dark]"
              required
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <Clock className="w-4 h-4" />
              Auto-gestión de estado
            </div>
            <p className="text-xs leading-relaxed">
              El concurso pasará automáticamente a <strong>Activo</strong> cuando llegue la fecha de inicio, y a{" "}
              <strong>Finalizado</strong> cuando llegue la fecha de cierre. También podés cambiarlo manualmente.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Link href="/admin/voting">
          <Button type="button" variant="ghost" className="text-gray-400 hover:text-white">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={loading}
          className="bg-secondary text-black font-black px-8 hover:bg-yellow-400 transition-all"
        >
          {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Concurso"}
        </Button>
      </div>
    </form>
  );
}
