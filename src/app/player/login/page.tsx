"use client";

import { useActionState } from "react";
import { loginPlayer } from "@/app/actions/player-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginPlayer, undefined);

  useEffect(() => {
    if (state && typeof state === 'string') {
      toast.error(state);
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-black to-black opacity-50 z-0 pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 bg-zinc-950 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative z-10 shadow-2xl shadow-primary/5">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Bienvenido Jugador</h2>
          <p className="mt-2 text-sm text-gray-400">Ingresa a tu Player Hub</p>
        </div>

        <form action={action} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input id="email" name="email" type="email" required className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50" placeholder="tu@email.com" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
                <Link href="#" className="text-xs text-yellow-500 hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <PasswordInput id="password" name="password" required className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50" placeholder="******" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-bold h-11" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Ingresar
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta? <Link href="/player/register" className="text-yellow-500 hover:underline">Regístrate</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
