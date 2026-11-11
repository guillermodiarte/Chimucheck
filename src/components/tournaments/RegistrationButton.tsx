"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { registerPlayer, registerPlayerWithProfile } from "@/app/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Swords,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { LocationSelector } from "@/components/ui/LocationSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PlayerData {
  id: string;
  name?: string | null;
  alias?: string | null;
  email?: string | null;
  phone?: string | null;
  province?: string | null;
  city?: string | null;
  needsProfileCompletion?: boolean;
}

interface RegistrationButtonProps {
  tournamentId: string;
  userId: string;
  registrationStatus?: string | null;
  isRestricted?: boolean;
  player?: PlayerData | null;
}

export default function RegistrationButton({
  tournamentId,
  userId,
  registrationStatus,
  isRestricted = false,
  player = null,
}: RegistrationButtonProps) {
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(registrationStatus === "PENDING");
  const router = useRouter();

  // Form state for profile completion
  const [name, setName] = useState(player?.name || "");
  const [alias, setAlias] = useState(player?.alias || "");
  const [phone, setPhone] = useState(player?.phone || "");
  const [province, setProvince] = useState(player?.province || "");
  const [city, setCity] = useState(player?.city || "");

  // Update form fields if player prop changes
  useEffect(() => {
    if (player) {
      if (player.name) setName(player.name);
      if (player.alias) setAlias(player.alias);
      if (player.phone) setPhone(player.phone);
      if (player.province) setProvince(player.province);
      if (player.city) setCity(player.city);
    }
  }, [player]);

  useEffect(() => {
    if (registrationStatus === "PENDING") {
      setShowPendingModal(true);
    }
  }, [registrationStatus]);

  // Check if player still needs to fill required tournament data
  const isProfileIncomplete = Boolean(
    player?.needsProfileCompletion ||
    !player?.province ||
    !player?.city ||
    !player?.name
  );

  function handleMainButtonClick() {
    if (isProfileIncomplete) {
      setShowProfileModal(true);
    } else {
      setShowConfirmModal(true);
    }
  }

  // Registration for users who already have complete profile
  async function handleDirectRegister() {
    setIsLoading(true);
    try {
      const result = await registerPlayer(tournamentId, userId);

      if (result.success) {
        toast.success(result.message);
        setShowConfirmModal(false);
        router.refresh();
      } else {
        if (result.needsProfileCompletion) {
          setShowConfirmModal(false);
          setShowProfileModal(true);
        }
        toast.error(result.message);
      }
    } catch {
      toast.error("Ocurrió un error inesperado al inscribirte");
    } finally {
      setIsLoading(false);
    }
  }

  // Registration with profile completion & editing
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedAlias = alias.trim();
    const trimmedPhone = phone.trim();
    const trimmedProvince = province.trim();
    const trimmedCity = city.trim();

    if (!trimmedName || trimmedName.length < 2) {
      toast.error("Ingresá tu nombre completo (mínimo 2 letras)");
      return;
    }
    if (!trimmedAlias || trimmedAlias.length < 2) {
      toast.error("Ingresá un alias de jugador (mínimo 2 letras)");
      return;
    }
    if (!trimmedProvince) {
      toast.error("Seleccioná tu provincia");
      return;
    }
    if (!trimmedCity) {
      toast.error("Seleccioná tu localidad");
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerPlayerWithProfile(tournamentId, {
        name: trimmedName,
        alias: trimmedAlias,
        phone: trimmedPhone || undefined,
        province: trimmedProvince,
        city: trimmedCity,
      });

      if (result.success) {
        toast.success(result.message);
        setShowProfileModal(false);
        // Refresh session to clear needsProfileCompletion flag
        try {
          await updateSession({
            needsProfileCompletion: false,
            alias: trimmedAlias,
          });
        } catch {}
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Ocurrió un error al guardar los datos e inscribirte");
    } finally {
      setIsLoading(false);
    }
  }

  if (registrationStatus === "REJECTED") {
    return (
      <Button
        disabled
        className="w-full bg-red-900/50 text-red-200 border border-red-500/30 font-bold text-lg py-6 cursor-not-allowed"
      >
        <AlertCircle className="w-6 h-6 mr-2" />
        Inscripción Rechazada
      </Button>
    );
  }

  if (registrationStatus === "PENDING") {
    return (
      <>
        <Button
          onClick={() => setShowPendingModal(true)}
          className="w-full bg-gray-800 text-gray-400 border border-gray-700 font-bold text-lg py-6 hover:bg-gray-700 transition-colors"
        >
          <Clock className="w-6 h-6 mr-2" />
          Inscripción Pendiente
        </Button>

        {showPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2 animate-pulse border border-yellow-500/20">
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Inscripción en Revisión</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Tu solicitud para participar en este torneo requiere aprobación manual. Te notificaremos cuando un administrador la revise.
                </p>
              </div>
              <Button
                onClick={() => setShowPendingModal(false)}
                className="w-full bg-zinc-800 text-white hover:bg-zinc-700 font-bold h-11"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleMainButtonClick}
        className="w-full bg-primary text-black hover:bg-yellow-400 font-bold text-lg py-6 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all transform hover:-translate-y-1"
      >
        <Swords className="w-6 h-6 mr-2" />
        ¡Inscribirme Ahora!
      </Button>

      {/* Direct Confirmation Modal (for players who already have complete profile) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Swords className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">¿Inscribirte al torneo?</h3>
              <p className="text-sm text-gray-400">
                {isRestricted
                  ? "Este torneo requiere aprobación. Tu solicitud quedará pendiente hasta que un administrador la revise."
                  : "Vas a confirmar tu inscripción a este torneo. ¡Preparate para competir!"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDirectRegister}
                disabled={isLoading}
                className="flex-1 bg-primary text-black hover:bg-yellow-400 font-bold"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Sí, inscribirme
              </Button>
              <Button
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="flex-1 bg-white text-black hover:bg-gray-200 font-bold"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion / Confirmation Modal (appears ONLY on tournament registration) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-md my-auto bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top gradient highlight */}
            <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

            <div className="p-6">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Completá tus datos para el torneo
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Revisá la información precargada de tu cuenta y completá los datos faltantes para confirmar tu inscripción.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" /> Nombre completo <span className="text-yellow-400">*</span>
                  </Label>
                  <Input
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ej: Juan Pérez"
                    className="bg-zinc-900 border-white/10 text-white h-10 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Alias */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-alias" className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                    <span className="text-gray-500 text-xs font-mono">@</span> Alias de jugador <span className="text-yellow-400">*</span>
                  </Label>
                  <Input
                    id="reg-alias"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    required
                    maxLength={20}
                    placeholder="Ej: Slayer99"
                    className="bg-zinc-900 border-white/10 text-white h-10 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-500" /> Teléfono de contacto
                    <span className="text-gray-500 text-[10px]">(Opcional)</span>
                  </Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 ..."
                    className="bg-zinc-900 border-white/10 text-white h-10 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Province & City */}
                <div className="space-y-1.5">
                  <LocationSelector
                    initialProvince={province}
                    initialCity={city}
                    onProvinceChange={(p) => setProvince(p)}
                    onCityChange={(c) => setCity(c)}
                    required
                  />
                </div>

                <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[11px] text-yellow-300/80 leading-relaxed">
                  💡 Estos datos se guardarán en tu perfil para que no tengas que volver a completarlos en futuros torneos. Podés editarlos luego desde tu perfil.
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProfileModal(false)}
                    disabled={isLoading}
                    className="flex-1 border-white/10 text-gray-300 hover:text-white hover:bg-white/5 h-11"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-black text-sm h-11 shadow-lg shadow-yellow-500/20 hover:brightness-110"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        Inscribiendo...
                      </>
                    ) : (
                      <>
                        Confirmar e Inscribirme
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
