"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingRequests() {
  try {
    return await db.tournamentRegistration.findMany({
      where: {
        status: "PENDING",
        // Solo solicitudes de torneos que aún están activos y no han finalizado
        tournament: {
          active: true,
          status: {
            notIn: ["FINALIZADO", "CANCELADO"]
          }
        }
      },
      include: {
        player: {
          select: {
            id: true,
            alias: true,
            name: true,
            image: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            date: true,
            isRestricted: true
          }
        },
      },
      orderBy: { registeredAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
}

export async function getRejectedRequests() {
  try {
    return await db.tournamentRegistration.findMany({
      where: {
        status: "REJECTED",
        tournament: {
          active: true,
          status: {
            notIn: ["FINALIZADO", "CANCELADO"]
          }
        }
      },
      include: {
        player: {
          select: {
            id: true,
            alias: true,
            name: true,
            image: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            date: true,
            isRestricted: true
          }
        },
      },
      orderBy: { registeredAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching rejected requests:", error);
    return [];
  }
}

export async function updateRequestStatus(registrationId: string, status: "APPROVED" | "REJECTED" | "PENDING") {
  try {
    const registration = await db.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: { tournament: true }
    });

    if (!registration) {
      return { success: false, message: "Registro no encontrado" };
    }

    if (registration.status === status) {
      return { success: false, message: "Esta solicitud ya tiene este estado" };
    }

    await db.tournamentRegistration.update({
      where: { id: registrationId },
      data: { status }
    });

    if (status === "APPROVED") {
      await db.tournament.update({
        where: { id: registration.tournamentId },
        data: { currentPlayers: { increment: 1 } }
      });
    }

    revalidatePath("/admin/requests");
    revalidatePath(`/torneos/${registration.tournamentId}`);

    let msg = "Solicitud actualizada";
    if (status === "APPROVED") msg = "Solicitud aprobada";
    if (status === "REJECTED") msg = "Solicitud rechazada";
    if (status === "PENDING") msg = "Moviendo a pendientes";

    return { success: true, message: msg };
  } catch (error) {
    console.error("Error updating request:", error);
    return { success: false, message: "Error al actualizar la solicitud" };
  }
}

export async function deleteRegistration(registrationId: string) {
  try {
    const registration = await db.tournamentRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return { success: false, message: "Registro no encontrado" };
    }

    await db.tournamentRegistration.delete({
      where: { id: registrationId }
    });

    revalidatePath("/admin/requests");
    revalidatePath(`/torneos/${registration.tournamentId}`);
    return { success: true, message: "Inscripción eliminada correctamente" };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return { success: false, message: "Error al eliminar la inscripción" };
  }
}
