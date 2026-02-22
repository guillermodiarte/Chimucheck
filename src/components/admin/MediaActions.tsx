"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Upload, Loader2, FolderArchive } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MediaActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/media/export");
      if (!response.ok) {
        toast.error("Error al generar el ZIP. Intente de nuevo.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `biblioteca_chimuchek_${new Date().toISOString().slice(0, 10)}.zip`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Biblioteca exportada como ZIP exitosamente.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error inesperado al exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Importar archivo: ${file.name}\n\nSe restaurarán todos los archivos del ZIP dentro de la carpeta de uploads. Los archivos existentes con el mismo nombre serán reemplazados.\n¿Continuar?`)) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/media/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || "Error en la importación.");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Error inesperado al importar.");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 gap-2">
            {isExporting || isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderArchive className="w-4 h-4" />}
            Exportar/Importar
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white min-w-[220px]">
          <DropdownMenuItem
            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white py-2.5"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2 text-blue-400" />
            <span>Exportar Biblioteca (.zip)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white py-2.5"
            onClick={() => document.getElementById("import-media-input")?.click()}
            disabled={isImporting}
          >
            <Upload className="w-4 h-4 mr-2 text-green-400" />
            <span>Importar Biblioteca (.zip)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden File Input */}
      <input
        type="file"
        id="import-media-input"
        accept=".zip"
        className="hidden"
        onChange={handleFileChange}
        disabled={isImporting}
      />
    </div>
  );
}
