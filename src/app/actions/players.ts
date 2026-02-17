
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPlayers() {
  try {
    const players = await db.player.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stats: true,
      },
    });
    return players;
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
}

export async function deletePlayer(id: string) {
  try {
    await db.player.delete({ where: { id } });
    revalidatePath("/admin/players");
    return { success: true };
  } catch (error) {
    console.error("Error deleting player:", error);
    return { success: false, message: "Error al eliminar jugador" };
  }
}

export async function togglePlayerStatus(id: string, currentStatus: boolean) {
  try {
    await db.player.update({
      where: { id },
      data: { active: !currentStatus },
    });
    revalidatePath("/admin/players");
  } catch (error) {
    console.error("Error toggling player status:", error);
  }
}

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const PlayerSchema = z.object({
  alias: z.string().min(2, "El alias es requerido"),
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  phone: z.string().optional(),
  chimucoins: z.coerce.number().min(0, "No puede ser negativo"),
  active: z.boolean().optional(),
  image: z.string().optional().or(z.literal("")),
});

export async function updatePlayer(id: string, prevState: any, formData: FormData) {
  const validatedFields = PlayerSchema.safeParse({
    alias: formData.get("alias"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined, // undefined to ignore if empty
    phone: formData.get("phone"),
    chimucoins: formData.get("chimucoins"),
    active: formData.get("active") === "on",
    image: formData.get("image"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { alias, name, email, password, phone, chimucoins, active, image } = validatedFields.data;

  try {
    // Check for unique email/alias (excluding current player)
    const existingEmail = await db.player.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });
    if (existingEmail) {
      return { message: "El email ya está en uso por otro jugador." };
    }

    const existingAlias = await db.player.findFirst({
      where: {
        alias,
        NOT: { id }
      }
    });
    if (existingAlias) {
      return { message: "El alias ya está en uso por otro jugador." };
    }

    const data: any = {
      alias,
      name,
      email,
      phone,
      chimucoins,
      active,
      image: image || null,
    };

    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 10);
    }

    await db.player.update({
      where: { id },
      data,
    });

  } catch (error) {
    console.error("Error updating player:", error);
    return {
      message: "Error de base de datos al actualizar jugador.",
    };
  }

  revalidatePath("/admin/players");
  redirect("/admin/players");
}
