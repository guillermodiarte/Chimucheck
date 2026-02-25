"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/player-profile";
import { Loader2, Lock, Save, User, Phone, Camera, Upload, Shield, Mail, Calendar, Trophy, Eye, EyeOff, Coins, Gamepad2, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";

const profileSchema = z.object({
  alias: z.string().min(2, "El alias debe tener al menos 2 caracteres"),
  name: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export function ProfileForm({ player }: { player: any }) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(player.image);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      alias: player.alias || "",
      name: player.name || "",
      phone: player.phone || "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar los 5MB");
        return;
      }
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageError(false);
    }
  };

  function onSubmit(values: z.infer<typeof profileSchema>) {
    startTransition(async () => {
      let imageUrl = player.image;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("folder", "avatars");
        formData.append("customName", `avatar-${player.id}`);

        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) throw new Error("Error subiendo imagen");

          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            imageUrl = uploadData.url;
          } else {
            throw new Error(uploadData.message);
          }
        } catch (error) {
          toast.error("Error al subir la imagen");
          console.error(error);
          return;
        }
      }

      const result = await updateProfile({
        alias: values.alias,
        name: values.name,
        phone: values.phone,
        password: values.password || undefined,
        image: imageUrl,
      });

      if (result.success) {
        await update({
          image: imageUrl,
          alias: values.alias
        });
        toast.success("Perfil actualizado correctamente");
        router.refresh();
      } else {
        toast.error(result.message || "Error al actualizar perfil");
      }
    });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-10">

      {/* 1. Profile Header Card (Interactive Avatar) */}
      <div className="relative mb-20">
        <div className="h-48 w-full rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-4 right-6 flex gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1"><Shield size={14} className="text-primary" /> SECURE PROFILE</span>
            <span>ID: {player.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Floating Interactive Avatar */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-b from-primary to-transparent shadow-[0_0_30px_rgba(255,215,0,0.3)] group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-950 border-4 border-black">
              {previewUrl && !imageError ? (
                <Image
                  src={previewUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-5xl font-bold text-zinc-700">
                  {player.alias?.[0]?.toUpperCase() || "P"}
                </div>
              )}

              {/* Hover Overlay with Camera Icon */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <Camera className="text-white drop-shadow-lg" size={32} />
              </div>
            </div>

            {/* Status Indicator / Upload Icon */}
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-zinc-900 border-2 border-primary rounded-full flex items-center justify-center text-primary shadow-lg z-10">
              <Upload size={14} />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 2. Identity Section */}
      <div className="text-center mb-12 mt-6 space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
          {player.alias || "JUGADOR SIN ALIAS"}
        </h1>
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Mail size={14} />
          <span className="text-sm">{player.email}</span>
          <span className="mx-2 text-zinc-700">|</span>
          <Calendar size={14} />
          <span className="text-sm">Miembro desde {formatDate(player.createdAt)}</span>
        </div>
      </div>
      {/* Dashboard Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Chimucoins Card */}
        <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-200">Chimucoins</span>
            <Coins className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-black text-yellow-400">{player.chimucoins || 0} 🟡</div>
          <p className="text-xs text-gray-500 mt-1">Monedas disponibles</p>
        </div>

        {/* Torneos Card */}
        <Link href="/player/dashboard/tournaments" className="block">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-colors h-full group cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-200">Torneos Participados</span>
              <Gamepad2 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">{player.registrations?.length || 0}</div>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 group-hover:text-blue-400 transition-colors">
              Ver historial <ChevronRight size={12} />
            </p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 3. Left Column: Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="text-primary" size={20} />
                Estadísticas
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-primary">{player.chimucoins}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Monedas</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-white">{player.stats?.matchesPlayed || 0}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Partidas Jugadas</div>
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{player.stats?.winsFirst || 0}</div>
                    <div className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-bold">🥇 1° Puesto</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-400/10 border border-gray-400/20 text-center">
                    <div className="text-2xl font-bold text-gray-300">{player.stats?.winsSecond || 0}</div>
                    <div className="text-[10px] text-gray-400/80 uppercase tracking-wider font-bold">🥈 2° Puesto</div>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                    <div className="text-2xl font-bold text-orange-400">{player.stats?.winsThird || 0}</div>
                    <div className="text-[10px] text-orange-400/80 uppercase tracking-wider font-bold">🥉 3° Puesto</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Right Column: Form Inputs */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900 border-white/10 shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            <CardContent className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Editar Perfil</h2>
                <p className="text-zinc-400 text-sm">Actualiza tu información personal y de seguridad.</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="alias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-400 font-medium flex items-center gap-2">
                            <User size={16} className="text-primary" /> Alias (Visible en torneos)
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                {...field}
                                className="bg-black/40 border-white/10 text-white h-12 px-4 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-lg placeholder:text-zinc-600"
                                placeholder="Tu alias de jugador"
                              />
                              <div className="absolute inset-0 rounded-md bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-500"></div>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-medium">Nombre Completo</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-black/40 border-white/10 text-white h-11 focus:border-white/20 transition-all"
                                placeholder="Nombre Real"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-medium flex items-center gap-2">
                              <Phone size={14} /> Teléfono
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-black/40 border-white/10 text-white h-11 focus:border-white/20 transition-all"
                                placeholder="+54 9 ..."
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 rounded-lg bg-zinc-800/50 text-primary">
                        <Lock size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Seguridad</h3>
                        <p className="text-xs text-zinc-500">Deja en blanco si no quieres cambiar la contraseña.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-medium">Nueva Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  {...field}
                                  className="bg-black/40 border-white/10 text-white h-11 focus:border-primary/50 transition-all pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-medium">Confirmar Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  {...field}
                                  className="bg-black/40 border-white/10 text-white h-11 focus:border-primary/50 transition-all pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-primary to-yellow-500 hover:to-primary text-black font-black uppercase tracking-wide shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-[1.01]"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-5 w-5" />
                      )}
                      GUARDAR CAMBIOS
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Actividad Reciente */}
      {player.registrations && player.registrations.length > 0 && (
        <div className="mt-8">
          <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Actividad Reciente</h3>
                <Link
                  href="/player/dashboard/tournaments"
                  className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                >
                  Ver todos <ChevronRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {player.registrations.slice(0, 5).map((reg: any) => (
                  <Link
                    key={reg.id}
                    href={`/torneos/${reg.tournament.id}`}
                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 hover:bg-white/2 -mx-2 px-2 rounded transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{reg.tournament.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(reg.tournament.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(reg.tournament.status === "IN_PROGRESS" || reg.tournament.status === "FINISHED" || reg.tournament.status === "EN_JUEGO" || reg.tournament.status === "FINALIZADO") && (
                        <span className="text-xs font-bold text-primary">{reg.score ?? 0} pts</span>
                      )}
                      <div className={`text-xs font-medium px-2 py-1 rounded ${reg.status === "CONFIRMED" ? "bg-green-500/20 text-green-400" :
                        reg.status === "ELIMINATED" ? "bg-red-500/20 text-red-400" :
                          "bg-white/5 text-gray-300"
                        }`}>
                        {reg.status === "CONFIRMED" ? "Inscrito" :
                          reg.status === "ELIMINATED" ? "Eliminado" : "Pendiente"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
