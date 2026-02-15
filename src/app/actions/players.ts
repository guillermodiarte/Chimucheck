
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
    return { success: true };
  } catch (error) {
    console.error("Error toggling player status:", error);
    return { success: false, message: "Error al cambiar estado del jugador" };
  }
}
