"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';

const GAMING_KEY = "gaming_zone_items";

export type GamingItem = {
  id: string;
  title: string;
  image: string;
  message: string;
  url: string;
  buttonText: string;
};

// Default initial item if empty
const DEFAULT_ITEMS: GamingItem[] = [
  {
    id: "1",
    title: "Torneos Semanales",
    image: "/images/gaming1.jpg",
    message: "Compite cada semana por grandes premios en efectivo y chimucoins.",
    url: "/torneos",
    buttonText: "Ver Torneos"
  }
];

export async function getGamingItems(): Promise<GamingItem[]> {
  try {
    const section = await db.siteSection.findUnique({
      where: { key: GAMING_KEY },
    });

    if (!section) return DEFAULT_ITEMS;

    const items = section.content as any;
    return Array.isArray(items) ? items : DEFAULT_ITEMS;
  } catch (error) {
    console.error("Error fetching gaming items:", error);
    return DEFAULT_ITEMS;
  }
}

export async function updateGamingItems(items: GamingItem[]) {
  try {
    // Limit to 5 items max for UI sanity
    if (items.length > 5) {
      return { success: false, message: "Máximo 5 elementos permitidos" };
    }

    await db.siteSection.upsert({
      where: { key: GAMING_KEY },
      create: {
        key: GAMING_KEY,
        content: items as any,
      },
      update: {
        content: items as any,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating gaming items:", error);
    return { success: false, message: "Error al guardar zona gaming" };
  }
}
