"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  alias: string;
  name?: string;
  phone?: string;
  password?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "No autenticado" };
  }

  try {
    // Check if alias is taken by another user
    const existingAlias = await db.player.findFirst({
      where: {
        alias: data.alias,
        id: { not: session.user.id }
      }
    });

    if (existingAlias) {
      return { success: false, message: "El alias ya está en uso" };
    }

    const updateData: any = {
      alias: data.alias,
      name: data.name,
      phone: data.phone,
    };

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    await db.player.update({
      where: { id: session.user.id },
      data: updateData
    });

    revalidatePath("/player/dashboard/profile");
    revalidatePath("/player/dashboard"); // Refresh header alias

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, message: "Error al actualizar el perfil" };
  }
}
