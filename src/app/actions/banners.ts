"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const BannerSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  subtitle: z.string().optional(),
  // Allow local paths (starting with /) or absolute URLs
  imageUrl: z.string().refine((val) => val.startsWith("/") || val.startsWith("http") || val.length > 0, {
    message: "URL de imagen inválida (debe ser una URL válida o una ruta local)"
  }),
  link: z.string().optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().optional(),
});

export async function createBanner(prevState: any, formData: FormData) {
  const rawData = {
    title: formData.get("title") as string,
    subtitle: formData.get("subtitle") as string,
    imageUrl: formData.get("imageUrl") as string,
    link: formData.get("link") as string,
    active: formData.get("active") === "on",
    order: formData.get("order"),
  };

  const validatedFields = BannerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
      payload: rawData, // Return data to repopulate form
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
        order: Number(order) || 0,
      },
    });
  } catch (error) {
    return {
      message: "Error de base de datos: No se pudo crear el banner.",
      payload: rawData,
    };
  }

  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}

export async function updateBanner(id: string, prevState: any, formData: FormData) {
  const rawData = {
    title: formData.get("title") as string,
    subtitle: formData.get("subtitle") as string,
    imageUrl: formData.get("imageUrl") as string,
    link: formData.get("link") as string,
    active: formData.get("active") === "on",
    order: formData.get("order"),
  };

  const validatedFields = BannerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
      payload: rawData,
    };
  }

  const { title, subtitle, imageUrl, link, active, order } = validatedFields.data;

  try {
    await db.banner.update({
      where: { id },
      data: {
        title,
        subtitle,
        imageUrl,
        link,
        active,
        order: Number(order) || 0,
      },
    });
  } catch (error) {
    return {
      message: "Error de base de datos: No se pudo actualizar el banner.",
      payload: rawData,
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
