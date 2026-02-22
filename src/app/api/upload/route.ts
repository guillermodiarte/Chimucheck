import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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
  const requestedType = data.get("type") as string;

  let targetFolder = "imagenes"; // default for generic images

  if (requestedType === "avatar" || requestedFolder === "avatars") {
    targetFolder = "avatars";
  } else if (requestedType === "fondo" || requestedFolder === "fondos") {
    targetFolder = "fondos";
  } else if (file.type.startsWith("video/")) {
    targetFolder = "videos";
  } else if (file.type.startsWith("image/")) {
    targetFolder = "imagenes";
  }

  // Ensure uploads directory exists
  // We no longer use sanitizedFolder from the user input generic folder to enforce standardized paths
  const sanitizedFolder = targetFolder.replace(/[^a-zA-Z0-9-_]/g, "");

  // Determine upload path
  const isProd = process.env.NODE_ENV === "production";
  const baseDir = isProd ? "/app/public" : join(process.cwd(), "public");

  // Force all uploads inside public/uploads/...
  const uploadDir = join(baseDir, "uploads", sanitizedFolder);

  console.log("Upload Debug Info:", {
    processCwd: process.cwd(),
    isProd,
    baseDir,
    uploadDir,
    exists: existsSync(uploadDir)
  });

  if (!existsSync(uploadDir)) {
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
      return NextResponse.json({ success: false, message: "Error configurando directorio" }, { status: 500 });
    }
  }

  // Create unique filename
  // Sanitize filename: normalize, remove accents, replace spaces/special chars with -
  const customName = data.get("customName") as string;
  const baseName = customName || file.name.replace(/\.[^/.]+$/, ""); // remove extension if not custom

  const sanitized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9]/g, "-")   // replace non-alphanumeric with -
    .replace(/-+/g, "-")             // collapse multiple -
    .replace(/^-|-$/g, "")           // remove leading/trailing -
    .toLowerCase();

  const uniqueSuffix = Date.now();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const filename = `${sanitized}-${uniqueSuffix}.${ext}`;
  const filepath = join(uploadDir, filename);

  try {
    console.log("Attempting to write file to:", filepath);
    await writeFile(filepath, buffer);
    console.log("File written successfully to:", filepath);

    // Verify visibility in standalone public directory
    const standalonePath = join(process.cwd(), "public", "uploads", sanitizedFolder, filename);
    const isVisibleInStandalone = existsSync(standalonePath);
    console.log("Verification - File visible in standalone path?", {
      standalonePath,
      isVisible: isVisibleInStandalone
    });

    const url = `/uploads/${sanitizedFolder}/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Error saving file:", error);
    // Return specific permission error if applicable
    return NextResponse.json({
      success: false,
      message: `Error al guardar archivo: ${(error as any)?.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
