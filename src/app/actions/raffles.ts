"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { randomInt } from "crypto";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) {
    throw new Error("No autorizado como administrador");
  }
}

export type RafflePrizeInput = {
  id?: string;
  title: string;
  description?: string;
  image?: string;
  order: number;
};

export type RaffleFormData = {
  title: string;
  description?: string;
  prize: string;
  prizeImage?: string;
  images?: string[];
  type?: "OPEN" | "MANUAL";
  status?: "DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED";
  maxEntries?: number | null;
  requiresLogin?: boolean;
  drawDate?: Date | string | null;
  prizes?: RafflePrizeInput[];
};

// 1. Create Raffle
export async function createRaffle(data: RaffleFormData) {
  try {
    await verifyAdmin();

    if (!data.title?.trim()) {
      return { success: false, message: "El título es obligatorio" };
    }

    const imagesList = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : data.prizeImage
      ? [data.prizeImage]
      : [];

    const primaryImage = data.prizeImage?.trim() || imagesList[0] || null;

    // Process Prizes
    const prizesList: RafflePrizeInput[] = Array.isArray(data.prizes) && data.prizes.length > 0
      ? data.prizes
          .filter((p) => p.title && p.title.trim().length > 0)
          .map((p, idx) => ({
            title: p.title.trim(),
            description: p.description?.trim() || null as any,
            image: p.image?.trim() || null as any,
            order: Number(p.order) || idx + 1,
          }))
          .sort((a, b) => a.order - b.order)
      : [
          {
            title: data.prize?.trim() || "Premio Principal",
            description: null as any,
            image: primaryImage,
            order: 1,
          },
        ];

    if (prizesList.length === 0) {
      return { success: false, message: "Debes configurar al menos un premio" };
    }

    // Main prize title (summary)
    const mainPrizeTitle = data.prize?.trim() || prizesList[0].title;

    const raffle = await db.raffle.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        prize: mainPrizeTitle,
        prizeImage: primaryImage || prizesList[0].image || null,
        images: JSON.stringify(imagesList),
        type: data.type || "OPEN",
        status: data.status || "DRAFT",
        maxEntries: data.maxEntries ? Number(data.maxEntries) : null,
        requiresLogin: data.requiresLogin !== undefined ? Boolean(data.requiresLogin) : true,
        drawDate: data.drawDate ? new Date(data.drawDate) : null,
        prizes: {
          create: prizesList.map((p) => ({
            title: p.title,
            description: p.description || null,
            image: p.image || null,
            order: p.order,
          })),
        },
      },
      include: {
        prizes: {
          orderBy: { order: "asc" },
        },
      },
    });

    revalidatePath("/admin/raffles");
    revalidatePath("/player/dashboard/raffles");
    revalidatePath("/sorteos");
    return { success: true, raffle };
  } catch (error: any) {
    console.error("Error creating raffle:", error);
    return { success: false, message: error.message || "Error al crear el sorteo" };
  }
}

