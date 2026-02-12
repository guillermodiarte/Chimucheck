"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocalImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export function LocalImageUpload({ onUploadComplete, onUploadError }: LocalImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("El archivo es demasiado grande (Máx 5MB)");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al subir archivo");
      }

      onUploadComplete(data.url);
      toast.success("Archivo subido correctamente");
    } catch (error) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Error desconocido";
      if (onUploadError) {
        onUploadError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsUploading(false);
      // Reset input value to allow re-uploading same file if needed
      event.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className="relative overflow-hidden bg-secondary text-black hover:bg-yellow-400"
        disabled={isUploading}
      >
        <div className="flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>{isUploading ? "Subiendo..." : "Subir Archivo"}</span>
        </div>
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/*,video/*"
          disabled={isUploading}
        />
      </Button>
      <p className="text-xs text-gray-400">Máx: 5MB (Imágenes/Videos)</p>
    </div>
  );
}
