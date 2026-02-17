"use client";

import { useActionState } from "react";
import { registerPlayer } from "@/app/actions/player-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerPlayer, null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      setTimeout(() => {
        window.location.href = `/player/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      }, 1500);
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black opacity-50 z-0pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 bg-zinc-950 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative z-10 shadow-2xl shadow-yellow-900/10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Únete al Juego</h2>
          <p className="mt-2 text-sm text-gray-400">Crea tu perfil de jugador en ChimuCheck</p>
        </div>

        <form action={action} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alias" className="text-gray-300">Alias (Usuario)</Label>
              <Input
                id="alias"
                name="alias"
                defaultValue={state?.payload?.alias as string}
                required
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 ${state?.errors?.alias ? "border-red-500" : ""}`}
                placeholder="Ej: Slayer99"
              />
              {state?.errors?.alias && (
                <p className="text-sm text-red-500">{state.errors.alias[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={state?.payload?.email as string}
                required
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 ${state?.errors?.email ? "border-red-500" : ""}`}
                placeholder="tu@email.com"
              />
              {state?.errors?.email && (
                <p className="text-sm text-red-500">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Teléfono (Opcional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={state?.payload?.phone as string}
                className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50"
                placeholder="+54 9 ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
              <PasswordInput
                id="password"
                name="password"
                required
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 ${state?.errors?.password ? "border-red-500" : ""}`}
                placeholder="******"
              />
              {state?.errors?.password && (
                <p className="text-sm text-red-500">{state.errors.password[0]}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-11" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Registrarme
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta? <Link href={`/player/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="text-yellow-500 hover:underline">Inicia Sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
