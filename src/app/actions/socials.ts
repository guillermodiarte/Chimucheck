"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SOCIALS_KEY = "social_links";

export type SocialLinks = {
  instagram: string;
  twitter: string; // X
  twitch: string;
  youtube: string;
  kick: string;
  discord: string;
  tiktok: string;
};

const DEFAULT_SOCIALS: SocialLinks = {
  instagram: "https://instagram.com/chimucheck",
  twitter: "https://twitter.com/chimucheck",
  twitch: "https://twitch.tv/chimucheck",
  youtube: "https://youtube.com/chimucheck",
  kick: "https://kick.com/chimucheck",
  discord: "",
  tiktok: "",
};

export async function getSocialLinks(): Promise<SocialLinks> {
  try {
    const section = await db.siteSection.findUnique({
      where: { key: SOCIALS_KEY },
    });

    if (!section) return DEFAULT_SOCIALS;

    return { ...DEFAULT_SOCIALS, ...(section.content as any) };
  } catch (error) {
    console.error("Error fetching social links:", error);
    return DEFAULT_SOCIALS;
  }
}

export async function updateSocialLinks(data: SocialLinks) {
  try {
    await db.siteSection.upsert({
      where: { key: SOCIALS_KEY },
      create: {
        key: SOCIALS_KEY,
        content: data as any,
      },
      update: {
        content: data as any,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating social links:", error);
    return { success: false, message: "Error al guardar redes sociales" };
  }
}
