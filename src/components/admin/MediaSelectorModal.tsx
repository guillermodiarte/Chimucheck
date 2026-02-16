
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, FileIcon, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMediaFiles, type MediaFile } from "@/app/actions/media";
import { cn } from "@/lib/utils";

interface MediaSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaSelectorModal({ open, onOpenChange, onSelect }: MediaSelectorModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getMediaFiles();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load media files", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onOpenChange(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800">
          <DialogTitle>Seleccionar Multimedia</DialogTitle>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white w-full"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron archivos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.url}
                  onClick={() => setSelectedFile(file.url)}
                  className={cn(
                    "group relative bg-gray-800 rounded-lg border overflow-hidden cursor-pointer transition-all",
                    selectedFile === file.url
                      ? "border-secondary ring-2 ring-secondary ring-opacity-50"
                      : "border-gray-700 hover:border-gray-500"
                  )}
                >
                  <div className="aspect-square relative bg-black/50">
                    {file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? (
                      <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    ) : file.name.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <span className="text-xs uppercase font-bold">{file.name.split('.').pop()}</span>
                      </div>
                    )}

                    {selectedFile === file.url && (
                      <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                        <div className="bg-secondary text-black rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-xs text-gray-300 truncate font-medium">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-2 bg-gray-900/50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFile}
            className="bg-secondary text-black hover:bg-secondary/90"
          >
            Seleccionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
