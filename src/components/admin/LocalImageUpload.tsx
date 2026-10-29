"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { MediaSelectorModal } from "./MediaSelectorModal";

import { cn } from "@/lib/utils";

interface LocalImageUploadProps {
  onFileSelect: (file: File) => void;
  onUrlSelect?: (url: string) => void;
  currentPreview?: string | null;
  className?: string;
  label?: string;
  defaultFolder?: string;
  /** Renders a small icon-only button pair instead of the full-size layout */
  compact?: boolean;
}

export function LocalImageUpload({ onFileSelect, onUrlSelect, className, label = "Subir Imagen", defaultFolder, compact = false }: LocalImageUploadProps) {
  const [fileInputKey, setFileInputKey] = useState(0);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast.error("El archivo es demasiado grande (Máx 20MB)");
      return;
    }

    onFileSelect(file);
    // Reset input value to allow re-uploading same file if needed
    setFileInputKey(prev => prev + 1);
  }

  // Compact mode: small icon-only button for inline prize image upload
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="relative">
          <button
            type="button"
            title="Subir imagen"
            className="w-10 h-10 rounded-lg border border-dashed border-gray-600 hover:border-yellow-500/60 bg-gray-800/60 hover:bg-gray-700/60 flex items-center justify-center transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-gray-400" />
          </button>
          <input
            key={fileInputKey}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/*,video/*"
          />
        </div>
        {onUrlSelect && (
          <>
            <button
              type="button"
              title="Biblioteca"
              onClick={() => setShowMediaSelector(true)}
              className="w-10 h-10 rounded-lg border border-dashed border-blue-700/40 hover:border-blue-500/60 bg-gray-800/60 hover:bg-blue-900/30 flex items-center justify-center transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-blue-400" />
            </button>
            <MediaSelectorModal
              open={showMediaSelector}
              onOpenChange={setShowMediaSelector}
              onSelect={(url) => {
                if (onUrlSelect) onUrlSelect(url);
              }}
              defaultFolder={defaultFolder}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            className="bg-secondary text-black hover:bg-yellow-400"
          >
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>{label}</span>
            </div>
          </Button>
          <input
            key={fileInputKey}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/*,video/*"
          />
        </div>

        {onUrlSelect && (
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setShowMediaSelector(true)}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Biblioteca</span>
            </div>
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-400">Máx: 20MB (Imágenes/Videos)</p>

      <MediaSelectorModal
        open={showMediaSelector}
        onOpenChange={setShowMediaSelector}
        onSelect={(url) => {
          if (onUrlSelect) onUrlSelect(url);
        }}
        defaultFolder={defaultFolder}
      />
    </div>
  );
}
