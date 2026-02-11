"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const EventSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.coerce.date(),
  location: z.string().optional(),
  imageUrl: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
});

export async function createEvent(prevState: any, formData: FormData) {
  const validatedFields = EventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    date: formData.get("date"),
    location: formData.get("location"),
    imageUrl: formData.get("imageUrl"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { name, description, date, location, imageUrl } = validatedFields.data;

  try {
    await db.event.create({
      data: {
        name,
        description,
        date,
        location,
        imageUrl: imageUrl || null,
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
