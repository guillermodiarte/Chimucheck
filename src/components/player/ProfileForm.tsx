"use client";

import { useState, useTransition } from "react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/player-profile"; // We need to create this action
import { Loader2 } from "lucide-react";

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
  const [isPending, startTransition] = useTransition();
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

  function onSubmit(values: z.infer<typeof profileSchema>) {
    startTransition(async () => {
      const result = await updateProfile({
        alias: values.alias,
        name: values.name,
        phone: values.phone,
        password: values.password || undefined,
      });

      if (result.success) {
        toast.success("Perfil actualizado correctamente");
        router.refresh();
      } else {
        toast.error(result.message || "Error al actualizar perfil");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="alias"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Alias</FormLabel>
              <FormControl>
                <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Nombre Completo</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-white/10 pt-4 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cambiar Contraseña (Opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-primary text-black font-bold hover:bg-primary/90" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