// 2. Update Raffle
export async function updateRaffle(id: string, data: Partial<RaffleFormData>) {
  try {
    await verifyAdmin();

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.prize !== undefined) updateData.prize = data.prize.trim();
    if (data.prizeImage !== undefined) updateData.prizeImage = data.prizeImage?.trim() || null;
    if (data.images !== undefined) {
      const imagesList = Array.isArray(data.images) ? data.images : [];
      updateData.images = JSON.stringify(imagesList);
      if (!data.prizeImage && imagesList.length > 0) {
        updateData.prizeImage = imagesList[0];
      }
    }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.maxEntries !== undefined) {
      updateData.maxEntries = data.maxEntries ? Number(data.maxEntries) : null;
    }
    if (data.requiresLogin !== undefined) updateData.requiresLogin = Boolean(data.requiresLogin);
    if (data.drawDate !== undefined) {
      updateData.drawDate = data.drawDate ? new Date(data.drawDate) : null;
    }
    if (data.prizes !== undefined && Array.isArray(data.prizes)) {
      const validPrizes = data.prizes
        .filter((p) => p.title && p.title.trim().length > 0)
        .map((p, idx) => ({
          title: p.title.trim(),
          description: p.description?.trim() || null,
          image: p.image?.trim() || null,
          order: Number(p.order) || idx + 1,
        }))
        .sort((a, b) => a.order - b.order);

      if (validPrizes.length > 0) {
        // Fetch existing prizes to preserve drawn winners
        const existingPrizes = await db.rafflePrize.findMany({ where: { raffleId: id } });
        await db.rafflePrize.deleteMany({ where: { raffleId: id } });
        await db.rafflePrize.createMany({
          data: validPrizes.map((p) => {
            const match = existingPrizes.find((ep) => ep.order === p.order);
            return {
              raffleId: id,
              title: p.title,
              description: p.description,
              image: p.image,
              order: p.order,
              winnerId: match?.winnerId || null,
              winnerAlias: match?.winnerAlias || null,
              winnerImage: match?.winnerImage || null,
              drawnAt: match?.drawnAt || null,
            };
          }),
        });
        if (data.prize === undefined) {
          updateData.prize = validPrizes[0].title;
        }
      }
    }

    const raffle = await db.raffle.update({
      where: { id },
      data: updateData,
      include: {
        prizes: {
          orderBy: { order: "asc" },
        },
      },
    });

    revalidatePath("/admin/raffles");
    revalidatePath(`/admin/raffles/${id}`);
    revalidatePath(`/admin/raffles/${id}/live`);
    revalidatePath("/player/dashboard/raffles");
    revalidatePath(`/player/dashboard/raffles/${id}`);
    revalidatePath("/sorteos");
    revalidatePath(`/sorteos/${id}`);
    return { success: true, raffle };
  } catch (error: any) {
    console.error("Error updating raffle:", error);
    return { success: false, message: error.message || "Error al actualizar el sorteo" };
  }
}

// 3. Delete Raffle
export async function deleteRaffle(id: string) {
  try {
    await verifyAdmin();

    await db.raffle.delete({
      where: { id },
    });

    revalidatePath("/admin/raffles");
    revalidatePath("/player/dashboard/raffles");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting raffle:", error);
    return { success: false, message: error.message || "Error al eliminar el sorteo" };
  }
}

// 4. Add Players manually (MANUAL mode or Admin assignment)
export async function addPlayersToRaffle(raffleId: string, playerIds: string[]) {
  try {
    await verifyAdmin();

    if (!playerIds || playerIds.length === 0) {
      return { success: false, message: "No se seleccionaron jugadores" };
    }

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
      include: { entries: true },
    });

    if (!raffle) {
      return { success: false, message: "Sorteo no encontrado" };
    }

    // Check limit
    if (raffle.maxEntries) {
      const remainingSlots = raffle.maxEntries - raffle.entries.length;
      if (playerIds.length > remainingSlots) {
        return {
          success: false,
          message: `El sorteo solo tiene cupo para ${remainingSlots} participante(s) más.`,
        };
      }
    }

    const existingPlayerIds = new Set(raffle.entries.map((e) => e.playerId));
    const toInsert = playerIds.filter((pid) => !existingPlayerIds.has(pid));

    if (toInsert.length === 0) {
      return { success: true, count: 0, message: "Todos los jugadores ya estaban inscriptos" };
    }

    await db.$transaction(
      toInsert.map((playerId) =>
        db.raffleEntry.create({
          data: {
            raffleId,
            playerId,
          },
        })
      )
    );

    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/admin/raffles");
    revalidatePath("/player/dashboard/raffles");

    return {
      success: true,
      count: toInsert.length,
      message: `Se agregaron ${toInsert.length} jugadores exitosamente.`,
    };
  } catch (error: any) {
    console.error("Error adding players to raffle:", error);
    return { success: false, message: error.message || "Error al agregar jugadores" };
  }
}

