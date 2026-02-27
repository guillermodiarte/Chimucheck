"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateRestrictPlayerRegistration } from "@/app/actions/settings";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings, ShieldAlert } from "lucide-react";

interface GlobalSettingsManagerProps {
  initialSettings: any;
}

export default function GlobalSettingsManager({ initialSettings }: GlobalSettingsManagerProps) {
  const [restrictRegistration, setRestrictRegistration] = useState(
    initialSettings?.restrictPlayerRegistration || false
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    setRestrictRegistration(checked);
    try {
      const result = await updateRestrictPlayerRegistration(checked);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setRestrictRegistration(!checked); // revert UI
      }
    } catch (error) {
      toast.error("Error al guardar la configuración");
      setRestrictRegistration(!checked); // revert UI
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Ajustes del Sistema
        </h2>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 max-w-[70%]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              Restringir Registro de Jugadores
            </h3>
            <p className="text-sm text-gray-400">
              Si está activado, los nuevos usuarios que se registren no podrán iniciar sesión inmediatamente. Entrarán a una lista de "Solicitudes de Jugadores" (en la sección Solicitudes) donde un administrador deberá aprobarlos o rechazarlos manualmente.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isUpdating && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            <Switch
              checked={restrictRegistration}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
