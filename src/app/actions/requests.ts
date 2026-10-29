"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getApprovalMenuState() {
  try {
    const [
      activeRestrictedTournament,
      activeRestrictedChallenge,
      pendingTournamentRequests,
      pendingChallengeRequests,
      pendingPlayerRequests
    ] = await Promise.all([
      db.tournament.findFirst({
        where: {
          isRestricted: true,
          active: true,
          status: { notIn: ["FINALIZADO", "CANCELADO"] },
        },
        select: { id: true },
      }),
      db.challenge.findFirst({
        where: {
          isRestricted: true,
          active: true,
          status: { notIn: ["FINALIZADO", "CANCELADO"] },
        },
        select: { id: true },
      }),
      db.tournamentRegistration.count({
        where: {
          status: "PENDING",
          tournament: {
            active: true,
            status: { notIn: ["FINALIZADO", "CANCELADO"] },
          },
        },
      }),
      db.challengeRegistration.count({
        where: {
          status: "PENDING",
          challenge: {
            active: true,
            status: { notIn: ["FINALIZADO", "CANCELADO"] },
          },
        },
      }),
      db.player.count({
        where: {
          registrationStatus: "PENDING",
        },
      }),
    ]);

    const totalPending = pendingTournamentRequests + pendingChallengeRequests + pendingPlayerRequests;
    const isVisible = Boolean(activeRestrictedTournament) || Boolean(activeRestrictedChallenge) || totalPending > 0;

    return {
      visible: isVisible,
      pendingCount: totalPending,
    };
  } catch (error) {
    console.error("Error getting approval menu state:", error);
    return { visible: false, pendingCount: 0 };
  }
}

