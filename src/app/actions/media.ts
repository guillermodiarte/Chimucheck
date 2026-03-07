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
    { path: path.join(process.cwd(), "public", "uploads", "fondos"), urlPrefix: "/uploads/fondos", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "imagenes"), urlPrefix: "/uploads/imagenes", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "videos"), urlPrefix: "/uploads/videos", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "avatars"), urlPrefix: "/uploads/avatars", canDelete: true },
    { path: path.join(process.cwd(), "public", "uploads", "juegos"), urlPrefix: "/uploads/juegos", canDelete: true },
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

export async function deleteMediaFile(url: string) {
  try {
    // Ensure we refer to a local public path properly regardless of the leading slash
    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
    const filePath = path.join(process.cwd(), "public", normalizedUrl);

    // Security check: prevent directory traversal by ensuring the resolved path starts with the public dir
    const publicDir = path.join(process.cwd(), "public");
    if (!filePath.startsWith(publicDir)) {
      return { success: false, error: "Ruta del archivo no válida" };
    }

    try {
      await fs.access(filePath);
    } catch {
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

export async function moveMediaFile(url: string, targetFolder: string) {
  try {
    const validFolders = ["imagenes", "fondos", "avatars", "juegos", "videos"];
    if (!validFolders.includes(targetFolder)) {
      return { success: false, error: "Carpeta de destino no válida" };
    }

    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
    const sourceFilePath = path.join(process.cwd(), "public", normalizedUrl);

    // Security check for source
    const publicDir = path.join(process.cwd(), "public");
    if (!sourceFilePath.startsWith(publicDir)) {
      return { success: false, error: "Ruta de archivo de origen no válida" };
    }

    try {
      await fs.access(sourceFilePath);
    } catch {
      return { success: false, error: "Archivo original no encontrado" };
    }

    const fileName = path.basename(sourceFilePath);
    const targetDirPath = path.join(process.cwd(), "public", "uploads", targetFolder);

    // Ensure target exists
    try {
      await fs.mkdir(targetDirPath, { recursive: true });
    } catch (err) {
      console.error("Error creating target directory: ", err);
    }

    const targetFilePath = path.join(targetDirPath, fileName);

    // Security check for target
    if (!targetFilePath.startsWith(publicDir)) {
      return { success: false, error: "Ruta de destino no válida" };
    }

    // Use rename (or copy+unlink if across volumes, but within public/uploads rename is safe)
    try {
      await fs.rename(sourceFilePath, targetFilePath);
    } catch (renameErr: any) {
      // Fallback for cross-device links (EXDEV)
      if (renameErr.code === 'EXDEV') {
        await fs.copyFile(sourceFilePath, targetFilePath);
        await fs.unlink(sourceFilePath);
      } else {
        throw renameErr;
      }
    }

    revalidatePath("/admin/media");
    return {
      success: true,
      newUrl: `/uploads/${targetFolder}/${fileName}`
    };

  } catch (error) {
    console.error("Error moving media file:", error);
    return { success: false, error: "Error al mover el archivo" };
  }
}
