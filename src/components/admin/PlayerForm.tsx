"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updatePlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { CATEGORIES, calculateRank, RANK_TIERS, MMR_CONSTANTS } from "@/lib/mmr";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Dynamic MMR categories for the schema
const categorySchemaFields = CATEGORIES.reduce((acc, cat) => {
  acc[`mmr_${cat}` as keyof typeof acc] = z.coerce.number().min(0).max(100).default(0) as any;
  return acc;
}, {} as Record<string, z.ZodTypeAny>);

export const playerSchema = z.object({
  alias: z.string().min(2, "El alias es requerido"),
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  chimucoins: z.coerce.number().min(0, "Mínimo 0").default(0),
  password: z.string().optional(),
  active: z.boolean().default(true),
  matchesPlayed: z.coerce.number().min(0).default(0),
  winsFirst: z.coerce.number().min(0).default(0),
  winsSecond: z.coerce.number().min(0).default(0),
  winsThird: z.coerce.number().min(0).default(0),
  ...categorySchemaFields
}).superRefine((data, ctx) => {
  // 1. Validate matchesPlayed >= podiums
  const totalPodiums = data.winsFirst + data.winsSecond + data.winsThird;
  if (data.matchesPlayed < totalPodiums) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Debe ser al menos ${totalPodiums} (suma de podios)`,
      path: ["matchesPlayed"],
    });
  }

  // 2. Validate total MMR assigned <= available MMR
  const matchesWithoutPodium = Math.max(0, data.matchesPlayed - totalPodiums);
  const earnedFrom1st = data.winsFirst * MMR_CONSTANTS.POINTS_1ST; // 15
  const earnedFrom2nd = data.winsSecond * MMR_CONSTANTS.POINTS_2ND; // 10
  const earnedFrom3rd = data.winsThird * MMR_CONSTANTS.POINTS_3RD; // 5
  const lostPoints = matchesWithoutPodium * Math.abs(MMR_CONSTANTS.POINTS_LOSS); // 5

  const maxAvailableMMR = Math.max(0, (earnedFrom1st + earnedFrom2nd + earnedFrom3rd) - lostPoints);

  const totalAssignedMMR = CATEGORIES.reduce((sum, cat) => {
    return sum + (data[`mmr_${cat}` as keyof typeof data] as number || 0);
  }, 0);

  if (totalAssignedMMR > maxAvailableMMR) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Has asignado excesivos puntos (${totalAssignedMMR}). Su pool máximo generado por estadísticas es ${maxAvailableMMR}.`,
      path: ["totalMMR"], // custom path for generic UI alert
    });
  }
});

type PlayerFormValues = z.infer<typeof playerSchema> & {
  totalMMR?: string; // This field is for form error display, not actual data
};

interface PlayerFormProps {
  initialData: {
    id: string;
    alias: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    chimucoins: number;
    active: boolean;
    stats?: {
      matchesPlayed: number;
      winsFirst: number;
      winsSecond: number;
      winsThird: number;
    } | null;
    categoryStats?: {
      category: string;
      points: number;
    }[];
  };
}

