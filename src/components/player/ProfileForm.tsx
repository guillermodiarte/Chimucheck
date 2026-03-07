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
import { Loader2, Lock, Save, User, Phone, Camera, Upload, Shield, Mail, Calendar, Trophy, Eye, EyeOff, Coins, Gamepad2, ChevronRight, Pencil, Globe, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { calculateRank, CATEGORIES, RANK_TIERS } from "@/lib/mmr";

const profileSchema = z.object({
  alias: z.string().min(2, "El alias debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
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

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala", "Honduras",
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
  "República Dominicana", "Uruguay", "Venezuela",
  "Alemania", "Australia", "Canadá", "China", "Corea del Sur", "Francia",
].sort();

export function ProfileForm({ player, profileBannerImage, profileBackgroundImage }: { player: any, profileBannerImage?: string, profileBackgroundImage?: string }) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(player.image);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      alias: player.alias || "",
      email: player.email || "",
      name: player.name || "",
      phone: player.phone || "",
      country: player.country || "",
      province: player.province || "",
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
      setIsEditing(true);
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
        email: values.email,
        name: values.name,
        phone: values.phone,
        country: values.country,
        province: values.province,
        password: values.password || undefined,
        image: imageUrl,
      });

      if (result.success) {
        await update({
          image: imageUrl,
          alias: values.alias
        });
        toast.success("Perfil actualizado correctamente");
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.message || "Error al actualizar perfil");
      }
    });
  }

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full px-0 sm:px-2 lg:px-4 pb-10 min-h-screen bg-cover bg-center bg-fixed relative"
      style={profileBackgroundImage ? { backgroundImage: `url(${profileBackgroundImage})` } : undefined}
    >
      {/* Dark overlay for readability */}
      {profileBackgroundImage && (
        <div className="absolute inset-0 bg-black/80 pointer-events-none z-0"></div>
      )}

      {/* Main content z-index to stay above background overlay */}
      <div className="relative z-10 w-full">
        {/* 1. Profile Header Card (Interactive Avatar) */}
        <div className="relative mb-36 mt-4">
          <div
            className="h-48 md:h-64 w-full rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 overflow-hidden relative shadow-2xl bg-cover bg-center"
            style={profileBannerImage ? { backgroundImage: `url(${profileBannerImage})` } : undefined}
          >
            {!profileBannerImage && <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>

          {/* Floating Interactive Avatar and Identity Details */}
          <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center w-full">
            <div
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-b from-primary to-transparent shadow-[0_0_30px_rgba(255,215,0,0.3)] group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-950 border-4 border-black flex items-center justify-center">
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

            <div className="text-center mt-4 space-y-1">
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-xl">
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
          </div>
        </div>

        {/* Grid Principal de 4 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 relative z-10 pt-4">

          {/* Left Column: Stats + Actividad Reciente */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            {/* Dashboard Summary Cards */}
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">Chimucoins</span>
                <Coins className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-black text-yellow-400">{player.chimucoins || 0}</div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">Torneos Jugados</span>
                <Gamepad2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{player.stats?.matchesPlayed || 0}</div>
            </div>

            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="text-primary w-4 h-4" /> Historial de Podios
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center flex flex-col justify-center">
                    <div className="text-xl font-bold text-yellow-400">{player.stats?.winsFirst || 0}</div>
                    <div className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-bold mt-1">🥇 1°</div>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-400/10 border border-gray-400/20 text-center flex flex-col justify-center">
                    <div className="text-xl font-bold text-gray-300">{player.stats?.winsSecond || 0}</div>
                    <div className="text-[10px] text-gray-400/80 uppercase tracking-wider font-bold mt-1">🥈 2°</div>
                  </div>
                  <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center flex flex-col justify-center">
                    <div className="text-xl font-bold text-orange-400">{player.stats?.winsThird || 0}</div>
                    <div className="text-[10px] text-orange-400/80 uppercase tracking-wider font-bold mt-1">🥉 3°</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actividad Reciente */}
            {player.registrations && player.registrations.length > 0 && (
              <Card className="bg-zinc-900 border-white/10 flex-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Actividad Reciente</h3>
                    <Link
                      href="/player/dashboard/tournaments"
                      className="text-xs text-zinc-400 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      Ver todos <ChevronRight size={12} />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {player.registrations.slice(0, 4).map((reg: any) => (
                      <Link
                        key={reg.id}
                        href={`/torneos/${reg.tournament.id}`}
                        className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 hover:bg-white/5 -mx-2 px-2 rounded transition-colors group"
                      >
                        <div className="space-y-0.5 max-w-[140px]">
                          <p className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">{reg.tournament.name}</p>
                          <p className="text-xs text-zinc-400">{formatDate(reg.tournament.date)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className={`text-[10px] font-medium px-2 py-0.5 rounded ${reg.status === "CONFIRMED" ? "bg-green-500/20 text-green-400" :
                            reg.status === "ELIMINATED" ? "bg-red-500/20 text-red-400" :
                              "bg-white/5 text-zinc-300"
                            }`}>
                            {reg.status === "CONFIRMED" ? "Inscrito" :
                              reg.status === "ELIMINATED" ? "Eliminado" : "Pendiente"}
                          </div>
                          {(reg.tournament.status === "IN_PROGRESS" || reg.tournament.status === "FINISHED" || reg.tournament.status === "EN_JUEGO" || reg.tournament.status === "FINALIZADO") && (
                            <span className="text-xs font-bold text-primary">{reg.score ?? 0} pts</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Column: Rango Competitivo (MMR Radar Chart) */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="bg-zinc-900/80 border-white/10 overflow-hidden relative group shadow-2xl flex-1 flex flex-col">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardContent className="p-6 md:p-8 relative z-10 flex flex-col flex-1 h-full">
                <h3 className="text-xl font-black tracking-tight text-white flex items-center justify-between mb-8">
                  <span className="flex items-center gap-2">
                    <Shield className="text-blue-400" size={24} />
                    Radar Competitivo
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">MMR System</span>
                </h3>

                {/* Radar Chart expanded */}
                <div className="w-full flex-1 min-h-[360px] mb-8 bg-black/40 rounded-xl border border-white/5 relative flex items-center justify-center p-4 shadow-inner">
                  {(!player.categoryStats || player.categoryStats.length === 0) ? (
                    <div className="text-center space-y-2">
                      <Shield className="w-12 h-12 text-zinc-700 mx-auto" />
                      <p className="text-zinc-500 text-sm font-medium">No hay historial competitivo</p>
                      <p className="text-zinc-700 text-xs">Juega torneos para ganar puntos</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={CATEGORIES.map(cat => {
                        const stat = player.categoryStats?.find((s: any) => s.category === cat);
                        return {
                          subject: cat.replace("_", " "),
                          puntos: stat?.points || 0,
                          fullMark: 100,
                        };
                      })}>
                        <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                        />
                        <Radar name="Puntos" dataKey="puntos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Ranks List */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => {
                    const stat = player.categoryStats?.find((s: any) => s.category === cat);
                    const points = stat?.points || 0;
                    const rank = calculateRank(points);

                    // Color coding based on tier
                    const tierColor = rank.tier === RANK_TIERS.PRO ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10"
                      : rank.tier === RANK_TIERS.SEMI_PRO ? "text-blue-400 border-blue-500/20 bg-blue-500/10"
                        : "text-green-400 border-green-500/20 bg-green-500/10";

                    return (
                      <div key={cat} className="flex flex-col p-3 rounded-lg bg-zinc-950 border border-white/5 hover:border-white/10 transition-colors">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1.5">{cat.replace("_", " ")}</span>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tierColor}`}>
                            {rank.label}
                          </span>
                          <span className="text-base font-black text-white">{points} <span className="text-[10px] text-zinc-600 font-normal shadow-none">PTS</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Form Inputs */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-white/10 shadow-2xl overflow-hidden h-full">
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Ajustes</h2>
                  {!isEditing ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white border-white/10 hover:border-primary/50 transition-all h-8"
                    >
                      <Pencil size={14} className="mr-1.5" />
                      Editar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                      className="text-zinc-400 hover:text-white h-8"
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="alias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                              <User size={14} className="text-primary" /> Alias (Público)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-primary/50 focus:ring-primary/20 transition-all text-sm placeholder:text-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="Tu alias"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                              <Mail size={14} className="text-primary" /> Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                disabled={!isEditing}
                                className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-white/20 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="tu@email.com"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-xs font-medium">Nombre Real</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-white/20 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="Nombre Real"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                              <Phone size={12} /> Teléfono
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-white/20 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="+54 9 ..."
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                              <Globe size={12} className="text-primary" /> País
                            </FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                disabled={!isEditing}
                                className="w-full bg-black/40 border border-white/10 text-white h-10 px-3 rounded-md focus:border-white/20 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                              >
                                <option value="" className="bg-zinc-900">Seleccionar</option>
                                {COUNTRIES.map((c) => (
                                  <option key={c} value={c} className="bg-zinc-900">{c}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                              <MapPin size={12} /> Prov / Estado
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-white/20 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="Ej: Formosa"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-primary" />
                        <h3 className="text-xs font-bold text-white">Seguridad</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-[10px] font-medium">Nueva Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  {...field}
                                  disabled={!isEditing}
                                  className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-primary/50 transition-all text-sm pr-9 disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="..."
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 text-[10px] font-medium">Confirmar Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  {...field}
                                  disabled={!isEditing}
                                  className="bg-black/40 border-white/10 text-white h-10 px-3 focus:border-primary/50 transition-all text-sm pr-9 disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="..."
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                >
                                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditing && (
                      <div className="pt-4">
                        <Button
                          type="submit"
                          disabled={isPending}
                          className="w-full h-11 bg-gradient-to-r from-primary to-yellow-500 hover:to-primary text-black font-bold shadow-lg shadow-primary/20 transition-all"
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Guardar Cambios
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
