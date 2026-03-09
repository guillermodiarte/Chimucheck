"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGames() {
  try {
    const games = await db.game.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { tournaments: true }
        }
      }
    });
    return { success: true, games };
  } catch (error) {
    console.error("Error fetching games:", error);
    return { success: false, error: "Error al cargar los juegos" };
  }
}

export async function getGameById(id: string) {
  try {
    const game = await db.game.findUnique({
      where: { id },
    });
    return { success: true, game };
  } catch (error) {
    console.error(`Error fetching game with id ${id}:`, error);
    return { success: false, error: "Error al cargar el juego" };
  }
}

export async function createGame(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const images = formData.get("images") as string; // Expecting JSON array string

    if (!name || !categoryId) {
      return { success: false, message: "Nombre y categoría son requeridos" };
    }

    const existing = await db.game.findUnique({
      where: { name }
    });

    if (existing) {
      return { success: false, message: "Ya existe un juego con ese nombre" };
    }

    const game = await db.game.create({
      data: {
        name,
        categoryId,
        images: images || "[]",
      },
    });

    revalidatePath("/admin/games");
    return { success: true, message: "Juego creado exitosamente", game };
  } catch (error) {
    console.error("Error creating game:", error);
    return { success: false, message: "Error al crear el juego" };
  }
}

export async function updateGame(id: string, prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const images = formData.get("images") as string;

    if (!name || !categoryId) {
      return { success: false, message: "Nombre y categoría son requeridos" };
    }

    // Check name collision
    const existing = await db.game.findUnique({
      where: { name }
    });

    if (existing && existing.id !== id) {
      return { success: false, message: "Ya existe un juego con ese nombre" };
    }

    const game = await db.game.update({
      where: { id },
      data: {
        name,
        categoryId,
        images: images || "[]",
      },
    });

    revalidatePath("/admin/games");
    return { success: true, message: "Juego actualizado exitosamente", game };
  } catch (error) {
    console.error(`Error updating game ${id}:`, error);
    return { success: false, message: "Error al actualizar el juego" };
  }
}

export async function deleteGame(id: string) {
  try {
    await db.game.delete({
      where: { id },
    });
    revalidatePath("/admin/games");
    return { success: true, message: "Juego eliminado exitosamente" };
  } catch (error) {
    console.error(`Error deleting game ${id}:`, error);
    return { success: false, message: "Error al eliminar el juego. Verifica que no esté asociado a torneos." };
  }
}
