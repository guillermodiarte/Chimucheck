"use client";

import { useState, useTransition } from "react";
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
  const [isExporting, startExportTransition] = useTransition();
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();

  const handleExport = () => {
    startExportTransition(async () => {
      const players = await getPlayersForExport();

      if (!players || players.length === 0) {
        toast.error("No hay jugadores para exportar.");
        return;
      }

      // Convert to CSV
      const header = ["ID", "Alias", "Nombre", "Email", "Teléfono", "ChimuCoins", "Activo", "Fecha Registro"];
      const rows = players.map(p => [
        p.id,
        `"${p.alias || ""}"`, // Quote strings that might contain commas
        `"${p.name || ""}"`,
        p.email,
        `"${p.phone || ""}"`,
        p.chimucoins,
        p.active ? "Si" : "No",
        new Date(p.createdAt).toISOString()
      ]);

      const csvContent = [
        header.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `jugadores_chimuchek_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Lista de jugadores exportada.");
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
            <span>Exportar CSV</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white py-2.5"
            onClick={() => document.getElementById("import-players-input")?.click()}
            disabled={isImporting}
          >
            <Upload className="w-4 h-4 mr-2 text-green-400" />
            <span>Importar CSV</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden File Input */}
      <input
        type="file"
        id="import-players-input"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        disabled={isImporting}
      />
    </div>
  );
}
