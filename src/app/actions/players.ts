
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
  } catch (error) {
    console.error("Error toggling player status:", error);
  }
}

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const PlayerSchema = z.object({
  alias: z.string().min(2, "El alias es requerido"),
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  phone: z.string().optional(),
  chimucoins: z.coerce.number().min(0, "No puede ser negativo"),
  active: z.boolean().optional(),
  image: z.string().optional().or(z.literal("")),
});

export async function updatePlayer(id: string, prevState: any, formData: FormData) {
  const validatedFields = PlayerSchema.safeParse({
    alias: formData.get("alias"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined, // undefined to ignore if empty
    phone: formData.get("phone"),
    chimucoins: formData.get("chimucoins"),
    active: formData.get("active") === "on",
    image: formData.get("image"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { alias, name, email, password, phone, chimucoins, active, image } = validatedFields.data;

  try {
    // Check for unique email/alias (excluding current player)
    const existingEmail = await db.player.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });
    if (existingEmail) {
      return { message: "El email ya está en uso por otro jugador." };
    }

    const existingAlias = await db.player.findFirst({
      where: {
        alias,
        NOT: { id }
      }
    });
    if (existingAlias) {
      return { message: "El alias ya está en uso por otro jugador." };
    }

    const data: any = {
      alias,
      name,
      email,
      phone,
      chimucoins,
      active,
      image: image || null,
    };

    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 10);
    }

    await db.player.update({
      where: { id },
      data,
    });

    // Update stats if provided
    const matchesPlayed = parseInt(formData.get("matchesPlayed") as string || "0");
    const winsFirst = parseInt(formData.get("winsFirst") as string || "0");
    const winsSecond = parseInt(formData.get("winsSecond") as string || "0");
    const winsThird = parseInt(formData.get("winsThird") as string || "0");
    const wins = winsFirst + winsSecond + winsThird;
    const winRate = matchesPlayed > 0 ? wins / matchesPlayed : 0;

    await db.playerStats.upsert({
      where: { playerId: id },
      create: { playerId: id, matchesPlayed, winsFirst, winsSecond, winsThird, wins, winRate },
      update: { matchesPlayed, winsFirst, winsSecond, winsThird, wins, winRate },
    });

  } catch (error) {
    console.error("Error updating player:", error);
    return {
      message: "Error de base de datos al actualizar jugador.",
    };
  }

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function getPlayersForExport() {
  try {
    const players = await db.player.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stats: true,
        registrations: true,
      }
    });
    return players;
  } catch (error) {
    console.error("Error fetching players for export:", error);
    return [];
  }
}

export async function importPlayers(prevState: any, formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, message: "No se seleccionó ningún archivo." };
  }

  try {
    const text = await file.text();
    const playersData = JSON.parse(text);

    if (!Array.isArray(playersData)) {
      return { success: false, message: "El archivo JSON no contiene un arreglo de jugadores válido." };
    }

    let stats = { created: 0, updated: 0, failed: 0 };
    const passwordHash = await bcrypt.hash("123456", 10); // Default password for new imports

    for (const p of playersData) {
      if (!p.email) {
        stats.failed++;
        continue;
      }

      try {
        await db.player.upsert({
          where: { email: p.email },
          update: {
            alias: p.alias || null,
            name: p.name || null,
            phone: p.phone || null,
            chimucoins: p.chimucoins ?? 0,
            active: p.active ?? true,
            image: p.image || null,
            createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            stats: p.stats ? {
              upsert: {
                create: {
                  matchesPlayed: p.stats.matchesPlayed ?? 0,
                  wins: p.stats.wins ?? 0,
                  winRate: p.stats.winRate ?? 0,
                },
                update: {
                  matchesPlayed: p.stats.matchesPlayed ?? 0,
                  wins: p.stats.wins ?? 0,
                  winRate: p.stats.winRate ?? 0,
                }
              }
            } : undefined
          },
          create: {
            id: p.id || undefined,
            email: p.email,
            alias: p.alias || p.email.split("@")[0],
            name: p.name || null,
            phone: p.phone || null,
            chimucoins: p.chimucoins ?? 0,
            password: p.password || passwordHash,
            active: p.active ?? true,
            image: p.image || null,
            createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            stats: p.stats ? {
              create: {
                matchesPlayed: p.stats.matchesPlayed ?? 0,
                wins: p.stats.wins ?? 0,
                winRate: p.stats.winRate ?? 0,
              }
            } : {
              create: {
                matchesPlayed: 0, wins: 0, winRate: 0
              }
            }
          }
        });

        stats.updated++;
      } catch (err) {
        console.error(`Error importing player row ${p.email}:`, err);
        stats.failed++;
      }
    }

    revalidatePath("/admin/players");
    return {
      success: true,
      message: `Importación JSON finalizada. Procesados: ${stats.updated}. Fallidos: ${stats.failed}.`,
      detailedStats: stats
    };

  } catch (error) {
    console.error("Import error:", error);
    return { success: false, message: "Error al procesar el archivo o parsear JSON." };
  }
}
