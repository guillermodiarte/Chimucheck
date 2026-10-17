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
    await ensureConsistentOrders();
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
    await ensureConsistentOrders();
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
    await ensureConsistentOrders();
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
    revalidatePath("/");
  } catch (error) {
    console.error("Error al actualizar estado.", error);
  }
}

export interface ReorderItem {
  id: string;
  type: "banner" | "top_players";
}

export async function reorderAllBanners(items: ReorderItem[]) {
  try {
    await db.$transaction(async (tx) => {
      const topSection = await tx.siteSection.findUnique({
        where: { key: "banner_top_players" },
      });
      const currentTopContent = (topSection?.content as any) || { enabled: true, order: 2 };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const newOrder = i + 1;

        if (item.type === "banner") {
          await tx.banner.update({
            where: { id: item.id },
            data: { order: newOrder },
          });
        } else if (item.type === "top_players") {
          await tx.siteSection.upsert({
            where: { key: "banner_top_players" },
            update: {
              content: {
                ...currentTopContent,
                order: newOrder,
              },
            },
            create: {
              key: "banner_top_players",
              content: {
                ...currentTopContent,
                order: newOrder,
              },
            },
          });
        }
      }
    });

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true, message: "Posiciones actualizadas correctamente" };
  } catch (error) {
    console.error("Error al reordenar banners:", error);
    return { success: false, message: "Error al reordenar banners" };
  }
}

export async function toggleTopPlayersBanner(enabled: boolean) {
  try {
    const topSection = await db.siteSection.findUnique({
      where: { key: "banner_top_players" },
    });
    const currentTopContent = (topSection?.content as any) || { order: 2 };

    await db.siteSection.upsert({
      where: { key: "banner_top_players" },
      update: {
        content: {
          ...currentTopContent,
          enabled,
        },
      },
      create: {
        key: "banner_top_players",
        content: {
          ...currentTopContent,
          enabled,
        },
      },
    });

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de Top 5:", error);
    return { success: false };
  }
}

export async function ensureConsistentOrders() {
  try {
    const banners = await db.banner.findMany({
      orderBy: { order: "asc" },
    });

    const topSection = await db.siteSection.findUnique({
      where: { key: "banner_top_players" },
    });
    const currentTopContent = (topSection?.content as any) || { enabled: true, order: 2 };
    const topOrder = typeof currentTopContent.order === "number" ? currentTopContent.order : 2;

    const list: { id: string; type: "banner" | "top_players"; order: number }[] = [
      ...banners.map((b) => ({ id: b.id, type: "banner" as const, order: b.order })),
      { id: "top_players", type: "top_players" as const, order: topOrder },
    ].sort((a, b) => a.order - b.order);

    await reorderAllBanners(list.map((i) => ({ id: i.id, type: i.type })));
  } catch (error) {
    console.error("Error al asegurar órdenes consistentes:", error);
  }
}


