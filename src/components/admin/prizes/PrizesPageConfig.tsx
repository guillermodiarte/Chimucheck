"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trophy, Loader2, Upload } from "lucide-react";
import { updatePrizesPageConfig } from "@/app/actions/prizes";
import Image from "next/image";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { toast } from "sonner";

interface PrizesPageConfigProps {
  initialConfig: any;
}

export default function PrizesPageConfig({ initialConfig }: PrizesPageConfigProps) {
  const [config, setConfig] = useState(() => {
    const base = initialConfig || {};
    return {
      headerTitle: base.headerTitle || "PREMIOS EXCLUSIVOS",
      headerSubtitle: base.headerSubtitle || "Tu esfuerzo tiene recompensa. Canjea tus ChimuCoins por el mejor equipamiento.",
      infoTitle: base.infoTitle || "ACUMULA. GANA. RECLAMA.",
      infoDescription: base.infoDescription || "Cada torneo, cada victoria y cada participación te otorga ChimuCoins. Úsalas sabiamente para desbloquear premios físicos reales. No es solo un juego, es tu recompensa por ser el mejor.",
      infoImage: base.infoImage || "/images/prizes/premio-info-v2.jpg",
      comboImage: base.comboImage || "/images/prizes/premio-combo.jpg",
      steps: base.steps || [
        { title: "Paso 1", description: "Juega Torneos" },
        { title: "Paso 2", description: "Gana ChimuCoins" },
        { title: "Paso 3", description: "Elige tu Premio" },
        { title: "Paso 4", description: "Canjealos en el Torneo" }
      ]
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());

  const handleSaveConfig = async () => {
    setIsLoading(true);

    // Upload pending files
    const finalConfig: any = { ...config };
    const fileFields = ["infoImage", "comboImage"];

    for (const field of fileFields) {
      const currentUrl = finalConfig[field];
      if (pendingFiles.has(field)) {
        const file = pendingFiles.get(field)!;
        // Check if the current URL matches the blob URL we created?
        // Actually, the user might have changed it again.
        // If I store file by field name, it's easier.

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.success) {
            finalConfig[field] = data.url;
          } else {
            toast.error(`Error al subir imagen para ${field}`);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error(e);
          toast.error(`Error al subir imagen para ${field}`);
          setIsLoading(false);
          return;
        }
      }
    }

    await updatePrizesPageConfig(finalConfig);

    // Cleanup
    setPendingFiles(new Map());
    setConfig(finalConfig);

    setIsLoading(false);
    toast.success("Configuración actualizada correctamente");
  };

  const handleChange = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (field: string, file: File) => {
    const url = URL.createObjectURL(file);
    handleChange(field, url);
    setPendingFiles(prev => new Map(prev).set(field, file));
  };

  const handleRemoveImage = (field: string) => {
    handleChange(field, "");
    setPendingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(field);
      return newMap;
    });
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setConfig((prev: any) => ({ ...prev, steps: newSteps }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-900 p-4 rounded-t-lg border border-gray-800 border-b-0">
        <div>
          <h3 className="text-xl font-bold text-white">Editor Visual: Secciones de Premios</h3>
          <p className="text-gray-400 text-sm">Edita la portada y la información explicativa.</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold">
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
          Guardar Configuración
        </Button>
      </div>

      <div className="bg-black text-white p-4 border border-gray-800 rounded-b-lg shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 z-50">
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">MODO EDICIÓN</span>
        </div>

        <div className="max-w-[1400px] mx-auto space-y-12 md:space-y-24 py-8 md:py-12 px-2 md:px-4">

          {/* Header Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-secondary/10 rounded-full mb-6 ring-1 ring-secondary/50">
              <Trophy className="w-12 h-12 text-secondary" />
            </div>
            <div className="mb-6">
              <Input
                value={config.headerTitle}
                onChange={(e) => handleChange("headerTitle", e.target.value)}
                className="text-4xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary text-center border-none p-0 h-auto focus:ring-0 placeholder:text-gray-700 w-full"
                style={{ WebkitTextFillColor: 'initial', color: 'white' }}
              />
            </div>
            <div className="max-w-3xl mx-auto">
              <Textarea
                value={config.headerSubtitle}
                onChange={(e) => handleChange("headerSubtitle", e.target.value)}
                className="text-base md:text-xl text-gray-400 text-center bg-transparent border-none p-0 resize-none h-[100px] md:h-[80px] focus:ring-0"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

            {/* Image Side - Info */}
            <div className="relative aspect-square md:aspect-video lg:aspect-auto lg:h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-gray-900 group">
              <Image
                src={config.infoImage}
                alt="Información de Canje"
                fill
                className="object-cover transition-opacity group-hover:opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm cursor-pointer">
                <div className="text-center">
                  <LocalImageUpload
                    onFileSelect={(file) => handleFileSelect("infoImage", file)}
                    onUrlSelect={(url) => {
                      handleChange("infoImage", url);
                      setPendingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.delete("infoImage");
                        return newMap;
                      });
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage("infoImage");
                    }}
                    className="mt-2 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/40 transition-colors mx-auto"
                    title="Eliminar imagen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="space-y-8">
              <div className="space-y-4">
                <textarea
                  value={config.infoTitle}
                  onChange={(e) => {
                    handleChange("infoTitle", e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                  className="text-3xl md:text-5xl font-black text-white leading-tight bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 p-1 focus:ring-0 focus:outline-none uppercase placeholder:text-gray-700 w-full resize-none overflow-hidden rounded"
                  placeholder="TÍTULO"
                  rows={1}
                />
                <textarea
                  value={config.infoDescription}
                  onChange={(e) => {
                    handleChange("infoDescription", e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                  className="text-base md:text-lg text-gray-400 leading-relaxed bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 p-1 resize-none overflow-hidden focus:ring-0 focus:outline-none w-full rounded"
                  placeholder="Descripción..."
                  rows={3}
                />
              </div>

              {/* Combo Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group">
                <Image
                  src={config.comboImage}
                  alt="Combo de Premios"
                  fill
                  className="object-cover transition-opacity group-hover:opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm cursor-pointer">
                  <div className="text-center">
                    <LocalImageUpload
                      onFileSelect={(file) => handleFileSelect("comboImage", file)}
                      onUrlSelect={(url) => {
                        handleChange("comboImage", url);
                        setPendingFiles(prev => {
                          const newMap = new Map(prev);
                          newMap.delete("comboImage");
                          return newMap;
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage("comboImage");
                      }}
                      className="mt-2 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/40 transition-colors mx-auto"
                      title="Eliminar imagen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {config.steps.map((step: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors">
                    <Input
                      value={step.title}
                      onChange={(e) => handleStepChange(idx, "title", e.target.value)}
                      className="text-2xl font-bold text-primary mb-1 bg-transparent border-none p-0 h-auto focus:ring-0"
                    />
                    <Input
                      value={step.description}
                      onChange={(e) => handleStepChange(idx, "description", e.target.value)}
                      className="text-sm text-gray-400 bg-transparent border-none p-0 h-auto focus:ring-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
