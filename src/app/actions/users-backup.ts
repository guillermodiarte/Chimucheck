"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function exportUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        // We do NOT export passwords for security
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error exporting users:", error);
    return { success: false, message: "Error al exportar usuarios" };
  }
}

export async function importUsers(usersData: any[]) {
  try {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return { success: false, message: "El archivo no contiene usuarios válidos." };
    }

    let importedCount = 0;
    let errorsCount = 0;

    for (const user of usersData) {
      // Basic validation
      if (!user.email || !user.role) {
        errorsCount++;
        continue;
      }

      try {
        // Upsert: Update if exists (by email, which is unique), Create if not
        // Note: For new users imported this way, they won't have a password set initially.
        // You might want to handle this policy (e.g., set a default temp password, or just rely on them unrelatedly)
        // Since we removed password schema complexity in export, we just ensure they exist.
        // If the user already exists, we update their metadata.

        await db.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            role: user.role,
            active: user.active !== undefined ? user.active : true,
          },
          create: {
            email: user.email,
            name: user.name,
            role: user.role,
            active: user.active !== undefined ? user.active : true,
            password: "", // Imports without password will need a reset or manual set. 
            // Alternatively, we could generate a random one. 
            // For now, empty string implies "cannot login until password reset".
          },
        });
        importedCount++;
      } catch (e) {
        console.error(`Error importing user ${user.email}:`, e);
        errorsCount++;
      }
    }

    revalidatePath("/admin/settings");
    return {
      success: true,
      message: `Importación completada: ${importedCount} procesados, ${errorsCount} errores.`
    };

  } catch (error) {
    console.error("Error importing users:", error);
    return { success: false, message: "Error crítico al importar usuarios" };
  }
}
