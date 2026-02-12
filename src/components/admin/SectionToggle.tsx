"use client";

import { useTransition, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateSectionContent } from "@/app/actions/sections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SectionToggleProps {
  sectionKey: string;
  initialEnabled: boolean;
  label: string;
}

export function SectionToggle({ sectionKey, initialEnabled, label }: SectionToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(initialEnabled);
  const router = useRouter();

  const handleToggle = (newChecked: boolean) => {
    setChecked(newChecked); // Optimistic update
    startTransition(async () => {
      try {
        const result = await updateSectionContent(sectionKey, { enabled: newChecked });
        if (result.success) {
          toast.success(`${label} ${newChecked ? "activada" : "desactivada"}`);
          router.refresh();
        } else {
          toast.error(result.message);
          setChecked(!newChecked); // Revert on failure
        }
      } catch (error) {
        toast.error("Error al actualizar la sección");
        setChecked(!newChecked); // Revert on failure
      }
    });
  };

  return (
    <div className="flex items-center space-x-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
      <Label htmlFor={`toggle-${sectionKey}`} className="text-white cursor-pointer select-none text-sm font-medium">
        {label}
      </Label>
      <Switch
        id={`toggle-${sectionKey}`}
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-gray-700"
      />
    </div>
  );
}
