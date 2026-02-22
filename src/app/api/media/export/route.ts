import { NextResponse } from "next/server";
import path from "path";
import AdmZip from "adm-zip";
import fs from "fs";

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json({ error: "Directorio de uploads no encontrado" }, { status: 404 });
    }

    const zip = new AdmZip();
    zip.addLocalFolder(uploadsDir, "uploads");

    const zipBuffer = zip.toBuffer();
    const filename = `biblioteca_chimuchek_${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting media zip:", error);
    return NextResponse.json({ error: "Error al generar el archivo ZIP" }, { status: 500 });
  }
}
