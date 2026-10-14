"use client";

import { usePathname } from "next/navigation";
import { X, Gamepad2, ShieldCheck, Zap, Trophy } from "lucide-react";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  customCallbackUrl?: string | null;
}

export default function LoginModal({ isOpen, onClose, customCallbackUrl }: LoginModalProps) {
  const pathname = usePathname();

  const targetCallbackUrl =
    customCallbackUrl ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : pathname || "/");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Glow backdrop background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[440px] mx-auto bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black border border-white/10 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-250 relative">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-all cursor-pointer z-10 p-2 rounded-full hover:bg-white/10 active:scale-95"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-7 pt-9 pb-5 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 text-[11px] font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(250,204,21,0.15)]">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Player Hub</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bienvenido Jugador
          </h3>
          <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto">
            Ingresá o creá tu cuenta con tus redes en un solo clic
          </p>
        </div>

        {/* Social Buttons */}
        <div className="px-7 pb-6">
          <SocialAuthButtons mode="login" callbackUrl={targetCallbackUrl} />
        </div>

        {/* Trust & Community Badges */}
        <div className="px-7 pb-7 pt-2 border-t border-white/5 bg-white/[0.015]">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-400">
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.03]">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-medium text-zinc-300">Instantáneo</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.03]">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-medium text-zinc-300">Torneos</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.03]">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span className="font-medium text-zinc-300">100% Seguro</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 text-center mt-3">
            Al continuar, aceptás los términos y condiciones de Chimuchek.
          </p>
        </div>
      </div>
    </div>
  );
}
