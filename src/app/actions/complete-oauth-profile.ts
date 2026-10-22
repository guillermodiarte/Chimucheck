"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import locationsData from "@/data/provincias_localidades.json";

const rawLocations = locationsData as Record<string, string[]>;
const ALL_PROVINCES = Object.keys(rawLocations);

const CompleteProfileSchema = z
  .object({
    alias: z
      .string()
      .min(2, "El alias debe tener al menos 2 caracteres")
      .max(20, "El alias no puede superar 20 caracteres")
      .regex(/^[a-zA-Z0-9_\-. ]+$/, "Solo letras, números, guiones y puntos"),
    name: z.string().min(2, "El nombre completo es requerido"),
    phone: z.string().optional(),
    province: z
      .string()
      .min(1, "Debes seleccionar una provincia")
      .refine((prov) => ALL_PROVINCES.includes(prov), {
        message: "La provincia seleccionada no es válida",
      }),
    city: z.string().min(1, "Debes seleccionar una localidad"),
  })
  .superRefine((data, ctx) => {
    if (data.province && data.city) {
      const validCities = rawLocations[data.province] || [];
      if (!validCities.includes(data.city)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La localidad '${data.city}' no pertenece a ${data.province}`,
          path: ["city"],
        });
      }
    }
  });

export type CompleteProfileState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  payload?: Record<string, string>;
};

export async function completeOAuthProfile(
  prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "No autenticado" };
  }

  const rawData = {
    alias: (formData.get("alias") as string)?.trim() || "",
    name: (formData.get("name") as string)?.trim() || "",
    phone: (formData.get("phone") as string)?.trim() || undefined,
    province: (formData.get("province") as string)?.trim() || "",
    city: (formData.get("city") as string)?.trim() || "",
  };

  const parsed = CompleteProfileSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }
    return {
      success: false,
      message: "Por favor corrige los errores.",
      errors,
      payload: rawData as any,
    };
  }

  const { alias, name, phone, province, city } = parsed.data;

  try {
    // Check alias uniqueness (excluding current player)
    const existingAlias = await db.player.findFirst({
      where: { alias, id: { not: session.user.id } },
    });
    if (existingAlias) {
      return {
        success: false,
        message: "El alias ya está en uso. Elegí otro.",
        errors: { alias: ["El alias ya está en uso"] },
        payload: rawData as any,
      };
    }

    await db.player.update({
      where: { id: session.user.id },
      data: {
        alias,
        name: name || undefined,
        phone: phone || null,
        country: "Argentina",
        province,
        city,
        needsProfileCompletion: false,
      },
    });

    return {
      success: true,
      message: "¡Perfil completado con éxito!",
    };
  } catch (error) {
    console.error("completeOAuthProfile error:", error);
    return {
      success: false,
      message: "Error al guardar los datos. Intentá de nuevo.",
      payload: rawData as any,
    };
  }
}
