"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  LayoutTemplate,
  Save,
  Loader2,
  Trash2,
  Mail,
  Copyright,
  Sparkles,
  Smartphone,
  Monitor,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Instagram,
  Youtube,
  Twitch,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { toast } from "sonner";
import Image from "next/image";
import { getSocialConfig } from "@/lib/utils";

interface FooterContent {
  logoUrl: string;
  title: string;
  copyright: string;
  subtitle?: string;
  contactText: string;
  contactEmail: string;
}

interface FooterFormProps {
  initialContent?: any;
  socialsContent?: any;
  onBack?: () => void;
}

export function FooterForm({ initialContent, socialsContent, onBack }: FooterFormProps) {
  const currentYear = new Date().getFullYear();

  const parseInitialContent = (): FooterContent => {
    const raw = initialContent || {};
    return {
      logoUrl: raw.logoUrl !== undefined ? raw.logoUrl : "/images/chimu-logo.png",
      title: raw.title !== undefined ? raw.title : "ChimuCheck",
      copyright:
        raw.copyright ||
        raw.subtitle ||
        `Chimucheck © ${currentYear}. Todos los derechos reservados.`,
      contactText: raw.contactText !== undefined ? raw.contactText : "Contacto:",
      contactEmail: raw.contactEmail !== undefined ? raw.contactEmail : "chimucheck@gmail.com",
    };
  };

  const [content, setContent] = useState<FooterContent>(parseInitialContent);
  const [initialState] = useState<FooterContent>(parseInitialContent);
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const hasChanges =
    JSON.stringify(content) !== JSON.stringify(initialState) || pendingFile !== null;

  const handleChange = <K extends keyof FooterContent>(field: K, value: FooterContent[K]) => {
    setContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    handleChange("logoUrl", url);
  };

  const handleUrlSelect = (url: string) => {
    setPendingFile(null);
    handleChange("logoUrl", url);
  };

  const handleRemoveLogo = () => {
    setPendingFile(null);
    handleChange("logoUrl", "");
  };

  const handleReset = () => {
    setContent(initialState);
    setPendingFile(null);
    toast.info("Cambios revertidos al estado guardado");
  };

  const handleInsertYear = () => {
    const base = content.copyright || "Chimucheck © Todos los derechos reservados.";
    if (!base.includes(String(currentYear))) {
      handleChange(
        "copyright",
        `Chimucheck © ${currentYear}. Todos los derechos reservados.`
      );
      toast.success("Texto de copyright actualizado con el año actual");
    } else {
      toast.info("El texto de copyright ya contiene el año actual");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    let finalContent = {
      ...content,
      subtitle: content.copyright, // Sync for backwards compatibility
    };

    if (pendingFile) {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("folder", "imagenes");

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await uploadRes.json();

        if (uploadRes.ok && data.success) {
          finalContent.logoUrl = data.url;
          setContent((prev) => ({ ...prev, logoUrl: data.url }));
        } else {
          toast.error(data.message || "Error al subir la imagen del logo");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error al procesar la subida del logo");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await updateSectionContent("footer_section", finalContent);
      setLoading(false);

      if (res.success) {
        toast.success("Pie de página actualizado correctamente");
        setPendingFile(null);
      } else {
        toast.error(res.message || "Error al guardar los cambios");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Ocurrió un error inesperado al guardar");
      setLoading(false);
    }
  };

  // Social icons helper for live preview
  const inst = getSocialConfig(socialsContent, "instagram");
  const fb = getSocialConfig(socialsContent, "facebook");
  const tw = getSocialConfig(socialsContent, "twitter");
  const wa = getSocialConfig(socialsContent, "whatsapp");
  const twitch = getSocialConfig(socialsContent, "twitch");
  const yt = getSocialConfig(socialsContent, "youtube");
  const kick = getSocialConfig(socialsContent, "kick");
  const tiktok = getSocialConfig(socialsContent, "tiktok");

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-800/80 p-4 sm:p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary shadow-inner">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Editor de Pie de Página (Footer)
              </h2>
              {hasChanges && (
                <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 bg-yellow-500/10 text-xs">
                  Cambios pendientes
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Personaliza el logotipo, título, datos de contacto, copyright y créditos legales en el footer web.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Revertir
            </Button>
          )}

          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="bg-secondary text-black hover:bg-yellow-400 font-bold shadow-md shadow-secondary/20 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Main Layout: Responsive Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Form Controls (7 cols on LG+) ─────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Card 1: Logo e Identidad */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-white text-base sm:text-lg">
                Identidad & Marca
              </h3>
            </div>

            {/* Logo Picker */}
            <div className="space-y-3">
              <Label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                Logo del Footer
              </Label>

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-black/40 p-4 rounded-xl border border-gray-800/80">
                {/* Logo Box */}
                <div className="relative w-28 h-28 shrink-0 bg-neutral-950 rounded-xl border border-gray-700/60 flex items-center justify-center overflow-hidden group shadow-inner">
                  {content.logoUrl ? (
                    <>
                      <Image
                        src={content.logoUrl}
                        alt="Logo Footer"
                        fill
                        className="object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-500 text-white p-1 rounded-full shadow-md transition-transform hover:scale-110 z-10"
                        title="Quitar logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 text-gray-500">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] block font-medium">Sin Logo</span>
                    </div>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex-1 w-full space-y-2">
                  <LocalImageUpload
                    label={content.logoUrl ? "Cambiar Imagen" : "Subir Logo"}
                    onFileSelect={handleFileSelect}
                    onUrlSelect={handleUrlSelect}
                    defaultFolder="imagenes"
                  />
                  <p className="text-xs text-gray-400">
                    Formatos recomendados: PNG o WEBP con fondo transparente. Aparece junto al nombre de marca.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Title */}
            <div className="space-y-2">
              <Label htmlFor="brand-title" className="text-gray-300 font-medium text-sm">
                Título / Nombre de la Marca
              </Label>
              <Input
                id="brand-title"
                value={content.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Ej: ChimuCheck"
                className="bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-secondary/50 h-11"
              />
              <p className="text-xs text-gray-500">
                Texto en tipografía destacada junto al logo.
              </p>
            </div>
          </div>

          {/* Card 2: Copyright & Derechos */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <Copyright className="w-5 h-5 text-secondary" />
                <h3 className="font-semibold text-white text-base sm:text-lg">
                  Copyright & Legales
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleInsertYear}
                className="text-xs text-secondary hover:text-yellow-300 hover:bg-secondary/10 h-7 px-2.5"
              >
                Insertar año {currentYear}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyright-text" className="text-gray-300 font-medium text-sm">
                Texto de Copyright
              </Label>
              <Textarea
                id="copyright-text"
                rows={3}
                value={content.copyright}
                onChange={(e) => handleChange("copyright", e.target.value)}
                placeholder={`Ej: Chimucheck © ${currentYear}. Todos los derechos reservados.`}
                className="bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-secondary/50 resize-y"
              />
              <p className="text-xs text-gray-500">
                Línea que informa los derechos de autor en el pie de página.
              </p>
            </div>
          </div>

          {/* Card 3: Datos de Contacto */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
              <Mail className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-white text-base sm:text-lg">
                Información de Contacto
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4 space-y-2">
                <Label htmlFor="contact-text" className="text-gray-300 font-medium text-sm">
                  Etiqueta
                </Label>
                <Input
                  id="contact-text"
                  value={content.contactText}
                  onChange={(e) => handleChange("contactText", e.target.value)}
                  placeholder="Contacto:"
                  className="bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-secondary/50 h-11"
                />
              </div>

              <div className="sm:col-span-8 space-y-2">
                <Label htmlFor="contact-email" className="text-gray-300 font-medium text-sm">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Input
                    id="contact-email"
                    type="email"
                    value={content.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    placeholder="chimucheck@gmail.com"
                    className="bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-secondary/50 h-11 pr-10"
                  />
                  <Mail className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Aparece debajo del copyright con enlace directo &quot;mailto:&quot; para que los visitantes puedan escribirte rápidamente.
            </p>
          </div>

          {/* Botón flotante/inferior en móvil */}
          <div className="pt-2 flex sm:hidden">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-black hover:bg-yellow-400 font-bold h-12 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>

        {/* ── Right Column: Live Interactive Preview (5 cols on LG+) ──── */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            {/* Preview Header & Device Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-semibold text-white text-sm sm:text-base">
                  Vista Previa en Tiempo Real
                </h4>
              </div>

              {/* Toggle Desktop / Mobile */}
              <div className="flex items-center bg-black/60 p-1 rounded-lg border border-gray-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    previewMode === "desktop"
                      ? "bg-secondary text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Vista Escritorio"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Escritorio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    previewMode === "mobile"
                      ? "bg-secondary text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Vista Móvil"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Móvil</span>
                </button>
              </div>
            </div>

            {/* Simulated Public Footer */}
            <div
              className={`transition-all duration-300 mx-auto ${
                previewMode === "mobile" ? "max-w-[340px]" : "w-full"
              }`}
            >
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                {/* Fake Browser / Container Bar */}
                <div className="bg-neutral-950 px-3 py-2 border-b border-white/10 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <span className="w-2 h-2 rounded-full bg-green-500/80" />
                  </span>
                  <span className="truncate max-w-[160px]">
                    {previewMode === "mobile" ? "chimucheck.com (móvil)" : "chimucheck.com"}
                  </span>
                  <span className="text-[10px] text-secondary">PREVIEW</span>
                </div>

                {/* Actual Footer Simulation */}
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Top Row: Brand & Socials */}
                  <div
                    className={`flex ${
                      previewMode === "mobile"
                        ? "flex-col items-center text-center gap-4"
                        : "flex-col sm:flex-row justify-between items-center gap-4"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {content.logoUrl ? (
                        <div className="relative w-12 h-12 shrink-0">
                          <Image
                            src={content.logoUrl}
                            alt="Logo preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : null}
                      {content.title && (
                        <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {content.title}
                        </span>
                      )}
                    </div>

                    {/* Socials Preview */}
                    <div className="flex items-center gap-3 text-gray-400 flex-wrap justify-center">
                      {inst.active && <Instagram className="w-4 h-4 hover:text-pink-500 transition-colors" />}
                      {fb.active && <Facebook className="w-4 h-4 hover:text-blue-500 transition-colors" />}
                      {tw.active && <Twitter className="w-4 h-4 hover:text-blue-400 transition-colors" />}
                      {wa.active && <MessageCircle className="w-4 h-4 hover:text-green-500 transition-colors" />}
                      {twitch.active && <Twitch className="w-4 h-4 hover:text-purple-500 transition-colors" />}
                      {yt.active && <Youtube className="w-4 h-4 hover:text-red-500 transition-colors" />}
                      {kick.active && <Monitor className="w-4 h-4 hover:text-green-500 transition-colors" />}
                      {tiktok.active && <TikTokIcon className="w-4 h-4 hover:text-white transition-colors" />}
                    </div>
                  </div>

                  {/* Bottom Row: Text Info */}
                  <div
                    className={`pt-4 border-t border-white/10 flex ${
                      previewMode === "mobile"
                        ? "flex-col text-center gap-4 text-xs"
                        : "flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-xs"
                    } text-gray-400`}
                  >
                    {/* Copyright & Contact */}
                    <div className={`space-y-1 ${previewMode === "mobile" ? "text-center" : "text-left"}`}>
                      {content.copyright && (
                        <p className="whitespace-pre-line text-gray-400">
                          {content.copyright}
                        </p>
                      )}
                      {content.contactEmail && (
                        <p className="text-gray-400">
                          {content.contactText && <span>{content.contactText} </span>}
                          <span className="text-secondary hover:underline cursor-pointer">
                            {content.contactEmail}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Developer Credits - Siempre fijo y activo */}
                    <div className={`space-y-1 ${previewMode === "mobile" ? "text-center" : "text-right"}`}>
                      <p>
                        Desarrollado por{" "}
                        <span className="font-semibold text-white">
                          Guillermo A. Diarte
                        </span>
                      </p>
                      <p>
                        Email:{" "}
                        <span className="text-secondary hover:underline cursor-pointer">
                          guillermodiarte@gmail.com
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3 text-xs text-gray-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>
                Cualquier cambio que realices en el formulario se refleja en tiempo real en esta vista previa antes de guardar.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
