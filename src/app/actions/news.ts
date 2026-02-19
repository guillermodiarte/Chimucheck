"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const NewsSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  imageUrl: z.string().optional().or(z.literal("")),
  url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  published: z.boolean().optional(),
});

// CREATE NEWS
export async function createNews(prevState: any, formData: FormData) {
  const validatedFields = NewsSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl"),
    url: formData.get("url"),
    published: formData.get("published") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { title, content, imageUrl, url, published } = validatedFields.data;
  const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") + "-" + Date.now();

  try {
    await db.news.create({
      data: {
        title,
        slug,
        content,
        imageUrl: imageUrl || null,
        url: url || null,
        published: published || false,
      },
    });
  } catch (error) {
    return {
      message: "Error de base de datos: No se pudo crear la noticia.",
    };
  }

  revalidatePath("/admin/news");
  redirect("/admin/news");
}

// UPDATE NEWS
export async function updateNews(id: string, prevState: any, formData: FormData) {
  const validatedFields = NewsSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl"),
    url: formData.get("url"),
    published: formData.get("published") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
      payload: {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        imageUrl: formData.get("imageUrl") as string,
        url: formData.get("url") as string,
        published: formData.get("published") === "on",
      }
    };
  }

  const { title, content, imageUrl, url, published } = validatedFields.data;
  // Don't update slug to preserve SEO URLs

  try {
    await db.news.update({
      where: { id },
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        url: url || null,
        published: published || false,
      },
    });
  } catch (error) {
    return {
      message: "Error de base de datos: No se pudo actualizar la noticia.",
      payload: {
        title, content, imageUrl, published
      }
    };
  }

  revalidatePath("/admin/news");
  redirect("/admin/news");
}

export async function toggleNewsStatus(id: string, currentStatus: boolean) {
  try {
    await db.news.update({
      where: { id },
      data: { published: !currentStatus },
    });
    revalidatePath("/admin/news");
  } catch (error) {
    console.error("Error al cambiar estado de la noticia.", error);
  }
}

export async function deleteNews(id: string) {
  try {
    await db.news.delete({
      where: { id },
    });
    revalidatePath("/admin/news");
  } catch (error) {
    console.error("Error al eliminar la noticia.", error);
  }
}