// 5. Add all approved players
export async function addAllApprovedPlayers(raffleId: string) {
  try {
    await verifyAdmin();

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
      include: { entries: true },
    });

    if (!raffle) {
      return { success: false, message: "Sorteo no encontrado" };
    }

    const approvedPlayers = await db.player.findMany({
      where: {
        registrationStatus: "APPROVED",
        active: true,
      },
      select: { id: true },
    });

    const existingPlayerIds = new Set(raffle.entries.map((e) => e.playerId));
    let toInsert = approvedPlayers
      .map((p) => p.id)
      .filter((pid) => !existingPlayerIds.has(pid));

    if (toInsert.length === 0) {
      return { success: true, count: 0, message: "Todos los jugadores aprobados ya están inscriptos" };
    }

    if (raffle.maxEntries) {
      const remainingSlots = raffle.maxEntries - raffle.entries.length;
      if (remainingSlots <= 0) {
        return { success: false, message: "El cupo del sorteo ya está completo" };
      }
      toInsert = toInsert.slice(0, remainingSlots);
    }

    await db.$transaction(
      toInsert.map((playerId) =>
        db.raffleEntry.create({
          data: {
            raffleId,
            playerId,
          },
        })
      )
    );

    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/admin/raffles");
    revalidatePath("/player/dashboard/raffles");

    return {
      success: true,
      count: toInsert.length,
      message: `Se agregaron ${toInsert.length} jugadores aprobados al sorteo.`,
    };
  } catch (error: any) {
    console.error("Error adding all approved players:", error);
    return { success: false, message: error.message || "Error al agregar jugadores" };
  }
}

// 6. Remove player from raffle
export async function removePlayerFromRaffle(raffleId: string, playerId: string) {
  try {
    await verifyAdmin();

    await db.raffleEntry.deleteMany({
      where: {
        raffleId,
        playerId,
      },
    });

    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/admin/raffles");
    revalidatePath("/player/dashboard/raffles");

    return { success: true };
  } catch (error: any) {
    console.error("Error removing player from raffle:", error);
    return { success: false, message: error.message || "Error al quitar jugador" };
  }
}

// 7. Player Enters Raffle (Player Action)
export async function enterRaffle(raffleId: string) {
  try {
    const session = await auth();
    const playerId = session?.user?.id;

    if (!playerId) {
      return { success: false, message: "Debes iniciar sesión para inscribirte" };
    }

    const player = await db.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return { success: false, message: "Jugador no encontrado" };
    }

    if (player.registrationStatus !== "APPROVED") {
      return { success: false, message: "Tu cuenta debe estar aprobada para participar" };
    }

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!raffle) {
      return { success: false, message: "Sorteo no encontrado" };
    }

    if (raffle.status !== "ACTIVE") {
      return { success: false, message: "Este sorteo no está activo para inscripciones" };
    }

    if (raffle.type !== "OPEN") {
      return {
        success: false,
        message: "Este sorteo es exclusivo por selección manual del organizador",
      };
    }

    if (raffle.maxEntries && raffle._count.entries >= raffle.maxEntries) {
      return { success: false, message: "El sorteo ha alcanzado el límite de participantes" };
    }

    // Check if already registered
    const existing = await db.raffleEntry.findUnique({
      where: {
        raffleId_playerId: {
          raffleId,
          playerId,
        },
      },
    });

    if (existing) {
      return { success: false, message: "Ya estás inscripto en este sorteo" };
    }

    await db.raffleEntry.create({
      data: {
        raffleId,
        playerId,
      },
    });

    revalidatePath("/player/dashboard/raffles");
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);

    return { success: true, message: "¡Inscripción exitosa! ¡Mucha suerte!" };
  } catch (error: any) {
    console.error("Error entering raffle:", error);
    return { success: false, message: error.message || "Error al inscribirse en el sorteo" };
  }
}

// 8. Player Leaves Raffle
export async function leaveRaffle(raffleId: string) {
  try {
    const session = await auth();
    const playerId = session?.user?.id;

    if (!playerId) {
      return { success: false, message: "No autenticado" };
    }

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
    });

    if (!raffle) {
      return { success: false, message: "Sorteo no encontrado" };
    }

    if (raffle.status === "DRAWING" || raffle.status === "FINISHED") {
      return { success: false, message: "No puedes retirarte de un sorteo en curso o finalizado" };
    }

    await db.raffleEntry.deleteMany({
      where: {
        raffleId,
        playerId,
      },
    });

    revalidatePath("/player/dashboard/raffles");
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);

    return { success: true, message: "Te has retirado del sorteo" };
  } catch (error: any) {
    console.error("Error leaving raffle:", error);
    return { success: false, message: error.message || "Error al retirarse del sorteo" };
  }
}

