import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

// ── Configuración de resoluciones por tipo de carpeta ───────────────────────
const FOLDER_CONFIG: Record<string, { width: number; height: number; fit: "cover" | "inside" | "contain"; quality: number }> = {
  avatars:  { width: 400,  height: 400,  fit: "cover",  quality: 85 },
  fondos:   { width: 1920, height: 1080, fit: "inside", quality: 82 },
  imagenes: { width: 1280, height: 720,  fit: "inside", quality: 85 },
  juegos:   { width: 800,  height: 1100, fit: "inside", quality: 85 },
  default:  { width: 1280, height: 1280, fit: "inside", quality: 85 },
};

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ success: false, message: "El archivo excede el límite de 20MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Determine target folder based on file type and requested type
  const requestedFolder = data.get("folder") as string;
  const requestedType   = data.get("type") as string;

  let targetFolder = "imagenes"; // default

  if (requestedType === "avatar" || requestedFolder === "avatars") {
    targetFolder = "avatars";
  } else if (requestedType === "fondo" || requestedFolder === "fondos") {
    targetFolder = "fondos";
  } else if (requestedType === "juego" || requestedFolder === "juegos") {
    targetFolder = "juegos";
  } else if (file.type.startsWith("video/")) {
    targetFolder = "videos";
  } else if (file.type.startsWith("image/")) {
    targetFolder = "imagenes";
  }

  const sanitizedFolder = targetFolder.replace(/[^a-zA-Z0-9-_]/g, "");

  const isProd   = process.env.NODE_ENV === "production";
  const baseDir  = isProd ? "/app/public" : join(process.cwd(), "public");
  const uploadDir = join(baseDir, "uploads", sanitizedFolder);

  console.log("Upload Debug Info:", { processCwd: process.cwd(), isProd, baseDir, uploadDir, exists: existsSync(uploadDir) });

  if (!existsSync(uploadDir)) {
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
      return NextResponse.json({ success: false, message: "Error configurando directorio" }, { status: 500 });
    }
  }

  // Sanitizar nombre base
  const customName = data.get("customName") as string;
  const baseName   = customName || file.name.replace(/\.[^/.]+$/, "");

  const sanitized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const uniqueSuffix = Date.now();
  const isVideo      = file.type.startsWith("video/");

  // ── Procesamiento de IMAGEN → WebP ────────────────────────────────────────
  if (!isVideo) {
    const filename = `${sanitized}-${uniqueSuffix}.webp`;
    const filepath = join(uploadDir, filename);

    try {
      const config = FOLDER_CONFIG[sanitizedFolder] ?? FOLDER_CONFIG.default;

      console.log(`Convirtiendo imagen a WebP [${config.width}x${config.height}] → ${filepath}`);

      await sharp(buffer)
        .resize(config.width, config.height, { fit: config.fit, withoutEnlargement: true })
        .webp({ quality: config.quality })
        .toFile(filepath);

      if (!existsSync(filepath)) {
        throw new Error("Archivo WebP no fue creado");
      }

      console.log("Imagen WebP guardada:", filepath);

      const url = `/uploads/${sanitizedFolder}/${filename}`;
      return NextResponse.json({ success: true, url });
    } catch (error) {
      console.error("Error procesando imagen:", error);
      return NextResponse.json({
        success: false,
        message: `Error al procesar imagen: ${(error as any)?.message || "Unknown error"}`
      }, { status: 500 });
    }
  }

  // ── Procesamiento de VIDEO ────────────────────────────────────────────────
  // Para videos aceptamos WebM directamente (ya optimizado)
  // Si es mp4/otro formato se guarda tal cual (la conversión se hace vía el script batch o manualmente)
  // En el futuro se puede agregar fluent-ffmpeg aquí para conversión server-side
  const ext      = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const isWebm   = ext === "webm";
  const filename = `${sanitized}-${uniqueSuffix}.${isWebm ? "webm" : ext}`;
  const filepath = join(uploadDir, filename);

  try {
    console.log("Guardando video:", filepath);
    await writeFile(filepath, buffer);
    console.log("Video guardado:", filepath);

    if (!isWebm) {
      console.warn(`⚠️  Video guardado como .${ext}. Se recomienda subir videos en formato .webm para mayor eficiencia.`);
    }

    const url = `/uploads/${sanitizedFolder}/${filename}`;
    return NextResponse.json({
      success: true,
      url,
      ...(isWebm ? {} : { warning: "Se recomienda subir videos en formato .webm para menor peso." })
    });
  } catch (error) {
    console.error("Error saving video:", error);
    return NextResponse.json({
      success: false,
      message: `Error al guardar video: ${(error as any)?.message || "Unknown error"}`
    }, { status: 500 });
  }
}
