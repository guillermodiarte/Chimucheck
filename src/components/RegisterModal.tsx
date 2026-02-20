"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { registerPlayer } from "@/app/actions/player-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [state, action, isPending] = useActionState(registerPlayer, null);
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    // Only trigger redirect if success AND the modal is currently open.
    // This prevents the "stale state" bug where an unseen RegisterModal re-opens the 
    // LoginModal when the parent Navbar re-renders.
    if (state?.success && isOpen) {
      toast.success(state.message);
      // Wait a bit and then switch to login
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } else if (state?.message && isOpen) {
      // Only show errors if open too
      toast.error(state.message);
    }
  }, [state, onSwitchToLogin, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (formData: FormData) => {
    if (password !== confirmPassword) {
      setConfirmError("Las contraseñas no coinciden");
      return;
    }
    setConfirmError("");
    startTransition(() => {
      // @ts-ignore
      action(formData);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm mx-auto bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Únete al Juego</h3>
          <p className="text-sm text-gray-400 mt-1">Crea tu perfil de jugador</p>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-alias" className="text-gray-300 text-sm">Alias (Usuario)</Label>
              <Input
                id="reg-alias"
                name="alias"
                defaultValue={state?.payload?.alias as string}
                required
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10 ${state?.errors?.alias ? "border-red-500" : ""}`}
                placeholder="Ej: Slayer99"
              />
              {state?.errors?.alias && (
                <p className="text-xs text-red-500">{state.errors.alias[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-gray-300 text-sm">Email</Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                defaultValue={state?.payload?.email as string}
                required
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10 ${state?.errors?.email ? "border-red-500" : ""}`}
                placeholder="tu@email.com"
              />
              {state?.errors?.email && (
                <p className="text-xs text-red-500">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-phone" className="text-gray-300 text-sm">Teléfono (Opcional)</Label>
              <Input
                id="reg-phone"
                name="phone"
                type="tel"
                defaultValue={state?.payload?.phone as string}
                className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10"
                placeholder="+54 9 ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-gray-300 text-sm">Contraseña</Label>
              <PasswordInput
                id="reg-password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10 ${state?.errors?.password ? "border-red-500" : ""}`}
                placeholder="******"
              />
              {state?.errors?.password && (
                <p className="text-xs text-red-500">{state.errors.password[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-confirm-password" className="text-gray-300 text-sm">Confirmar Contraseña</Label>
              <PasswordInput
                id="reg-confirm-password"
                name="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (password && e.target.value !== password) {
                    setConfirmError("Las contraseñas no coinciden");
                  } else {
                    setConfirmError("");
                  }
                }}
                className={`bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10 ${confirmError ? "border-red-500" : ""}`}
                placeholder="******"
              />
              {confirmError && (
                <p className="text-xs text-red-500">{confirmError}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary text-black hover:bg-yellow-400 font-bold h-11 shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all mt-2" disabled={isPending || !!confirmError}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Registrarme
          </Button>

          <p className="text-center text-sm text-gray-500 pt-1">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              className="text-yellow-500 hover:underline font-medium cursor-pointer"
              onClick={onSwitchToLogin}
            >
              Inicia Sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
