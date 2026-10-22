"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  MapPin,
  Phone,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { completeOAuthProfile, type CompleteProfileState } from "@/app/actions/complete-oauth-profile";
import { LocationSelector } from "@/components/ui/LocationSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const initialState: CompleteProfileState = { success: false };

export default function OAuthCompleteProfileModal() {
  const { data: session, update: updateSession } = useSession();
  const [state, formAction, isPending] = useActionState(completeOAuthProfile, initialState);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Watch session to show modal when needed
  useEffect(() => {
    const needsCompletion = (session?.user as any)?.needsProfileCompletion;
    if (needsCompletion && !done) {
      setOpen(true);
    }
  }, [session, done]);

  // Handle action result
  useEffect(() => {
    if (state.success) {
      setDone(true);
      // Refresh session to clear needsProfileCompletion flag
      updateSession({ needsProfileCompletion: false });
      toast.success("¡Perfil completado! Bienvenido a ChimuCheck 🎮");
      setTimeout(() => setOpen(false), 1500);
    }
  }, [state.success, updateSession]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Gradient top bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

            {/* Header */}
            <div className="px-6 pt-7 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white leading-tight">
                      Completá tu perfil
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Solo lo pedimos una vez 👾
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                Para participar en sorteos y torneos necesitamos un par de datos más. ¡Te toma menos de un minuto!
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-6" />

            {/* Success state */}
            {done ? (
              <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-black text-white">¡Listo!</h3>
                <p className="text-gray-400 text-sm">Tu perfil quedó completo.</p>
              </div>
            ) : (
              <form
                ref={formRef}
                action={formAction}
                className="px-6 pb-6 pt-5 space-y-4"
              >
                {/* Global error */}
                {state.message && !state.success && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300">{state.message}</p>
                  </div>
                )}

                {/* Full name */}
                <div className="space-y-1.5">
                  <Label htmlFor="ocp-name" className="text-gray-300 text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" /> Nombre completo
                  </Label>
                  <Input
                    id="ocp-name"
                    name="name"
                    required
                    defaultValue={(state?.payload?.name as string) || (session?.user?.name || "")}
                    placeholder="Ej: Juan Pérez"
                    className={`bg-zinc-900 border-white/10 text-white h-10 focus:ring-yellow-500/50 ${
                      state?.errors?.name ? "border-red-500" : ""
                    }`}
                  />
                  {state?.errors?.name && (
                    <p className="text-xs text-red-400">{state.errors.name[0]}</p>
                  )}
                </div>

                {/* Alias */}
                <div className="space-y-1.5">
                  <Label htmlFor="ocp-alias" className="text-gray-300 text-sm flex items-center gap-1.5">
                    <span className="text-gray-500 text-xs font-mono">@</span> Alias de jugador
                  </Label>
                  <Input
                    id="ocp-alias"
                    name="alias"
                    required
                    defaultValue={(state?.payload?.alias as string) || ""}
                    placeholder="Ej: Slayer99"
                    maxLength={20}
                    className={`bg-zinc-900 border-white/10 text-white h-10 focus:ring-yellow-500/50 ${
                      state?.errors?.alias ? "border-red-500" : ""
                    }`}
                  />
                  {state?.errors?.alias && (
                    <p className="text-xs text-red-400">{state.errors.alias[0]}</p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="ocp-phone" className="text-gray-300 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-500" /> Teléfono{" "}
                    <span className="text-gray-600 text-xs">(Opcional)</span>
                  </Label>
                  <Input
                    id="ocp-phone"
                    name="phone"
                    type="tel"
                    defaultValue={(state?.payload?.phone as string) || ""}
                    placeholder="+54 9 ..."
                    className="bg-zinc-900 border-white/10 text-white h-10 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Province & City */}
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-sm flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" /> Ubicación (Argentina)
                  </Label>
                  <LocationSelector
                    initialProvince={(state?.payload?.province as string) || ""}
                    initialCity={(state?.payload?.city as string) || ""}
                    provinceError={state?.errors?.province?.[0]}
                    cityError={state?.errors?.city?.[0]}
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-black text-sm rounded-xl shadow-lg shadow-yellow-500/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Guardar y continuar
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
