"use client";

import { useActionState, useEffect } from "react";
import { loginPlayer } from "@/app/actions/player-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import Link from "next/link";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginPlayer, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (state && typeof state === "string") {
      toast.error(state);
    }
  }, [state]);

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
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-black to-black opacity-50 z-0 pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 bg-zinc-950 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative z-10 shadow-2xl shadow-primary/5">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Bienvenido Jugador</h2>
          <p className="mt-2 text-sm text-gray-400">Ingresa a tu Player Hub</p>
        </div>

        {errorParam === "PENDING_APPROVAL" && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3 text-yellow-400 text-sm animate-in fade-in">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Cuenta en revisión</p>
              <p className="text-yellow-400/90 text-xs mt-1">
                Tu solicitud está pendiente de aprobación por un administrador. Te notificaremos cuando tu acceso sea habilitado.
              </p>
            </div>
          </div>
        )}

        {errorParam === "ACCOUNT_DISABLED" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Acceso denegado</p>
              <p className="text-red-400/90 text-xs mt-1">
                Esta cuenta se encuentra inactiva o ha sido rechazada por la administración.
              </p>
            </div>
          </div>
        )}

        {/* Social Auth */}
        <SocialAuthButtons mode="login" callbackUrl={callbackUrl || "/player/dashboard"} />

        {/* Credentials Form */}
        <form action={action} className="space-y-5">
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">
                  Contraseña
                </Label>
                <Link href="#" className="text-xs text-yellow-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                required
                className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50"
                placeholder="******"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-white hover:bg-gray-200 text-black font-bold h-11"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Ingresar
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link
              href={`/player/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-yellow-500 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
