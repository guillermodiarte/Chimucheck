"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGlobalSettings() {
  try {
    let settings = await db.globalSettings.findFirst();

    // Si no existe, lo creamos
    if (!settings) {
      settings = await db.globalSettings.create({
        data: {
          restrictPlayerRegistration: false,
          raffleWinnerCooldownDays: 7,
        }
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching global settings:", error);
    return { restrictPlayerRegistration: false, raffleWinnerCooldownDays: 7 };
  }
}

export async function updateRaffleWinnerCooldownDays(days: number) {
  try {
    const validDays = Math.max(0, Math.floor(Number(days) || 0));
    let settings = await db.globalSettings.findFirst();

    if (settings) {
      await db.globalSettings.update({
        where: { id: settings.id },
        data: { raffleWinnerCooldownDays: validDays }
      });
    } else {
      await db.globalSettings.create({
        data: {
          restrictPlayerRegistration: false,
          raffleWinnerCooldownDays: validDays,
        }
      });
    }

    revalidatePath("/admin/raffles");
    revalidatePath("/admin/settings");
    revalidatePath("/sorteos");
    return { success: true, message: `Margen configurado a ${validDays} días` };
  } catch (error) {
    console.error("Error updating raffle cooldown days:", error);
    return { success: false, message: "Error al actualizar la configuración" };
  }
}

export async function updateRestrictPlayerRegistration(value: boolean) {
  try {
    let settings = await db.globalSettings.findFirst();

    if (settings) {
      await db.globalSettings.update({
        where: { id: settings.id },
        data: { restrictPlayerRegistration: value }
      });
    } else {
      await db.globalSettings.create({
        data: { restrictPlayerRegistration: value }
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin/requests");
    return { success: true, message: `Registro de jugadores ${value ? 'restringido' : 'liberado'} correctamente` };
  } catch (error) {
    console.error("Error updating global settings:", error);
    return { success: false, message: "Error al actualizar la configuración" };
  }
}
