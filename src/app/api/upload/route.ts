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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Ensure uploads directory exists
  const uploadDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Create unique filename
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = file.name.split('.').pop();
  const filename = `${file.name.replace(/\.[^/.]+$/, "")}-${uniqueSuffix}.${ext}`;
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
