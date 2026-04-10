"use client";

import { useState, useTransition, useEffect } from "react";
import { getPlayersForExport, importPlayers } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileJson, Download, Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PlayerActions() {
  const [mounted, setMounted] = useState(false);
  const [isExporting, startExportTransition] = useTransition();
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const handleExport = () => {
    startExportTransition(async () => {
      const players = await getPlayersForExport();

      if (!players || players.length === 0) {
        toast.error("No hay jugadores para exportar.");
        return;
      }

      // Convert to JSON
      const jsonContent = JSON.stringify(players, null, 2);

      // Trigger download
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `jugadores_chimuchek_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Lista de jugadores exportada en JSON.");
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Importar archivo: ${file.name}\n\nLos jugadores existentes (por email) serán actualizados. Los nuevos serán creados.\n¿Continuar?`)) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // We can't use useActionState easily here because we are outside a form submission context for the dropdown
      // So we call the server action directly.
      // Note: importPlayers signature is (prevState, formData). We pass null as prevState.
      const result = await importPlayers(null, formData);

      if (result.success) {
        toast.success(result.message);
        if (result.detailedStats) {
          console.log("Import Stats:", result.detailedStats);
        }
        router.refresh();
      } else {
        toast.error(result.message || "Error en la importación");
      }
    } catch (error) {
      console.error("Import error", error);
      toast.error("Error inesperado al importar.");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center">
        <Button className="bg-zinc-800 text-white border border-zinc-700 opacity-50 cursor-not-allowed">
          Cargando...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 gap-2">
            {isExporting || isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Exportar/Importar
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white min-w-[200px]">
          <DropdownMenuItem
            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white py-2.5"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2 text-blue-400" />
            <span>Exportar JSON</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white py-2.5"
            onClick={() => document.getElementById("import-players-input")?.click()}
            disabled={isImporting}
          >
            <Upload className="w-4 h-4 mr-2 text-green-400" />
            <span>Importar JSON</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden File Input */}
      <input
        type="file"
        id="import-players-input"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        disabled={isImporting}
      />
    </div>
  );
}
