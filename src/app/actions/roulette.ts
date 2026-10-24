"use server";

import { db } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

let fallbackPrisma: PrismaClient | null = null;
function getPrisma() {
  if (db && (db as any).gameRoulette) {
    return db;
  }
  if (!fallbackPrisma) {
    fallbackPrisma = new PrismaClient();
  }
  return fallbackPrisma;
}

export interface RouletteItem {
  id: string;
  title: string;
  description: string | null;
  spinDuration: number;
  gameIds: string;
  createdAt: Date;
  updatedAt: Date;
  games?: any[];
  gameCount?: number;
}

export async function getRoulettes() {
  try {
    const prisma = getPrisma();
    const roulettes = await prisma.gameRoulette.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Populate game counts and preview images for each roulette
    const allGames = await getPrisma().game.findMany({
      select: { id: true, name: true, categoryId: true, images: true },
    });

    const gamesMap = new Map(allGames.map((g) => [g.id, g]));

    const enriched = roulettes.map((r) => {
      let ids: string[] = [];
      try {
        ids = JSON.parse(r.gameIds || "[]");
      } catch {
        ids = [];
      }
      const games = ids
        .map((id) => gamesMap.get(id))
        .filter((g): g is NonNullable<typeof g> => g !== undefined);
      return {
        ...r,
        games,
        gameCount: games.length,
      };
    });

    return { success: true, roulettes: enriched };
  } catch (error) {
    console.error("Error fetching roulettes:", error);
    return { success: false, roulettes: [], error: "Error al cargar las ruletas" };
  }
}

export async function getRouletteById(id: string) {
  if (!id) {
    return { success: false, error: "ID no proporcionado" };
  }
  try {
    const roulette = await getPrisma().gameRoulette.findUnique({
      where: { id },
    });

    if (!roulette) {
      return { success: false, error: "Ruleta no encontrada" };
    }

    let ids: string[] = [];
    try {
      ids = JSON.parse(roulette.gameIds || "[]");
    } catch {
      ids = [];
    }

    const gamesFound = await getPrisma().game.findMany({
      where: { id: { in: ids } },
    });

    // Keep the custom selection order
    const gamesOrdered = ids
      .map((gameId) => gamesFound.find((g) => g.id === gameId))
      .filter((g): g is NonNullable<typeof g> => g !== undefined);

    return {
      success: true,
      roulette,
      games: gamesOrdered,
    };
  } catch (error) {
    console.error(`Error fetching roulette ${id}:`, error);
    return { success: false, error: "Error al cargar la ruleta" };
  }
}

export async function createRoulette(data: {
  title: string;
  description?: string;
  spinDuration: number;
  gameIds: string[];
}) {
  try {
    if (!data.title || data.title.trim().length === 0) {
      return { success: false, message: "El título es obligatorio" };
    }

    if (!data.gameIds || data.gameIds.length < 2) {
      return { success: false, message: "Debes seleccionar al menos 2 juegos para la ruleta" };
    }

    const duration = Math.max(3, Math.min(30, Number(data.spinDuration) || 8));

    const created = await getPrisma().gameRoulette.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        spinDuration: duration,
        gameIds: JSON.stringify(data.gameIds),
      },
    });

    revalidatePath("/admin/roulette");
    return { success: true, id: created.id, message: "Ruleta creada exitosamente" };
  } catch (error) {
    console.error("Error creating roulette:", error);
    return { success: false, message: "Error al crear la ruleta" };
  }
}

export async function updateRoulette(
  id: string,
  data: {
    title: string;
    description?: string;
    spinDuration: number;
    gameIds: string[];
  }
) {
  try {
    if (!id) {
      return { success: false, message: "ID no válido" };
    }

    if (!data.title || data.title.trim().length === 0) {
      return { success: false, message: "El título es obligatorio" };
    }

    if (!data.gameIds || data.gameIds.length < 2) {
      return { success: false, message: "Debes seleccionar al menos 2 juegos para la ruleta" };
    }

    const duration = Math.max(3, Math.min(30, Number(data.spinDuration) || 8));

    await getPrisma().gameRoulette.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        spinDuration: duration,
        gameIds: JSON.stringify(data.gameIds),
      },
    });

    revalidatePath("/admin/roulette");
    revalidatePath(`/admin/roulette/${id}`);
    return { success: true, message: "Ruleta actualizada exitosamente" };
  } catch (error) {
    console.error(`Error updating roulette ${id}:`, error);
    return { success: false, message: "Error al actualizar la ruleta" };
  }
}

export async function deleteRoulette(id: string) {
  try {
    if (!id) return { success: false, message: "ID no válido" };

    await getPrisma().gameRoulette.delete({
      where: { id },
    });

    revalidatePath("/admin/roulette");
    return { success: true, message: "Ruleta eliminada correctamente" };
  } catch (error) {
    console.error(`Error deleting roulette ${id}:`, error);
    return { success: false, message: "Error al eliminar la ruleta" };
  }
}
