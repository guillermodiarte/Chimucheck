"use client";

import { useEffect } from "react";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { AlertCircle, Clock, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (!errorParam) return;

    if (errorParam === "PENDING_APPROVAL") {
      toast.info("Tu cuenta se encuentra en revisión por un administrador.");
    } else if (errorParam === "ACCOUNT_DISABLED") {
      toast.error("Tu cuenta se encuentra inactiva o ha sido rechazada.");
    } else if (errorParam === "OAuthAccountNotLinked") {
      toast.error("El email ya está registrado con otro método de inicio de sesión.");
    } else if (errorParam.startsWith("OAuth")) {
      toast.error("Error al autenticar con el proveedor social.");
    }
  }, [errorParam]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-zinc-950/90 border border-white/10 rounded-3xl shadow-2xl shadow-black/70 overflow-hidden backdrop-blur-sm">
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            {/* Animated icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/15 to-transparent flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(255,215,0,0.15)] backdrop-blur-sm">
                <Gamepad2 className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight">Bienvenido Jugador</h1>
            <p className="text-zinc-400 mt-2 text-sm">Elegí cómo querés ingresar a tu Player Hub</p>
          </div>

          {/* Alerts */}
          {errorParam === "PENDING_APPROVAL" && (
            <div className="mx-8 mb-6 bg-yellow-500/8 border border-yellow-500/25 rounded-2xl p-4 flex items-start gap-3 text-yellow-400 text-sm animate-in fade-in slide-in-from-top-2">
              <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Cuenta en revisión</p>
                <p className="text-yellow-400/80 text-xs mt-1">
                  Tu solicitud está pendiente de aprobación. Te notificaremos cuando tu acceso sea habilitado.
                </p>
              </div>
            </div>
          )}

          {errorParam === "ACCOUNT_DISABLED" && (
            <div className="mx-8 mb-6 bg-red-500/8 border border-red-500/25 rounded-2xl p-4 flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Acceso denegado</p>
                <p className="text-red-400/80 text-xs mt-1">
                  Esta cuenta se encuentra inactiva o ha sido rechazada por la administración.
                </p>
              </div>
            </div>
          )}

          {/* Social Auth Buttons */}
          <div className="px-8 pb-10">
            <SocialAuthButtons mode="login" callbackUrl={callbackUrl || "/"} />
          </div>

          {/* Bottom accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          Al ingresar, aceptás los términos y condiciones del servicio.
        </p>
      </div>
    </div>
  );
}
