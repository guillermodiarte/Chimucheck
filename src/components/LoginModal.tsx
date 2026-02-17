"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciales inválidas.");
      } else {
        toast.success("¡Bienvenido!");
        onClose();
        router.refresh();
      }
    } catch (error) {
      toast.error("Algo salió mal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm mx-4 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
          <h3 className="text-xl font-bold text-white tracking-tight">Bienvenido Jugador</h3>
          <p className="text-sm text-gray-400 mt-1">Ingresa a tu cuenta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-email" className="text-gray-300 text-sm">
              Email
            </Label>
            <Input
              id="modal-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password" className="text-gray-300 text-sm">
              Contraseña
            </Label>
            <PasswordInput
              id="modal-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white focus:ring-yellow-500/50 h-10"
              placeholder="******"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-yellow-400 font-bold h-11 shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Ingresar
          </Button>

          <p className="text-center text-sm text-gray-500 pt-1">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="text-yellow-500 hover:underline font-medium cursor-pointer"
              onClick={onSwitchToRegister}
            >
              Regístrate
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
