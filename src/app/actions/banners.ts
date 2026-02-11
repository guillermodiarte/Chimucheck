"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const BannerSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  subtitle: z.string().optional(),
  imageUrl: z.string().url("URL de imagen inválida"),
  link: z.string().optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().optional(),
});

export async function createBanner(prevState: any, formData: FormData) {
  const validatedFields = BannerSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    imageUrl: formData.get("imageUrl"),
    link: formData.get("link"),
    active: formData.get("active") === "on",
    order: formData.get("order"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { title, subtitle, imageUrl, link, active, order } = validatedFields.data;

  try {
    await db.banner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        link,
        active: active || true,
        order: order || 0,
      },
    });
  } catch (error) {
    return {
      message: "Error de base de datos: No se pudo crear el banner.",
    };
  }

  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}

export async function deleteBanner(id: string) {
  try {
    await db.banner.delete({
      where: { id },
    });
    revalidatePath("/admin/banners");
  } catch (error) {
    console.error("Error al eliminar el banner.", error);
  }
}

export async function toggleBannerStatus(id: string, currentStatus: boolean) {
  try {
    await db.banner.update({
      where: { id },
      data: { active: !currentStatus }
    });
    revalidatePath("/admin/banners");
  } catch (error) {
    console.error("Error al actualizar estado.", error);
  }
}