export function PlayerForm({ initialData }: PlayerFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData.image || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create default values mapping
  const defaultValues: Partial<PlayerFormValues> = {
    alias: initialData.alias || "",
    name: initialData.name || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    chimucoins: initialData.chimucoins || 0,
    password: "",
    active: initialData.active ?? true,
    matchesPlayed: initialData.stats?.matchesPlayed || 0,
    winsFirst: initialData.stats?.winsFirst || 0,
    winsSecond: initialData.stats?.winsSecond || 0,
    winsThird: initialData.stats?.winsThird || 0,
  };

  // MUST populate categories before passing to useForm
  CATEGORIES.forEach((cat) => {
    const stat = initialData.categoryStats?.find(s => s.category === cat);
    // @ts-ignore
    defaultValues[`mmr_${cat}` as keyof PlayerFormValues] = stat?.points || 0;
  });

  const form = useForm({
    resolver: zodResolver(playerSchema),
    defaultValues: defaultValues as any,
    mode: "onChange"
  });

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  // Calculate Available MMR from Current Form State
  const watchStats = form.watch(["matchesPlayed", "winsFirst", "winsSecond", "winsThird"]);
  const matchesP = Number(watchStats[0]) || 0;
  const w1 = Number(watchStats[1]) || 0;
  const w2 = Number(watchStats[2]) || 0;
  const w3 = Number(watchStats[3]) || 0;

  const totalPodiums = w1 + w2 + w3;
  const matchesWithoutPodium = Math.max(0, matchesP - totalPodiums);

  const earned1 = w1 * MMR_CONSTANTS.POINTS_1ST;
  const earned2 = w2 * MMR_CONSTANTS.POINTS_2ND;
  const earned3 = w3 * MMR_CONSTANTS.POINTS_3RD;
  const lost = matchesWithoutPodium * Math.abs(MMR_CONSTANTS.POINTS_LOSS);

  const availableMMR = Math.max(0, (earned1 + earned2 + earned3) - lost);

  // Calculate Used MMR from Current Form State
  const mmrFieldsToWatch = CATEGORIES.map(c => `mmr_${c}` as const);
  // @ts-ignore
  const currentMMRValues = form.watch(mmrFieldsToWatch);
  const usedMMR = ((currentMMRValues || []) as any[]).reduce((sum, val) => (sum || 0) + (Number(val) || 0), 0) || 0;

  const onSubmit = async (values: PlayerFormValues) => {
    startTransition(async () => {
      const formData = new FormData();

      // Append standard values
      formData.append("alias", values.alias);
      formData.append("name", values.name || "");
      formData.append("email", values.email);
      formData.append("phone", values.phone || "");
      formData.append("chimucoins", values.chimucoins.toString());
      if (values.password) formData.append("password", values.password);
      formData.append("active", values.active ? "on" : "off");

      // Append Stats
      formData.append("matchesPlayed", values.matchesPlayed.toString());
      formData.append("winsFirst", values.winsFirst.toString());
      formData.append("winsSecond", values.winsSecond.toString());
      formData.append("winsThird", values.winsThird.toString());

      // Append MMR
      CATEGORIES.forEach(cat => {
        // @ts-ignore
        formData.append(`mmr_${cat}`, values[`mmr_${cat}`].toString());
      });

      // Handle Image Upload
      if (pendingFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", pendingFile);
        uploadFormData.append("customName", `avatar-${values.alias || "player"}`);
        uploadFormData.append("folder", "avatars");

        try {
          const response = await fetch("/api/upload", { method: "POST", body: uploadFormData });
          const data = await response.json();
          if (response.ok && data.success) {
            formData.set("image", data.url);
          } else {
            toast.error(data.message || "Error al subir la imagen");
            return;
          }
        } catch (error) {
          toast.error("Error al subir la imagen");
          return;
        }
      } else {
        formData.set("image", imageUrl);
      }

      // Update Player
      const dummyState = {};
      const result = await updatePlayer(initialData.id, dummyState, formData);

      if (result && result.message) {
        toast.error(result.message);
      } else {
        toast.success("Jugador actualizado con éxito");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-8">

            {/* Avatar Section */}
            <div className="space-y-2">
              <Label className="text-white">Avatar</Label>
              <div className="flex items-center gap-6">
                {imageUrl ? (
                  <div className="relative group shrink-0">
                    <img src={imageUrl} alt="Avatar Preview" className="w-24 h-24 object-cover rounded-full border-2 border-gray-700" />
                    <button
                      type="button"
                      onClick={() => { setImageUrl(""); setPendingFile(null); }}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 border-2 border-gray-700 border-dashed">
                    Sin Avatar
                  </div>
                )}
                <div className="flex-1">
                  <LocalImageUpload
                    onFileSelect={handleFileSelect}
                    label="Subir Avatar"
                    onUrlSelect={(url) => { setImageUrl(url); setPendingFile(null); }}
                  />
                  <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, GIF. Máx 5MB.</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="alias" render={({ field }) => (
                <FormItem><FormLabel className="text-white">Alias</FormLabel><FormControl><Input {...field} className="bg-gray-800 border-gray-700 text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel className="text-white">Nombre Real</FormLabel><FormControl><Input {...field} className="bg-gray-800 border-gray-700 text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel className="text-white">Email</FormLabel><FormControl><Input {...field} type="email" className="bg-gray-800 border-gray-700 text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel className="text-white">Teléfono</FormLabel><FormControl><Input {...field} className="bg-gray-800 border-gray-700 text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="chimucoins" render={({ field }) => (
                <FormItem><FormLabel className="text-yellow-500 font-bold">ChimuCoins Balance</FormLabel><FormControl><Input {...field} type="number" className="bg-gray-800 border-gray-700 text-white font-mono text-lg" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel className="text-white">Nueva Contraseña</FormLabel><FormControl><PasswordInput {...field} placeholder="Dejar en blanco para no cambiar" className="bg-gray-800 border-gray-700 text-white" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-gray-800 bg-gray-800/50 rounded-lg">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary cursor-pointer" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-white cursor-pointer">Jugador Activo</FormLabel>
                  <p className="text-xs text-gray-400">Si se desactiva, no podrá iniciar sesión en la app.</p>
                </div>
              </FormItem>
            )} />

          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">📊 Estadísticas Base</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="matchesPlayed" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 text-xs">Torneos Jugados</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" className="bg-gray-800 border-gray-700 text-white font-mono"
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;

                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400" />
                </FormItem>
              )} />
              <FormField control={form.control} name="winsFirst" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-yellow-400 text-xs font-bold">🥇 1° Puesto</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" className="bg-gray-800 border-yellow-500/30 text-white font-mono focus-visible:ring-yellow-500"
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="winsSecond" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-xs font-bold">🥈 2° Puesto</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" className="bg-gray-800 border-gray-400/30 text-white font-mono focus-visible:ring-gray-300"
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="winsThird" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-orange-400 text-xs font-bold">🥉 3° Puesto</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" className="bg-gray-800 border-orange-500/30 text-white font-mono focus-visible:ring-orange-500"
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* MMR Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Puntaje Competitivo (MMR)
              </h3>

              {/* Dynamic Math HUD */}
              <div className="flex flex-wrap items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-gray-800">
                <div className="flex flex-col items-center border-r border-gray-700 pr-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Podios G.</span>
                  <span className="text-sm font-mono text-green-400">+{(earned1 + earned2 + earned3)}</span>
                </div>
                <div className="flex flex-col items-center border-r border-gray-700 pr-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Derrotas P.</span>
                  <span className="text-sm font-mono text-red-400">-{lost}</span>
                </div>
                <div className="flex flex-col items-center px-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Pool Disponible</span>
                  <span className={`text-lg font-black font-mono transition-colors ${usedMMR > availableMMR ? 'text-red-500' : 'text-blue-400'}`}>
                    {usedMMR} <span className="text-sm text-gray-600">/</span> {availableMMR}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message if MMR exceeds limit */}
            {/* @ts-ignore */}
            {form.formState.errors.totalMMR && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-md animate-in fade-in zoom-in-95 duration-200">
                {/* @ts-ignore */}
                <p className="text-sm font-bold text-red-500">❌ {form.formState.errors.totalMMR.message}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES.map((cat) => (
                <FormField key={cat} control={form.control} name={`mmr_${cat}` as any} render={({ field }) => {
                  const points = Number(field.value) || 0;
                  const rank = calculateRank(points);
                  const rankColor = rank.tier === RANK_TIERS.PRO ? "text-yellow-500" : rank.tier === RANK_TIERS.SEMI_PRO ? "text-blue-400" : "text-green-400";

                  return (
                    <FormItem className="bg-black/20 p-3 rounded-lg border border-gray-800 shadow-inner">
                      <FormLabel className="text-blue-400 text-xs font-bold uppercase tracking-wider">{cat.replace("_", " ")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="100"
                          className="bg-gray-800 border-gray-700 text-white font-mono text-center h-12 text-lg focus-visible:ring-blue-500"
                          onChange={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) val = 0;
                            if (val > 100) val = 100;
                            if (val < 0) val = 0;
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <div className="flex justify-center mt-2 h-4">
                        <span className={`text-[10px] font-bold tracking-wide transition-colors ${rankColor}`}>
                          {rank.label}
                        </span>
                      </div>
                    </FormItem>
                  );
                }} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-12">
          <Button
            type="submit"
            disabled={isPending || usedMMR > availableMMR}
            className={`min-w-[200px] h-12 font-bold transition-all ${usedMMR > availableMMR
              ? "bg-red-500 text-white hover:bg-red-600 opacity-70 cursor-not-allowed"
              : "bg-secondary text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)]"
              }`}
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {usedMMR > availableMMR ? "Corregir Puntos" : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
