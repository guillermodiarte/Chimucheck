"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  AlertTriangle,
  FileUp,
  Database,
  RefreshCw,
  ShieldCheck,
  Trash2,
  History,
  Plus,
  Loader2,
  RotateCcw,
  Clock,
} from "lucide-react";
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

interface AutoBackup {
  filename: string;
  size: number;
  formattedSize: string;
  createdAt: string;
  isSafetyBackup: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hace unos segundos";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h ${m % 60}min`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d > 1 ? "s" : ""}`;
}

function localDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BackupManager() {
  // JSON backup
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto backups (SQLite)
  const [autoBackups, setAutoBackups] = useState<AutoBackup[]>([]);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [creatingAuto, setCreatingAuto] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<AutoBackup | null>(null);
  const [backupToDelete, setBackupToDelete] = useState<AutoBackup | null>(null);
  const [restoringAuto, setRestoringAuto] = useState(false);

  // ── Fetch auto backups ───────────────────────────────────────────────────

  const fetchAutoBackups = useCallback(async () => {
    setLoadingAuto(true);
    try {
      const res = await fetch("/api/backup/auto");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAutoBackups(data.backups || []);
      } else {
        if (res.status === 401) {
          console.warn("Sesión no autorizada para copias automáticas");
        } else if (data.error) {
          toast.error(data.error);
        }
      }
    } catch (err) {
      console.error("Error al cargar copias automáticas:", err);
    } finally {
      setLoadingAuto(false);
    }
  }, []);

  useEffect(() => {
    fetchAutoBackups();
  }, [fetchAutoBackups]);

  // ── JSON export/import ───────────────────────────────────────────────────

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportDatabase();
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Copia de seguridad JSON descargada correctamente.");
      } else {
        toast.error((result as any).message || "Error al exportar.");
      }
    } catch {
      toast.error("Error inesperado al exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileToImport(e.target.files[0]);
      setShowImportConfirm(true);
    }
  };

  const handleImport = async () => {
    if (!fileToImport) return;
    setIsImporting(true);
    try {
      const text = await fileToImport.text();
      const result = await importDatabase(text);
      if (result.success) {
        toast.success("Base de datos restaurada. Se recargará la página.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(result.message || "Error al importar.");
      }
    } catch {
      toast.error("Error al leer el archivo.");
    } finally {
      setIsImporting(false);
      setShowImportConfirm(false);
      setFileToImport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Auto backup actions ──────────────────────────────────────────────────

  const handleCreateAutoBackup = async () => {
    setCreatingAuto(true);
    try {
      const res = await fetch("/api/backup/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error (${res.status}) al crear la copia`);
      toast.success("Copia de seguridad SQLite creada correctamente");
      await fetchAutoBackups();
    } catch (err: any) {
      toast.error(err.message || "Error al crear la copia");
    } finally {
      setCreatingAuto(false);
    }
  };

  const handleConfirmRestoreAuto = async () => {
    if (!backupToRestore) return;
    setRestoringAuto(true);
    try {
      const res = await fetch("/api/backup/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", filename: backupToRestore.filename }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error (${res.status}) al restaurar`);
      toast.success("Base de datos restaurada. Reiniciando...");
      setBackupToRestore(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Error al restaurar la copia");
      setRestoringAuto(false);
    }
  };

  const handleConfirmDeleteAuto = async () => {
    if (!backupToDelete) return;
    try {
      const res = await fetch("/api/backup/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", filename: backupToDelete.filename }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error (${res.status}) al eliminar`);
      toast.success("Copia de seguridad eliminada");
      setBackupToDelete(null);
      await fetchAutoBackups();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  const handleDownloadAuto = (filename: string) => {
    window.open(`/api/backup/auto?action=download&filename=${encodeURIComponent(filename)}`, "_blank");
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Copias de Seguridad</h2>
        <p className="text-gray-400 text-sm mt-1">
          Exporta, importa o gestiona las copias de seguridad del sitio.
        </p>
      </div>

      {/* ── JSON Export / Import ─────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-widest">
          <Database className="w-4 h-4 text-secondary" />
          Exportar / Importar JSON (Completo)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Export */}
          <div className="space-y-3 border border-gray-800 rounded-lg p-4 bg-black/20">
            <div className="flex items-center gap-3 text-secondary">
              <Download className="w-5 h-5" />
              <h3 className="font-semibold text-white">Exportar Datos</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Descarga un archivo <code className="text-xs bg-gray-800 px-1 rounded">.json</code> con{" "}
              <strong className="text-white">toda</strong> la base de datos: Banners, Jugadores, Torneos, Sorteos, Votaciones, Premios, Notificaciones, etc.
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-secondary text-black hover:bg-yellow-400 font-semibold"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> Descargar Copia de Seguridad JSON
                </>
              )}
            </Button>
          </div>

          {/* Import */}
          <div className="space-y-3 border border-gray-800 rounded-lg p-4 bg-black/20">
            <div className="flex items-center gap-3 text-blue-400">
              <Upload className="w-5 h-5" />
              <h3 className="font-semibold text-white">Importar Datos</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Restaura desde un <code className="text-xs bg-gray-800 px-1 rounded">.json</code> exportado previamente.{" "}
              <span className="text-red-400 font-bold">⚠️ ESTO BORRARÁ LOS DATOS ACTUALES.</span>
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={onFileChange}
                className="hidden"
                id="file-upload-json"
                ref={fileInputRef}
              />
              <label htmlFor="file-upload-json">
                <Button
                  variant="secondary"
                  className="w-full cursor-pointer hover:bg-yellow-400 text-black font-semibold"
                  asChild
                >
                  <span>
                    <FileUp className="w-4 h-4 mr-2" /> Seleccionar Archivo JSON
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Auto Backups SQLite 7 days ────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                Copias de Seguridad Automáticas
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Clock className="w-3 h-3" /> Retención 7 días
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Copias directas de la base de datos SQLite. Puedes crear una manualmente, restaurar el sistema a cualquier punto o descargar el archivo <code className="bg-gray-800 px-1 rounded">.db</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAutoBackups}
              disabled={loadingAuto}
              className="border-gray-700 bg-gray-800 text-gray-300 hover:text-white h-9"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingAuto ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateAutoBackup}
              disabled={creatingAuto}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9"
            >
              {creatingAuto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Creando...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Crear Ahora
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Backups List */}
        {loadingAuto ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando copias...
          </div>
        ) : autoBackups.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-800 rounded-lg">
            <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No hay copias de seguridad automáticas todavía.</p>
            <p className="text-gray-600 text-xs mt-1">
              Haz clic en &ldquo;Crear Ahora&rdquo; para generar la primera.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800 rounded-lg border border-gray-800 overflow-hidden">
            {autoBackups.map((backup) => (
              <div
                key={backup.filename}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 transition-colors ${
                  backup.isSafetyBackup
                    ? "bg-amber-950/20 hover:bg-amber-950/30"
                    : "bg-black/20 hover:bg-gray-800/30"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono text-white truncate max-w-[320px]" title={backup.filename}>
                      {backup.filename}
                    </span>
                    {backup.isSafetyBackup && (
                      <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        Prev. Restauración
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{localDateTime(backup.createdAt)}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-xs text-gray-500">{relativeTime(backup.createdAt)}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-xs text-emerald-400 font-mono">{backup.formattedSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownloadAuto(backup.filename)}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBackupToRestore(backup)}
                    className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                    title="Restaurar esta copia"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBackupToDelete(backup)}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-gray-600 leading-relaxed">
          Las copias más antiguas de 7 días se eliminan automáticamente. Los snapshots de seguridad previos a una restauración se conservan indefinidamente.
          Para un backup diario automático en producción, configura el cron con <code className="bg-gray-900 px-1 rounded">scripts/backup.sh</code>.
        </p>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* JSON import confirm */}
      <Dialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <DialogContent className="bg-gray-900 border-red-500/50 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <DialogTitle>¿Restaurar desde archivo JSON?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              Esta acción <strong>eliminará permanentemente</strong> todos los datos actuales y los
              reemplazará con los del archivo{" "}
              <span className="text-white font-mono">{fileToImport?.name}</span>.
              <br />
              <br />
              No podrás deshacer esta acción.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowImportConfirm(false)} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isImporting} className="bg-red-600 hover:bg-red-700 text-white">
              {isImporting ? "Restaurando..." : "Sí, Restaurar Base de Datos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto restore confirm */}
      <Dialog open={!!backupToRestore} onOpenChange={() => setBackupToRestore(null)}>
        <DialogContent className="bg-gray-900 border-amber-500/50 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <RotateCcw className="w-6 h-6" />
              <DialogTitle>¿Restaurar esta copia SQLite?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              Se creará un snapshot de seguridad del estado actual antes de restaurar.{" "}
              <strong className="text-white">La base de datos activa será reemplazada</strong> por{" "}
              <span className="font-mono text-xs text-amber-300">{backupToRestore?.filename}</span>.
              <br />
              <br />
              La página se recargará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBackupToRestore(null)} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRestoreAuto}
              disabled={restoringAuto}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {restoringAuto ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restaurando...
                </>
              ) : (
                "Sí, Restaurar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto delete confirm */}
      <Dialog open={!!backupToDelete} onOpenChange={() => setBackupToDelete(null)}>
        <DialogContent className="bg-gray-900 border-red-500/50 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <Trash2 className="w-6 h-6" />
              <DialogTitle>¿Eliminar esta copia de seguridad?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              Se eliminará permanentemente el archivo{" "}
              <span className="font-mono text-xs text-red-300">{backupToDelete?.filename}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBackupToDelete(null)} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDeleteAuto}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
