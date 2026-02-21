"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const GAMING_KEY = "gaming_section"; // Correct key used in page.tsx

export type GamingItem = {
  id: string;
  title: string;
  image: string;
  message: string;
  url: string;
  buttonText: string;
};

export type GamingZoneData = {
  title: string;
  buttonText: string;
  buttonUrl: string;
  items: GamingItem[];
};

// Default initial config
const DEFAULT_CONFIG: GamingZoneData = {
  title: "¿TIENES LO QUE SE NECESITA?",
  buttonText: "INSCRIBIRSE AL TORNEO",
  buttonUrl: "/registro",
  items: [
    {
      id: "1",
      title: "CS2 Competitivo",
      image: "/images/chimucoin/game-1.jpg",
      message: "",
      url: "/torneos",
      buttonText: "Ver Más"
    },
    {
      id: "2",
      title: "Valorant Cups",
      image: "/images/chimucoin/game-2.jpg",
      message: "",
      url: "/torneos",
      buttonText: "Ver Más"
    }
  ]
};

export async function getGamingConfig(): Promise<GamingZoneData> {
  try {
    const section = await db.siteSection.findUnique({
      where: { key: GAMING_KEY },
    });

    if (!section || !section.content) return DEFAULT_CONFIG;

    const raw = section.content as any;

    // Migration from old array format if any
    if (Array.isArray(raw)) {
      return {
        ...DEFAULT_CONFIG,
        items: raw,
      };
    }

    return {
      title: raw.title || DEFAULT_CONFIG.title,
      buttonText: raw.buttonText || DEFAULT_CONFIG.buttonText,
      buttonUrl: raw.buttonUrl || DEFAULT_CONFIG.buttonUrl,
      items: Array.isArray(raw.items) ? raw.items : DEFAULT_CONFIG.items,
    };
  } catch (error) {
    console.error("Error fetching gaming items:", error);
    return DEFAULT_CONFIG;
  }
}

export async function updateGamingConfig(data: GamingZoneData) {
  try {
    if (!data.items || data.items.length < 1 || data.items.length > 5) {
      return { success: false, message: "Debe haber entre 1 y 5 elementos" };
    }

    await db.siteSection.upsert({
      where: { key: GAMING_KEY },
      create: {
        key: GAMING_KEY,
        content: data as any,
      },
      update: {
        content: data as any,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating gaming zone:", error);
    return { success: false, message: "Error al guardar zona gaming" };
  }
}

export async function updateGamingItems(items: GamingItem[]) {
  try {
    const current = await getGamingConfig();
    return updateGamingConfig({ ...current, items });
  } catch (error) {
    console.error("Error updating gaming items:", error);
    return { success: false, message: "Error al actualizar artículos gaming" };
  }
}
