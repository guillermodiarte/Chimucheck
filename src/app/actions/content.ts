"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const dataPath = path.join(process.cwd(), "src", "data", "content.json");

export async function getContent() {
  const file = await fs.readFile(dataPath, "utf8");
  return JSON.parse(file);
}

export async function updateHero(heroData: any) {
  const content = await getContent();
  content.hero = heroData;
  await fs.writeFile(dataPath, JSON.stringify(content, null, 2));
  revalidatePath("/");
  return { success: true };
}

export async function addNews(newsItem: any) {
  const content = await getContent();
  content.news.unshift(newsItem); // Add to beginning
  await fs.writeFile(dataPath, JSON.stringify(content, null, 2));
  revalidatePath("/");
  return { success: true };
}

export async function deleteNews(id: string) {
  const content = await getContent();
  content.news = content.news.filter((item: any) => item.id !== id);
  await fs.writeFile(dataPath, JSON.stringify(content, null, 2));
  revalidatePath("/");
  return { success: true };
}
