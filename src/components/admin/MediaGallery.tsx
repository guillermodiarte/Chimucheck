"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Trash2, Search, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type MediaFile } from "@/app/actions/media";
import { deleteMediaFile } from "@/app/actions/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MediaGalleryProps {
  initialFiles: MediaFile[];
}

export function MediaGallery({ initialFiles }: MediaGalleryProps) {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("images");
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    file.url.startsWith(`/uploads/${selectedFolder}`)
  );

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada al portapapeles");
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const result = await deleteMediaFile(fileToDelete);
      if (result.success) {
        setFiles(files.filter((file) => file.url !== fileToDelete));
        toast.success("Archivo eliminado correctamente");
      } else {
        toast.error(result.error || "Error al eliminar el archivo");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setFileToDelete(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white w-full md:w-80"
          />
        </div>
        <Tabs value={selectedFolder} onValueChange={setSelectedFolder} className="w-full sm:w-auto">
          <TabsList className="bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="images" className="text-gray-400 data-[state=active]:bg-secondary data-[state=active]:text-black">Imágenes</TabsTrigger>
            <TabsTrigger value="wallpapers" className="text-gray-400 data-[state=active]:bg-secondary data-[state=active]:text-black">Fondos</TabsTrigger>
            <TabsTrigger value="avatars" className="text-gray-400 data-[state=active]:bg-secondary data-[state=active]:text-black">Avatares</TabsTrigger>
            <TabsTrigger value="videos" className="text-gray-400 data-[state=active]:bg-secondary data-[state=active]:text-black">Videos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-lg border border-gray-800 border-dashed">
          <div className="flex justify-center mb-4">
            <FileIcon className="h-12 w-12 opacity-20" />
          </div>
          <p>No se encontraron archivos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.url}
              className="group relative bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-secondary transition-colors"
            >
              <div className="aspect-square relative bg-black/50">
                {file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? (
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
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

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-secondary hover:bg-black/40"
                    onClick={() => copyToClipboard(file.url)}
                    title="Copiar URL"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>

                  {file.canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:text-red-500 hover:bg-black/40"
                          onClick={() => setFileToDelete(file.url)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Esta acción eliminará permanentemente el archivo <strong>{file.name}</strong>.
                            Si este archivo se está utilizando en alguna parte del sitio, esa imagen dejará de verse.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-transparent border-gray-700 text-white hover:bg-gray-800">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-0"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                  <span>{formatSize(file.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
