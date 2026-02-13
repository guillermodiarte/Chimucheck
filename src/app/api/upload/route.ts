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

  // Ensure uploads directory exists
  const uploadDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
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
    await writeFile(filepath, buffer);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ success: false, message: "Error saving file" }, { status: 500 });
  }
}