export async function getPendingRequests() {
  try {
    const [tournamentRequests, challengeRequests] = await Promise.all([
      db.tournamentRegistration.findMany({
        where: {
          status: "PENDING",
          tournament: {
            active: true,
            status: { notIn: ["FINALIZADO", "CANCELADO"] },
          },
        },
        include: {
          player: {
            select: { id: true, alias: true, name: true, image: true, email: true },
          },
          tournament: {
            select: { id: true, name: true, date: true, isRestricted: true },
          },
        },
        orderBy: { registeredAt: "asc" },
      }),
      db.challengeRegistration.findMany({
        where: {
          status: "PENDING",
          challenge: {
            active: true,
            status: { notIn: ["FINALIZADO", "CANCELADO"] },
          },
        },
        include: {
          player: {
            select: { id: true, alias: true, name: true, image: true, email: true },
          },
          challenge: {
            select: { id: true, name: true, date: true, isRestricted: true },
          },
        },
        orderBy: { registeredAt: "asc" },
      }),
    ]);

    const mappedChallenges = challengeRequests.map((c: any) => ({
      ...c,
      tournament: {
        id: c.challenge.id,
        name: `[Desafío] ${c.challenge.name}`,
        date: c.challenge.date,
        isRestricted: c.challenge.isRestricted,
      },
    }));

    return [...tournamentRequests, ...mappedChallenges].sort(
      (a: any, b: any) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
    );
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
}

export async function getRejectedRequests() {
  try {
    const [tournamentRequests, challengeRequests] = await Promise.all([
      db.tournamentRegistration.findMany({
        where: {
          status: "REJECTED",
          tournament: {
            active: true,
            status: { notIn: ["FINALIZADO", "CANCELADO"] },
          },
        },
        include: {
          player: {
            select: { id: true, alias: true, name: true, image: true, email: true },
          },
          tournament: {
            select: { id: true, name: true, date: true, isRestricted: true },
          },
        },
        orderBy: { registeredAt: "desc" },
      }),
      db.challengeRegistration.findMany({
        where: {
          status: "REJECTED",
          challenge: {
            active: true,
            status: { notIn: ["FINALIZADO", "CANCELADO"] },
          },
        },
        include: {
          player: {
            select: { id: true, alias: true, name: true, image: true, email: true },
          },
          challenge: {
            select: { id: true, name: true, date: true, isRestricted: true },
          },
        },
        orderBy: { registeredAt: "desc" },
      }),
    ]);

    const mappedChallenges = challengeRequests.map((c: any) => ({
      ...c,
      tournament: {
        id: c.challenge.id,
        name: `[Desafío] ${c.challenge.name}`,
        date: c.challenge.date,
        isRestricted: c.challenge.isRestricted,
      },
    }));

    return [...tournamentRequests, ...mappedChallenges].sort(
      (a: any, b: any) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
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

    if (registration) {
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
      } else if (registration.status === "APPROVED" && (status === "REJECTED" || status === "PENDING")) {
        await db.tournament.update({
          where: { id: registration.tournamentId },
          data: { currentPlayers: { decrement: 1 } }
        });
      }

      revalidatePath(`/torneos/${registration.tournamentId}`);
    } else {
      // Check ChallengeRegistration
      const challengeReg = await db.challengeRegistration.findUnique({
        where: { id: registrationId },
        include: { challenge: true }
      });

      if (!challengeReg) {
        return { success: false, message: "Registro no encontrado" };
      }

      if (challengeReg.status === status) {
        return { success: false, message: "Esta solicitud ya tiene este estado" };
      }

      await db.challengeRegistration.update({
        where: { id: registrationId },
        data: { status }
      });

      revalidatePath("/admin/challenges");
      revalidatePath(`/admin/challenges/${challengeReg.challengeId}/live`);
      revalidatePath(`/desafios/${challengeReg.challengeId}`);
    }

    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");

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

    if (registration) {
      await db.tournamentRegistration.delete({
        where: { id: registrationId }
      });

      if (registration.status === "APPROVED") {
        await db.tournament.update({
          where: { id: registration.tournamentId },
          data: { currentPlayers: { decrement: 1 } }
        }).catch(() => {});
      }

      revalidatePath("/admin/requests");
      revalidatePath("/admin", "layout");
      revalidatePath(`/torneos/${registration.tournamentId}`);
      return { success: true, message: "Inscripción eliminada correctamente" };
    }

    const challengeReg = await db.challengeRegistration.findUnique({
      where: { id: registrationId },
    });

    if (challengeReg) {
      await db.challengeRegistration.delete({
        where: { id: registrationId }
      });

      revalidatePath("/admin/requests");
      revalidatePath("/admin", "layout");
      revalidatePath(`/admin/challenges/${challengeReg.challengeId}/live`);
      revalidatePath(`/desafios/${challengeReg.challengeId}`);
      return { success: true, message: "Inscripción eliminada correctamente" };
    }

    return { success: false, message: "Registro no encontrado" };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return { success: false, message: "Error al eliminar la inscripción" };
  }
}

export async function getPlayerRequests() {
  try {
    return await db.player.findMany({
      where: {
        registrationStatus: {
          in: ["PENDING", "REJECTED"], // optionally just fetch PENDING and we show rejected there too, or combined
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching player requests:", error);
    return [];
  }
}

export async function updatePlayerRequestStatus(playerId: string, status: "APPROVED" | "REJECTED" | "PENDING") {
  try {
    await db.player.update({
      where: { id: playerId },
      data: {
        registrationStatus: status,
        active: status === "APPROVED"
      }
    });

    revalidatePath("/admin/requests");

    let msg = "Solicitud actualizada";
    if (status === "APPROVED") msg = "Jugador aprobado exitosamente";
    if (status === "REJECTED") msg = "Jugador rechazado";
    if (status === "PENDING") msg = "Movido a revisión (Pendiente)";

    return { success: true, message: msg };
  } catch (error) {
    console.error("Error updating player request:", error);
    return { success: false, message: "Error al actualizar la solicitud del jugador" };
  }
}

export async function deletePlayerRequest(playerId: string) {
  try {
    await db.player.delete({
      where: { id: playerId }
    });
    revalidatePath("/admin/requests");
    return { success: true, message: "Solicitud eliminada. El usuario puede volver a registrarse." };
  } catch (error) {
    console.error("Error deleting player request:", error);
    return { success: false, message: "Error al eliminar el registro del jugador" };
  }
}
