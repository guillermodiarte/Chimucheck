"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSectionContent(key: string, content: any) {
  try {
    await db.siteSection.upsert({
      where: { key },
      update: { content },
      create: { key, content },
    });
    revalidatePath("/admin/sections");
    revalidatePath("/");
    return { success: true, message: "Sección actualizada correctamente" };
  } catch (error) {
    return { success: false, message: "Error al actualizar la sección" };
  }
}
