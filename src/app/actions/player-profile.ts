"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { join } from "path";

export async function updateProfile(data: {
  alias: string;
  name?: string;
  phone?: string;
  password?: string;
  image?: string;
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

    const currentPlayer = await db.player.findUnique({
      where: { id: session.user.id }
    });

    const updateData: any = {
      alias: data.alias,
      name: data.name,
      phone: data.phone,
    };

    // Handle image update and cleanup
    if (data.image) {
      updateData.image = data.image;

      // If there was an old image and it's a local file (in avatars folder), delete it
      if (currentPlayer?.image && currentPlayer.image !== data.image && currentPlayer.image.startsWith('/uploads/avatars/')) {
        try {
          const filename = currentPlayer.image.replace('/uploads/avatars/', '');
          const filePath = join(process.cwd(), 'public', 'uploads', 'avatars', filename);
          console.log("Attempting to delete old avatar at:", filePath);
          await unlink(filePath);
          console.log("Deleted old avatar:", filePath);
        } catch (err) {
          console.error("Error deleting old avatar:", err);
          // Continue even if delete fails
        }
      }
    }

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