// 9. Draw Winner (Cryptographically Secure via Node crypto.randomInt)
export async function drawWinner(raffleId: string) {
  try {
    await verifyAdmin();

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
      include: {
        entries: {
          include: {
            player: {
              select: {
                id: true,
                alias: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!raffle) {
      return { success: false, message: "Sorteo no encontrado" };
    }

    if (raffle.entries.length === 0) {
      return { success: false, message: "No hay participantes en este sorteo para elegir un ganador" };
    }

    // Cryptographically secure random selection: randomInt(0, length)
    const winningIndex = randomInt(0, raffle.entries.length);
    const winningEntry = raffle.entries[winningIndex];
    const winnerPlayer = winningEntry.player;

    const winnerAlias = winnerPlayer.alias || winnerPlayer.name || "Jugador";
    const winnerImage = winnerPlayer.image || null;

    // Update raffle
    const updatedRaffle = await db.raffle.update({
      where: { id: raffleId },
      data: {
        winnerId: winnerPlayer.id,
        winnerAlias: winnerAlias,
        winnerImage: winnerImage,
        status: "FINISHED",
      },
    });

    // Create notification for the winner in DB
    try {
      await db.notification.create({
        data: {
          type: "RAFFLE_WINNER",
          title: "🎉 ¡Felicidades! Eres el ganador del sorteo",
          message: `¡Ganaste el premio "${raffle.prize}" en el sorteo "${raffle.title}"!`,
          data: JSON.stringify({
            raffleId: raffle.id,
            raffleTitle: raffle.title,
            prize: raffle.prize,
            playerId: winnerPlayer.id,
            alias: winnerAlias,
          }),
        },
      });
    } catch (notifErr) {
      console.error("Error creating winner notification:", notifErr);
    }

    revalidatePath("/admin/raffles");
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/player/dashboard/raffles");

    return {
      success: true,
      winner: {
        id: winnerPlayer.id,
        alias: winnerAlias,
        name: winnerPlayer.name,
        image: winnerImage,
        email: winnerPlayer.email,
        winningIndex,
      },
      raffle: updatedRaffle,
    };
  } catch (error: any) {
    console.error("Error drawing winner:", error);
    return { success: false, message: error.message || "Error al realizar el sorteo" };
  }
}

// 9b. Draw Specific Prize Winner (supports reverse order draw: last to first)
export async function drawPrizeWinner(
  raffleId: string,
  prizeId: string,
  excludedPlayerIds: string[] = []
) {
  try {
    await verifyAdmin();

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
      include: {
        entries: {
          include: {
            player: {
              select: {
                id: true,
                alias: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
        prizes: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!raffle) {
      return { success: false, message: "Sorteo no encontrado" };
    }

    const prize = raffle.prizes.find((p) => p.id === prizeId);
    if (!prize) {
      return { success: false, message: "Premio no encontrado en este sorteo" };
    }

    // Exclude players who already won another prize in this raffle
    const alreadyWonIds = new Set([
      ...excludedPlayerIds,
      ...raffle.prizes.filter((p) => p.id !== prizeId && p.winnerId).map((p) => p.winnerId!),
    ]);

    const eligibleEntries = raffle.entries.filter((e) => !alreadyWonIds.has(e.playerId));

    if (eligibleEntries.length === 0) {
      return {
        success: false,
        message: "No hay participantes elegibles restantes para este premio.",
      };
    }

    // Cryptographically secure random pick
    const winningIndex = randomInt(0, eligibleEntries.length);
    const winningEntry = eligibleEntries[winningIndex];
    const winnerPlayer = winningEntry.player;

    const winnerAlias = winnerPlayer.alias || winnerPlayer.name || "Jugador";
    const winnerImage = winnerPlayer.image || null;

    // Update RafflePrize record
    const updatedPrize = await db.rafflePrize.update({
      where: { id: prizeId },
      data: {
        winnerId: winnerPlayer.id,
        winnerAlias,
        winnerImage,
        drawnAt: new Date(),
      },
    });

    // Check if this was the 1st prize (order === 1) or all prizes are now drawn
    const otherPrizes = raffle.prizes.filter((p) => p.id !== prizeId);
    const allOthersHaveWinners = otherPrizes.every((p) => !!p.winnerId);
    const isFirstPlace = prize.order === 1;

    let finalRaffleStatus = raffle.status;
    if (allOthersHaveWinners || isFirstPlace) {
      finalRaffleStatus = "FINISHED";
      // The 1st place winner is the overall champion snapshot
      const firstPlacePrize = isFirstPlace ? updatedPrize : otherPrizes.find((p) => p.order === 1);
      await db.raffle.update({
        where: { id: raffleId },
        data: {
          status: "FINISHED",
          winnerId: firstPlacePrize?.winnerId || winnerPlayer.id,
          winnerAlias: firstPlacePrize?.winnerAlias || winnerAlias,
          winnerImage: firstPlacePrize?.winnerImage || winnerImage,
        },
      });
    } else {
      finalRaffleStatus = "DRAWING";
      await db.raffle.update({
        where: { id: raffleId },
        data: { status: "DRAWING" },
      });
    }

    // Create winner notification
    try {
      await db.notification.create({
        data: {
          type: "RAFFLE_WINNER",
          title: `🎉 ¡Ganaste el ${prize.order}º Puesto en ${raffle.title}!`,
          message: `¡Felicitaciones! Has ganado "${prize.title}" en el sorteo "${raffle.title}".`,
          data: JSON.stringify({
            raffleId: raffle.id,
            raffleTitle: raffle.title,
            prizeTitle: prize.title,
            prizeOrder: prize.order,
            playerId: winnerPlayer.id,
            alias: winnerAlias,
          }),
        },
      });
    } catch {}

    revalidatePath("/admin/raffles");
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/player/dashboard/raffles");
    revalidatePath(`/player/dashboard/raffles/${raffleId}`);
    revalidatePath("/sorteos");
    revalidatePath(`/sorteos/${raffleId}`);

    return {
      success: true,
      prize: updatedPrize,
      raffleStatus: finalRaffleStatus,
      winner: {
        id: winnerPlayer.id,
        alias: winnerAlias,
        name: winnerPlayer.name,
        image: winnerImage,
        email: winnerPlayer.email,
        winningIndex,
      },
    };
  } catch (error: any) {
    console.error("Error drawing prize winner:", error);
    return { success: false, message: error.message || "Error al realizar el sorteo" };
  }
}

// 9c. Reset Raffle Draw
export async function resetRaffleDraw(raffleId: string) {
  try {
    await verifyAdmin();

    await db.rafflePrize.updateMany({
      where: { raffleId },
      data: {
        winnerId: null,
        winnerAlias: null,
        winnerImage: null,
        drawnAt: null,
      },
    });

    await db.raffle.update({
      where: { id: raffleId },
      data: {
        status: "ACTIVE",
        winnerId: null,
        winnerAlias: null,
        winnerImage: null,
      },
    });

    revalidatePath("/admin/raffles");
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/player/dashboard/raffles");
    revalidatePath(`/player/dashboard/raffles/${raffleId}`);
    revalidatePath("/sorteos");
    revalidatePath(`/sorteos/${raffleId}`);

    return { success: true, message: "Sorteo reiniciado exitosamente" };
  } catch (error: any) {
    console.error("Error resetting raffle draw:", error);
    return { success: false, message: error.message || "Error al reiniciar el sorteo" };
  }
}

// 10. Update Raffle Status
export async function updateRaffleStatus(id: string, status: "DRAFT" | "ACTIVE" | "DRAWING" | "FINISHED") {
  try {
    await verifyAdmin();

    const raffle = await db.raffle.update({
      where: { id },
      data: { status },
      include: {
        prizes: {
          orderBy: { order: "asc" },
        },
      },
    });

    revalidatePath("/admin/raffles");
    revalidatePath(`/admin/raffles/${id}`);
    revalidatePath(`/admin/raffles/${id}/live`);
    revalidatePath("/player/dashboard/raffles");

    return { success: true, raffle };
  } catch (error: any) {
    console.error("Error updating raffle status:", error);
    return { success: false, message: error.message || "Error al actualizar estado del sorteo" };
  }
}

// 11. Query Helpers
export async function getRaffles() {
  try {
    const raffles = await db.raffle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { entries: true },
        },
        prizes: {
          orderBy: { order: "asc" },
        },
      },
    });

    return raffles.map((r) => {
      const prizes = r.prizes && r.prizes.length > 0
        ? r.prizes
        : [
            {
              id: "legacy",
              raffleId: r.id,
              title: r.prize,
              description: null,
              image: r.prizeImage,
              order: 1,
              winnerId: r.winnerId,
              winnerAlias: r.winnerAlias,
              winnerImage: r.winnerImage,
              drawnAt: null,
            },
          ];
      return {
        ...r,
        prizes,
      };
    });
  } catch (error) {
    console.error("Error fetching raffles:", error);
    return [];
  }
}

export async function getRaffleWithParticipants(id: string) {
  try {
    const raffle = await db.raffle.findUnique({
      where: { id },
      include: {
        prizes: {
          orderBy: { order: "asc" },
        },
        entries: {
          orderBy: { enteredAt: "asc" },
          include: {
            player: {
              select: {
                id: true,
                alias: true,
                name: true,
                image: true,
                email: true,
                registrationStatus: true,
                active: true,
              },
            },
          },
        },
      },
    });

    if (!raffle) return null;

    const prizes = raffle.prizes && raffle.prizes.length > 0
      ? raffle.prizes
      : [
          {
            id: "legacy",
            raffleId: raffle.id,
            title: raffle.prize,
            description: null,
            image: raffle.prizeImage,
            order: 1,
            winnerId: raffle.winnerId,
            winnerAlias: raffle.winnerAlias,
            winnerImage: raffle.winnerImage,
            drawnAt: null,
          },
        ];

    return {
      ...raffle,
      prizes,
    };
  } catch (error) {
    console.error("Error fetching raffle with participants:", error);
    return null;
  }
}

export async function getPlayerRaffles(playerId?: string) {
  try {
    const raffles = await db.raffle.findMany({
      where: {
        status: { in: ["ACTIVE", "DRAWING", "FINISHED"] },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        _count: {
          select: { entries: true },
        },
        prizes: {
          orderBy: { order: "asc" },
        },
        entries: playerId
          ? {
              where: { playerId },
              select: { id: true, enteredAt: true },
            }
          : false,
      },
    });

    return raffles.map((r) => {
      const prizes = r.prizes && r.prizes.length > 0
        ? r.prizes
        : [
            {
              id: "legacy",
              raffleId: r.id,
              title: r.prize,
              description: null,
              image: r.prizeImage,
              order: 1,
              winnerId: r.winnerId,
              winnerAlias: r.winnerAlias,
              winnerImage: r.winnerImage,
              drawnAt: null,
            },
          ];

      return {
        ...r,
        prizes,
        isEntered: playerId ? (r.entries && r.entries.length > 0) : false,
        myEntryDate: playerId && r.entries?.[0]?.enteredAt ? r.entries[0].enteredAt : null,
      };
    });
  } catch (error) {
    console.error("Error fetching player raffles:", error);
    return [];
  }
}

export async function searchPlayersAvailableForRaffle(raffleId: string, query: string = "") {
  try {
    await verifyAdmin();

    const raffle = await db.raffle.findUnique({
      where: { id: raffleId },
      select: {
        entries: { select: { playerId: true } },
      },
    });

    const enrolledIds = raffle?.entries.map((e) => e.playerId) || [];

    const players = await db.player.findMany({
      where: {
        id: { notIn: enrolledIds },
        registrationStatus: "APPROVED",
        active: true,
        ...(query.trim()
          ? {
              OR: [
                { alias: { contains: query.trim() } },
                { name: { contains: query.trim() } },
                { email: { contains: query.trim() } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        alias: true,
        name: true,
        email: true,
        image: true,
      },
      take: 50,
      orderBy: { alias: "asc" },
    });

    return players;
  } catch (error) {
    console.error("Error searching players for raffle:", error);
    return [];
  }
}

