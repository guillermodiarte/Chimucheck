"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle, FileUp } from "lucide-react";
import { exportDatabase, importDatabase } from "@/app/actions/backup";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BackupManager() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportDatabase();
      if (result.success && result.data) {
        // Create a blob and trigger download
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Copia de seguridad descargada correctamente.");
      } else {
        toast.error(result.message || "Error al exportar.");
      }
    } catch (error) {
      toast.error("Error inesperado al exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileToImport(e.target.files[0]);
      setShowConfirm(true);
    }
  };

  const handleImport = async () => {
    if (!fileToImport) return;

    setIsImporting(true);
    try {
      const text = await fileToImport.text();
      const result = await importDatabase(text);
      if (result.success) {
        toast.success("Base de datos restaurada correctamente. Se recargará la página.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(result.message || "Error al importar.");
      }
    } catch (error) {
      toast.error("Error al leer el archivo.");
    } finally {
      setIsImporting(false);
      setShowConfirm(false);
      setFileToImport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Copias de Seguridad</h2>
          <p className="text-gray-400 text-sm">Exporta o restaura toda la información del sitio.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="space-y-4 border border-gray-800 rounded p-4 bg-black/20">
            <div className="flex items-center gap-3 text-secondary">
              <Download className="w-6 h-6" />
              <h3 className="font-semibold text-white">Exportar Datos</h3>
            </div>
            <p className="text-sm text-gray-400">
              Descarga un archivo JSON con toda la información actual de la base de datos (Banners, Novedades, Eventos, Usuarios, etc).
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-secondary text-black hover:bg-yellow-400"
            >
              {isExporting ? "Exportando..." : "Descargar Copia de Seguridad"}
            </Button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 border border-gray-800 rounded p-4 bg-black/20">
            <div className="flex items-center gap-3 text-blue-400">
              <Upload className="w-6 h-6" />
              <h3 className="font-semibold text-white">Importar Datos</h3>
            </div>
            <p className="text-sm text-gray-400">
              Restaura la base de datos desde un archivo JSON previamente exportado. <br />
              <span className="text-red-400 font-bold">⚠️ ESTO BORRARÁ LOS DATOS ACTUALES.</span>
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="secondary"
                  className="w-full cursor-pointer hover:bg-yellow-400 text-black"
                  asChild
                >
                  <span>
                    <FileUp className="w-4 h-4 mr-2" /> Seleccionar Archivo
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-gray-900 border-red-500/50 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <DialogTitle>¿Estás seguro de restaurar?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              Esta acción <strong>eliminará permanentemente</strong> todos los datos actuales (Banners, Noticias, Usuarios, etc.) y los reemplazará con los datos del archivo
              <span className="text-white font-mono ml-1">{fileToImport?.name}</span>.
              <br /><br />
              No podrás deshacer esta acción.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isImporting ? "Restaurando..." : "Sí, Restaurar Base de Datos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
