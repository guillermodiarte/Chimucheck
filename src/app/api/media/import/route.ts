import { NextRequest, NextResponse } from "next/server";
import path from "path";
import AdmZip from "adm-zip";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "El archivo debe ser un .zip" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const zip = new AdmZip(buffer);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Ensure the uploads directory exists
    fs.mkdirSync(uploadsDir, { recursive: true });

    const entries = zip.getEntries();
    let restored = 0;

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      // Strip leading "uploads/" prefix if present in the zip
      let entryName = entry.entryName;
      if (entryName.startsWith("uploads/")) {
        entryName = entryName.slice("uploads/".length);
      }

      const destPath = path.join(uploadsDir, entryName);

      // Prevent path traversal attacks
      if (!destPath.startsWith(uploadsDir)) continue;

      // Ensure parent directory exists
      fs.mkdirSync(path.dirname(destPath), { recursive: true });

      // Write the file
      fs.writeFileSync(destPath, entry.getData());
      restored++;
    }

    return NextResponse.json({
      success: true,
      message: `Biblioteca restaurada: ${restored} archivos importados.`,
    });
  } catch (error) {
    console.error("Error importing media zip:", error);
    return NextResponse.json({ error: "Error al procesar el archivo ZIP" }, { status: 500 });
  }
}
