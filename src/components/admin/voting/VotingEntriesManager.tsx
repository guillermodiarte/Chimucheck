"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Instagram,
  Upload,
  Trash2,
  User,
  ImageIcon,
  Loader2,
  Heart,
  Plus,
} from "lucide-react";

interface VotingEntry {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  createdAt: string;
  _count: { votes: number };
}

interface VotingEntriesManagerProps {
  contestId: string;
  contestStatus: string;
  initialEntries: VotingEntry[];
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "imagenes");
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Error al subir la imagen");
  return data.url;
}

export function VotingEntriesManager({
  contestId,
  contestStatus,
  initialEntries,
}: VotingEntriesManagerProps) {
  const [entries, setEntries] = useState<VotingEntry[]>(initialEntries);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [instagram, setInstagram] = useState("");
  const [authorName, setAuthorName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 20MB");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleAddEntry() {
    if (!selectedFile) {
      toast.error("Seleccioná una imagen primero");
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(selectedFile);

      const res = await fetch(`/api/admin/voting/${contestId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          instagramAccount: instagram.trim() || null,
          authorName: authorName.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al agregar la imagen");
      }

      const data = await res.json();
      setEntries((prev) => [
        ...prev,
        { ...data.entry, _count: { votes: 0 } },
      ]);
      toast.success("Imagen agregada al concurso");

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setInstagram("");
      setAuthorName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("¿Eliminar esta imagen del concurso? También se eliminarán sus votos.")) return;

    try {
      const res = await fetch(
        `/api/admin/voting/${contestId}/entries/${entryId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error al eliminar");
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Imagen eliminada");
    } catch {
      toast.error("No se pudo eliminar la imagen");
    }
  }

  const totalVotes = entries.reduce((acc, e) => acc + e._count.votes, 0);
  const sortedEntries = [...entries].sort((a, b) => b._count.votes - a._count.votes);

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">{entries.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Imágenes</p>
        </div>
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-secondary">{totalVotes}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Votos Totales</p>
        </div>
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 text-center">
          <p className={`text-3xl font-black ${
            contestStatus === "ACTIVE" ? "text-emerald-400" :
            contestStatus === "FINISHED" ? "text-yellow-400" : "text-gray-400"
          }`}>
            {contestStatus === "ACTIVE" ? "🟢" : contestStatus === "FINISHED" ? "🏆" : "⬜"}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">
            {contestStatus === "ACTIVE" ? "En curso" : contestStatus === "FINISHED" ? "Finalizado" : "Borrador"}
          </p>
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-secondary" />
          Agregar Imagen al Concurso
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image upload */}
          <div className="space-y-3">
            <Label className="text-white font-semibold">
              Imagen <span className="text-red-400">*</span>
            </Label>
            <div
              className="relative h-52 rounded-xl border-2 border-dashed border-white/20 hover:border-secondary/50 transition-all cursor-pointer overflow-hidden bg-black/20"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-sm font-medium">Clic para seleccionar imagen</p>
                  <p className="text-xs">PNG, JPG, WEBP – Máx 20MB</p>
                </div>
              )}
              {preview && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white text-sm font-bold">Cambiar imagen</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-white font-semibold flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-400" />
                Cuenta de Instagram
              </Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@chimuchek"
                className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary"
              />
              <p className="text-xs text-gray-500">
                La cuenta de Instagram que envió la imagen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorName" className="text-white font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Nombre del Autor
              </Label>
              <Input
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Juan García"
                className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary"
              />
            </div>

            <Button
              type="button"
              onClick={handleAddEntry}
              disabled={!selectedFile || uploading}
              className="w-full bg-secondary text-black font-black hover:bg-yellow-400 transition-all mt-4"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Agregar Imagen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Entries grid */}
      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">
            Imágenes ({entries.length})
            {contestStatus === "FINISHED" && (
              <span className="ml-2 text-yellow-400 text-sm font-normal">— ordenadas por votos</span>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(contestStatus === "FINISHED" ? sortedEntries : entries).map((entry, idx) => {
              const isTop3 = contestStatus === "FINISHED" && idx < 3;
              const podiumColors = ["border-yellow-400 shadow-yellow-400/30", "border-gray-300 shadow-gray-300/30", "border-amber-600 shadow-amber-600/30"];
              const podiumEmojis = ["🥇", "🥈", "🥉"];

              return (
                <div
                  key={entry.id}
                  className={`relative group rounded-2xl overflow-hidden border transition-all duration-300 ${
                    isTop3
                      ? `${podiumColors[idx]} border-2 shadow-lg`
                      : "border-white/10 hover:border-white/30"
                  } bg-zinc-950`}
                >
                  {/* Podium badge */}
                  {isTop3 && (
                    <div className="absolute top-2 left-2 z-10 text-2xl drop-shadow-lg">
                      {podiumEmojis[idx]}
                    </div>
                  )}

                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={entry.imageUrl}
                      alt={entry.authorName || "Imagen"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Vote count */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                      <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                      <span className="text-white text-xs font-bold">{entry._count.votes}</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Author info */}
                  <div className="p-3 space-y-0.5">
                    {entry.instagramAccount && (
                      <p className="text-pink-400 text-xs font-bold flex items-center gap-1">
                        <Instagram className="w-3 h-3" />
                        {entry.instagramAccount}
                      </p>
                    )}
                    {entry.authorName && (
                      <p className="text-gray-300 text-xs truncate">{entry.authorName}</p>
                    )}
                    {!entry.instagramAccount && !entry.authorName && (
                      <p className="text-gray-600 text-xs italic">Sin autor</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-16 text-gray-500 space-y-3">
          <ImageIcon className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-sm">Todavía no hay imágenes en este concurso.</p>
          <p className="text-xs">Subí la primera imagen usando el formulario de arriba.</p>
        </div>
      )}
    </div>
  );
}
