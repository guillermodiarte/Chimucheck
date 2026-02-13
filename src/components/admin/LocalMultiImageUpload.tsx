"use client";

import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { MediaSelectorModal } from "./MediaSelectorModal";

interface LocalMultiImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  onUrlSelected?: (url: string) => void;
  maxFiles?: number;
  currentCount?: number;
}

export function LocalMultiImageUpload({
  onFilesSelected,
  onUrlSelected,
  maxFiles = 10,
  currentCount = 0,
}: LocalMultiImageUploadProps) {
  const [fileInputKey, setFileInputKey] = useState(0);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (currentCount + files.length > maxFiles) {
      toast.error(`No puedes tener más de ${maxFiles} imágenes en total.`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        errors.push(`${file.name} (excede 20MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(`Algunos archivos no se pudieron seleccionar: ${errors.join(", ")}`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Reset input
    setFileInputKey(prev => prev + 1);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            className="bg-secondary text-black hover:bg-yellow-400"
            disabled={currentCount >= maxFiles}
          >
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Seleccionar Imágenes</span>
            </div>
          </Button>
          <input
            key={fileInputKey}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleFileChange}
            accept="image/*"
            multiple
            disabled={currentCount >= maxFiles}
          />
        </div>

        {onUrlSelected && (
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setShowMediaSelector(true)}
            disabled={currentCount >= maxFiles}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Biblioteca</span>
            </div>
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {currentCount} / {maxFiles} imágenes (Máx 20MB c/u)
      </p>

      <MediaSelectorModal
        open={showMediaSelector}
        onOpenChange={setShowMediaSelector}
        onSelect={(url) => {
          if (onUrlSelected) onUrlSelected(url);
        }}
      />
    </div>
  );
}
