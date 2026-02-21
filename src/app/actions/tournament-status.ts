"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
type TournamentStatus = "INSCRIPCION" | "EN_JUEGO" | "FINALIZADO";

export async function updateTournamentStatus(id: string, newStatus: TournamentStatus) {
  try {
    await db.tournament.update({
      where: { id },
      data: { status: newStatus },
    });
    revalidatePath("/admin/tournaments");
    return { success: true };
  } catch (error) {
    console.error("Error updating tournament status:", error);
    return { success: false, message: "Error al actualizar estado" };
  }
}
