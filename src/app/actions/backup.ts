"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function exportDatabase() {
  try {
    const banners = await db.banner.findMany();
    const news = await db.news.findMany();
    const events = await db.event.findMany();
    const siteSections = await db.siteSection.findMany();
    const users = await db.user.findMany();

    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        banners,
        news,
        events,
        siteSections,
        users,
      },
    };

    return {
      success: true,
      data: JSON.stringify(backupData, null, 2),
      filename: `backup-chimuchek-${new Date().toISOString().split("T")[0]}.json`,
    };
  } catch (error) {
    console.error("Error exporting database:", error);
    return { success: false, message: "Error al exportar la base de datos." };
  }
}

export async function importDatabase(jsonContent: string) {
  try {
    const parsed = JSON.parse(jsonContent);

    if (!parsed.data || !parsed.version) {
      return { success: false, message: "Formato de archivo inválido." };
    }

    const { banners, news, events, siteSections, users } = parsed.data;

    await db.$transaction(async (tx) => {
      // 1. Clean existing data (Risk: Deleting all data!)
      // We delete dependent data first if there were relations, but here models are mostly independent.
      await tx.banner.deleteMany();
      await tx.news.deleteMany();
      await tx.event.deleteMany();
      await tx.siteSection.deleteMany();
      await tx.user.deleteMany();

      // 2. Restore data
      if (users?.length > 0) await tx.user.createMany({ data: users });
      if (banners?.length > 0) await tx.banner.createMany({ data: banners });
      if (news?.length > 0) await tx.news.createMany({ data: news });
      if (events?.length > 0) await tx.event.createMany({ data: events });
      if (siteSections?.length > 0) await tx.siteSection.createMany({ data: siteSections });
    });

    revalidatePath("/admin");
    return { success: true, message: "Base de datos restaurada correctamente." };
  } catch (error) {
    console.error("Error importing database:", error);
    return { success: false, message: "Error al importar la base de datos. Verifica el archivo." };
  }
}
