"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: Date;
  canDelete: boolean;
}

export async function getMediaFiles(): Promise<MediaFile[]> {
  const directories = [
    { path: path.join(process.cwd(), "public", "uploads", "wallpapers"), urlPrefix: "/uploads/wallpapers", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "images"), urlPrefix: "/uploads/images", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "videos"), urlPrefix: "/uploads/videos", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "avatars"), urlPrefix: "/uploads/avatars", canDelete: true },
  ];

  try {
    const allFiles: MediaFile[] = [];

    // Helper function for recursive scanning
    const scanDirectory = async (currentPath: string, urlPrefix: string, rootPath: string, canDelete: boolean) => {
      try {
        const items = await fs.readdir(currentPath, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(currentPath, item.name);

          if (item.isDirectory()) {
            await scanDirectory(fullPath, `${urlPrefix}/${item.name}`, rootPath, canDelete);
          } else {
            if (item.name.startsWith(".")) continue;

            const stats = await fs.stat(fullPath);
            const relativePath = path.relative(rootPath, fullPath);

            allFiles.push({
              name: relativePath, // Use relative path as name (e.g. "subfolder/image.png")
              url: `${urlPrefix}/${item.name}`,
              size: stats.size,
              createdAt: stats.birthtime,
              canDelete: canDelete,
            });
          }
        }
      } catch (err) {
        console.warn(`Could not access directory ${currentPath}:`, err);
      }
    };

    await Promise.all(directories.map(async (dir) => {
      try {
        await fs.access(dir.path);
        await scanDirectory(dir.path, dir.urlPrefix, dir.path, dir.canDelete);
      } catch (err) {
        // Directory might not exist, just skip
      }
    }));

    // Sort by newest first
    return allFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error reading media files:", error);
    return [];
  }
}

export async function deleteMediaFile(filename: string) {
  const directories = [
    UPLOADS_DIR,
    path.join(process.cwd(), "public", "images"),
    path.join(process.cwd(), "public", "videos"),
  ];

  try {
    let filePath = "";

    // Find which directory the file is in
    for (const dir of directories) {
      const potentialPath = path.join(dir, filename);
      try {
        await fs.access(potentialPath);
        filePath = potentialPath;
        break;
      } catch {
        continue;
      }
    }

    if (!filePath) {
      return { success: false, error: "Archivo no encontrado" };
    }

    await fs.unlink(filePath);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (error) {
    console.error("Error deleting media file:", error);
    return { success: false, error: "Error al eliminar el archivo" };
  }
}
