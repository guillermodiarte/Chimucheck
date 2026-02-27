"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const EventSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.preprocess((arg) => (arg === "" || arg === undefined ? null : arg), z.coerce.date().nullable().optional()),
  location: z.preprocess((arg) => (arg === "" || arg === undefined ? null : arg), z.string().nullable().optional()),
  imageUrl: z.string().optional().or(z.literal("")),
  url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export async function createEvent(prevState: any, formData: FormData) {
  const validatedFields = EventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    location: formData.get("location"),
    imageUrl: formData.get("imageUrl"),
    url: formData.get("url"),
    active: formData.get("active") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { name, description, date, location, imageUrl, url, active } = validatedFields.data;

  try {
    await db.event.create({
      data: {
        name,
        description,
        date: date || undefined,
        location,
        imageUrl: imageUrl || null,
        url: url || null,
        active: active || false,
      },
    });
  } catch (error) {
    return {
      message: "Error de base de datos: No se pudo crear el evento.",
    };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(id: string, prevState: any, formData: FormData) {
  const validatedFields = EventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    location: formData.get("location"),
    imageUrl: formData.get("imageUrl"),
    url: formData.get("url"),
    active: formData.get("active") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
      payload: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        date: formData.get("date") as string,
        location: formData.get("location") as string,
        imageUrl: formData.get("imageUrl") as string,
        url: formData.get("url") as string,
        active: formData.get("active") === "on",
      }
    };
  }

  const { name, description, date, location, imageUrl, url, active } = validatedFields.data;

  try {
    await db.event.update({
      where: { id },
      data: {
        name,
        description,
        date: date || null,
        location,
        imageUrl: imageUrl || null,
        url: url || null,
        active: active || false,
      },
    });
  } catch (error) {
    return {
      message: `Error DB: ${error instanceof Error ? error.message : String(error)}`,
      payload: {
        name, description, date: date ? date.toString() : "", location, imageUrl, url, active
      }
    };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function toggleEventStatus(id: string, currentStatus: boolean) {
  try {
    await db.event.update({
      where: { id },
      data: { active: !currentStatus },
    });
    revalidatePath("/admin/events");
  } catch (error) {
    console.error("Error al cambiar estado del evento.", error);
  }
}

export async function deleteEvent(id: string) {
  try {
    await db.event.delete({
      where: { id },
    });
    revalidatePath("/admin/events");
  } catch (error) {
    console.error("Error al eliminar el evento.", error);
  }
}
