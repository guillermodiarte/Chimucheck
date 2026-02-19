"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const STREAMING_KEY = "streaming_config";

export type StreamingConfig = {
  isLive: boolean;
  platform: "twitch" | "youtube";
  channelUrl: string;
  gridTitle?: string; // Optional title for the grid section
};

const DEFAULT_CONFIG: StreamingConfig = {
  isLive: false,
  platform: "twitch",
  channelUrl: "https://twitch.tv/chimucheck",
  gridTitle: "Estamos en Vivo",
};

export async function getStreamingConfig(): Promise<StreamingConfig> {
  try {
    const section = await db.siteSection.findUnique({
      where: { key: STREAMING_KEY },
    });

    if (!section) return DEFAULT_CONFIG;

    return { ...DEFAULT_CONFIG, ...(section.content as any) };
  } catch (error) {
    console.error("Error fetching streaming config:", error);
    return DEFAULT_CONFIG;
  }
}

export async function updateStreamingConfig(data: StreamingConfig) {
  try {
    await db.siteSection.upsert({
      where: { key: STREAMING_KEY },
      create: {
        key: STREAMING_KEY,
        content: data as any,
      },
      update: {
        content: data as any,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating streaming config:", error);
    return { success: false, message: "Error al guardar configuración de streaming" };
  }
}
