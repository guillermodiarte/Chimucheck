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
      if (currentPlayer?.image && currentPlayer.image.startsWith("/avatars/") && currentPlayer.image !== data.image) {
        try {
          // Use absolute path in production
          const isProd = process.env.NODE_ENV === "production";
          const baseDir = isProd ? "/app/public" : join(process.cwd(), "public");
          const oldImagePath = join(baseDir, currentPlayer.image); // data.image includes /avatars/ already? No, stored relative usually? 
          // Wait, database usually stores "/avatars/filename.jpg". 
          // If so, join(baseDir, "/avatars/...") works if baseDir is just /app/public and access is clean?
          // Actually, if image is "/avatars/foo.jpg", joining "/app/public" + "/avatars/foo.jpg" works.

          // Let's ensure proper pathing
          // If baseDir is /app/public
          // And currentPlayer.image is /avatars/foo.jpg
          // We want /app/public/avatars/foo.jpg

          // process.cwd() is .next/standalone. 
          // join(cwd, "public", image) -> .next/standalone/public/avatars/foo.jpg
          // This should work IF the file exists there.

          // But to be consistent with upload, let's try strict absolute path if possible.
          // Or at least log what we are trying to delete.

          console.log("Attempting to delete old avatar at:", oldImagePath);
          await unlink(oldImagePath);
          console.log("Deleted old avatar:", oldImagePath);
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
