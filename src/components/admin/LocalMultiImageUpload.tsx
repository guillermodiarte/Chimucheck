"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocalMultiImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  currentCount?: number;
}

export function LocalMultiImageUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  currentCount = 0,
}: LocalMultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (currentCount + files.length > maxFiles) {
      toast.error(`No puedes tener más de ${maxFiles} imágenes en total.`);
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    // Upload files sequentially or in parallel.
    // Parallel is faster, but sequentially is safer for rate limits / simple usage.
    // Let's do parallel with Promise.all for better UX, assuming server can handle a few concurrent requests.

    const uploadPromises = Array.from(files).map(async (file) => {
      // Client-side validation
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        throw new Error(`El archivo ${file.name} es demasiado grande (Máx 20MB)`);
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error al subir ${file.name}`);
      }

      return data.url;
    });

    try {
      const results = await Promise.allSettled(uploadPromises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          uploadedUrls.push(result.value);
        } else {
          errors.push(result.reason.message);
        }
      });

      if (uploadedUrls.length > 0) {
        onUploadComplete(uploadedUrls);
        toast.success(`${uploadedUrls.length} archivo(s) subido(s) correctamente`);
      }

      if (errors.length > 0) {
        console.error("Upload errors:", errors);
        const errorMessage = `Errores al subir: ${errors.join(", ")}`;
        if (onUploadError) {
          onUploadError(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }

    } catch (error) {
      console.error("Critical upload error:", error);
      toast.error("Error crítico al subir archivos");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button
          type="button"
          variant="secondary"
          className="bg-secondary text-black hover:bg-yellow-400"
          disabled={isUploading || currentCount >= maxFiles}
        >
          <div className="flex items-center gap-2">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{isUploading ? "Subiendo..." : "Subir Imágenes"}</span>
          </div>
        </Button>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          accept="image/*"
          multiple
          disabled={isUploading || currentCount >= maxFiles}
        />
      </div>
      <p className="text-xs text-gray-400">
        {currentCount} / {maxFiles} imágenes (Máx 20MB c/u)
      </p>
    </div>
  );
}
