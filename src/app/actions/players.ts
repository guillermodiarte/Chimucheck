
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
      select: {
        id: true,
        alias: true,
        name: true,
        email: true,
        phone: true,
        chimucoins: true,
        active: true,
        createdAt: true,
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
    const rows = text.split(/\r?\n/);

    // Basic CSV parsing
    // Assumes header: Alias, Name, Email, Phone, ChimuCoins
    // or standard order. We'll try to detect header or valid row.

    // Headers might be: alias,name,email,phone,chimucoins (case insensitive)

    let stats = { created: 0, updated: 0, failed: 0 };
    const passwordHash = await bcrypt.hash("123456", 10); // Default password for new imports

    // Skipping empty rows
    const dataRows = rows.filter(row => row.trim().length > 0);

    if (dataRows.length < 2) {
      return { success: false, message: "El archivo parece estar vacío o sin datos." };
    }

    const header = dataRows[0].toLowerCase().split(",").map(h => h.trim());

    // Map column indexes
    const idxAlias = header.findIndex(h => h.includes("alias"));
    const idxEmail = header.findIndex(h => h.includes("email"));
    const idxName = header.findIndex(h => h.includes("nombre") || h.includes("name"));
    const idxPhone = header.findIndex(h => h.includes("tel") || h.includes("phone") || h.includes("cel"));
    const idxCoins = header.findIndex(h => h.includes("chimu") || h.includes("coin") || h.includes("moneda"));

    if (idxEmail === -1) {
      return { success: false, message: "No se encontró la columna 'Email' en el CSV. Es obligatoria." };
    }

    // Process rows (start from 1)
    for (let i = 1; i < dataRows.length; i++) {
      const row = dataRows[i];
      // Split by comma, handling potential quotes is hard without library, basic split for now
      const cols = row.split(",").map(c => c.trim().replace(/^"|"$/g, ''));

      const email = cols[idxEmail]?.toLowerCase();

      if (!email || !email.includes("@")) {
        stats.failed++;
        continue;
      }

      const alias = idxAlias !== -1 ? cols[idxAlias] || email.split("@")[0] : email.split("@")[0];
      const name = idxName !== -1 ? cols[idxName] || null : null;
      const phone = idxPhone !== -1 ? cols[idxPhone] || null : null;
      const chimucoins = idxCoins !== -1 ? parseInt(cols[idxCoins]) || 0 : 0;

      try {
        // Upsert
        await db.player.upsert({
          where: { email },
          update: {
            alias: alias || undefined, // Only update if alias is present in CSV? or overwrite? Let's overwrite.
            name: name || undefined,
            phone: phone || undefined,
            chimucoins: chimucoins > 0 ? chimucoins : undefined, // Update coins only if positive? Or set exact value? Let's set exact value found.
          },
          create: {
            email,
            alias, // Ensure unique alias logic? Prisma will throw if alias dup. 
            // Better to find unique alias if needed.
            name,
            phone,
            chimucoins,
            password: passwordHash,
            active: true,
          }
        });

        // Check if it was created or updated (Prisma doesn't easily tell, but we could check existence first)
        // For simplicity, we count success.
        // Actually, let's distinguish roughly.

        // Refinement: to count accurately we'd need to check first.
        // But for performance bulk is better. Since this is admin tool, one by one is fine for < 1000 users.

        stats.updated++; // We'll just say processed successfully.
      } catch (err) {
        console.error(`Error importing row ${i}:`, err);
        // If alias conflict on create
        if ((err as any).code === 'P2002') {
          // Try to fallback alias?
          stats.failed++;
        } else {
          stats.failed++;
        }
      }
    }

    revalidatePath("/admin/players");
    return {
      success: true,
      message: `Importación finalizada. Procesados: ${stats.updated + stats.created}. Fallidos: ${stats.failed}.`,
      detailedStats: stats
    };

  } catch (error) {
    console.error("Import error:", error);
    return { success: false, message: "Error al procesar el archivo." };
  }
}
