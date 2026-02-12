"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prize } from "@prisma/client";

export async function getPrizes(onlyActive = false) {
  return await db.prize.findMany({
    where: onlyActive ? { active: true } : undefined,
    orderBy: { order: "asc" },
  });
}

export async function getPrizesPageConfig() {
  const section = await db.siteSection.findUnique({
    where: { key: "prizes_section" },
  });
  return section?.content || {};
}

export async function createPrize(data: Omit<Prize, "id" | "createdAt" | "updatedAt">) {
  try {
    const newPrize = await db.prize.create({
      data: {
        ...data,
        images: data.images as any,
      },
    });
    revalidatePath("/premios");
    revalidatePath("/admin/prizes");
    return { success: true, prize: newPrize };
  } catch (error) {
    console.error("Error creating prize:", error);
    return { success: false, error: "Failed to create prize" };
  }
}

export async function updatePrize(id: string, data: Partial<Prize>) {
  try {
    const updatedPrize = await db.prize.update({
      where: { id },
      data: {
        ...data,
        images: data.images as any,
      },
    });
    revalidatePath("/premios");
    revalidatePath("/admin/prizes");
    return { success: true, prize: updatedPrize };
  } catch (error) {
    console.error("Error updating prize:", error);
    return { success: false, error: "Failed to update prize" };
  }
}

export async function deletePrize(id: string) {
  try {
    await db.prize.delete({
      where: { id },
    });
    revalidatePath("/premios");
    revalidatePath("/admin/prizes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting prize:", error);
    return { success: false, error: "Failed to delete prize" };
  }
}

export async function updatePrizesPageConfig(content: any) {
  try {
    await db.siteSection.upsert({
      where: { key: "prizes_section" },
      update: { content },
      create: { key: "prizes_section", content },
    });
    revalidatePath("/premios");
    return { success: true };
  } catch (error) {
    console.error("Error updating prizes page config:", error);
    return { success: false, error: "Failed to update config" };
  }
}
