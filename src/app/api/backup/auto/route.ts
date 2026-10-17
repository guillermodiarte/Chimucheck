import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const raw = dbUrl.replace(/^file:/, "").trim();

  if (path.isAbsolute(raw) && fs.existsSync(raw)) return raw;

  const cwd = process.cwd();
  const candidates = [
    raw,
    path.resolve(cwd, raw),
    path.resolve(cwd, "prisma", raw),
    path.resolve(cwd, "prisma", path.basename(raw)),
    path.resolve(cwd, ".next/standalone/prisma", path.basename(raw)),
    path.resolve(cwd, ".next/standalone", raw),
    path.resolve("/app/database", path.basename(raw)),
    "/app/database/prod.db",
    "/app/database/dev.db",
    path.resolve("/app/data", path.basename(raw)),
    "/app/data/prod.db",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  if (fs.existsSync("/app/database")) {
    try {
      const files = fs.readdirSync("/app/database");
      const dbFile = files.find((f) => f.endsWith(".db") && !f.startsWith("backup"));
      if (dbFile) return path.join("/app/database", dbFile);
    } catch {}
  }

  if (path.isAbsolute(raw)) return raw;
  return path.resolve(cwd, "prisma", path.basename(raw));
}

function getBackupDirectory(): string {
  if (process.env.BACKUP_DIR) {
    try {
      if (!fs.existsSync(process.env.BACKUP_DIR)) {
        fs.mkdirSync(process.env.BACKUP_DIR, { recursive: true });
      }
      return process.env.BACKUP_DIR;
    } catch {}
  }

  if (fs.existsSync("/app/chimu_backups")) return "/app/chimu_backups";

  // If /app/database exists (Coolify volume mounted!), save backups in /app/database/backups
  if (fs.existsSync("/app/database")) {
    const dir = "/app/database/backups";
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch {}
  }

  const localDir = path.resolve(process.cwd(), "chimu_backups");
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch (e) {
      console.error("[BACKUP_AUTO] Error al crear directorio local:", e);
    }
  }
  return localDir;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/** Deletes backup files older than 7 days (keeps safety backups indefinitely) */
function cleanOldBackups(backupDir: string) {
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.endsWith(".db")) continue;
      if (file.startsWith("pre_restore_safety_")) continue; // keep safety snapshots
      const filePath = path.join(backupDir, file);
      try {
        const { mtime } = fs.statSync(filePath);
        if (now - mtime.getTime() > SEVEN_DAYS) {
          fs.unlinkSync(filePath);
          console.log("[BACKUP_AUTO] Eliminado backup antiguo:", file);
        }
      } catch (err) {
        console.warn("[BACKUP_AUTO] Error al verificar:", file, err);
      }
    }
  } catch (err) {
    console.error("[BACKUP_AUTO] Error en limpieza de retención:", err);
  }
}

async function requireAdmin(req: Request) {
  // 1. Check legacy admin session cookie (Chimuchek Admin panel uses admin_session)
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    if (adminSession?.value) return true;
  } catch {}

  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin_session=true") || cookieHeader.includes("admin_session=")) {
    return true;
  }

  // 2. Check NextAuth session
  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role === "ADMIN") return true;
  } catch {}

  // 3. Check Authorization header / Bearer token (for VPS cron / Coolify scheduled curls)
  const authHeader = req.headers.get("authorization") || req.headers.get("x-backup-token");
  const cronSecret = process.env.CRON_SECRET || process.env.AUTH_SECRET;
  if (cronSecret && authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === cronSecret) return true;
  }

  return false;
}

// ─── GET — list backups / download single ────────────────────────────────────

export async function GET(req: Request) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const filename = searchParams.get("filename");
    const backupDir = getBackupDirectory();

    // Download single file
    if (action === "download") {
      if (!filename || path.basename(filename) !== filename || !filename.endsWith(".db")) {
        return new NextResponse("Invalid filename", { status: 400 });
      }
      const filePath = path.join(backupDir, filename);
      if (!fs.existsSync(filePath)) {
        return new NextResponse("Backup file not found", { status: 404 });
      }
      const fileBuffer = fs.readFileSync(filePath);
      const stat = fs.statSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": stat.size.toString(),
        },
      });
    }

    // List all backups
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [], backupDir });
    }

    cleanOldBackups(backupDir);

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((f) => f.endsWith(".db"))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        try {
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            formattedSize: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
            isSafetyBackup: file.startsWith("pre_restore_safety_"),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      );

    return NextResponse.json({ backups, backupDir });
  } catch (error) {
    console.error("[BACKUP_AUTO_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// ─── POST — create / restore / delete ────────────────────────────────────────

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, filename } = body;
    const backupDir = getBackupDirectory();
    const activeDbPath = getDatabasePath();

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // ── CREATE ───────────────────────────────────────────────────────────────
    if (action === "create") {
      if (!fs.existsSync(activeDbPath)) {
        return NextResponse.json(
          { error: `No se encontró la base de datos en: ${activeDbPath}` },
          { status: 404 }
        );
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const destName = `backup base de datos global ${ts}.db`;
      const destPath = path.join(backupDir, destName);

      let ok = false;
      try {
        await execAsync(`sqlite3 "${activeDbPath}" ".backup '${destPath}'"`);
        ok = true;
      } catch {
        try {
          fs.copyFileSync(activeDbPath, destPath);
          ok = true;
        } catch (copyErr) {
          console.error("[BACKUP_AUTO_CREATE] Error en copia:", copyErr);
        }
      }

      if (!ok || !fs.existsSync(destPath)) {
        return NextResponse.json(
          { error: "No se pudo generar la copia de seguridad." },
          { status: 500 }
        );
      }

      cleanOldBackups(backupDir);

      return NextResponse.json({
        success: true,
        message: "Copia de seguridad creada correctamente.",
        filename: destName,
      });
    }

    // ── RESTORE ──────────────────────────────────────────────────────────────
    if (action === "restore") {
      if (!filename || path.basename(filename) !== filename || !filename.endsWith(".db")) {
        return NextResponse.json({ error: "Nombre de archivo inválido." }, { status: 400 });
      }

      const sourceBackupPath = path.join(backupDir, filename);
      if (!fs.existsSync(sourceBackupPath)) {
        return NextResponse.json(
          { error: "El archivo de backup seleccionado no existe." },
          { status: 404 }
        );
      }

      // Disconnect Prisma
      try { await db.$disconnect(); } catch {}

      await new Promise((r) => setTimeout(r, 200));

      // Safety snapshot of current DB
      if (fs.existsSync(activeDbPath)) {
        try {
          fs.copyFileSync(
            activeDbPath,
            path.join(backupDir, `pre_restore_safety_${Date.now()}.db`)
          );
        } catch {}
      }

      // Delete stale WAL / SHM
      for (const ext of ["-wal", "-shm"]) {
        const p = `${activeDbPath}${ext}`;
        if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch {}
      }

      // Overwrite active DB
      try {
        fs.copyFileSync(sourceBackupPath, activeDbPath);
      } catch (err: any) {
        console.error("[BACKUP_AUTO_RESTORE]", err);
        return NextResponse.json(
          { error: `Error al restaurar: ${err.message}` },
          { status: 500 }
        );
      }

      // Reconnect Prisma
      try { await db.$connect(); } catch {}

      return NextResponse.json({
        success: true,
        message:
          "Base de datos restaurada correctamente. La página se recargará para aplicar los cambios.",
      });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (action === "delete") {
      if (!filename || path.basename(filename) !== filename || !filename.endsWith(".db")) {
        return NextResponse.json({ error: "Nombre de archivo inválido." }, { status: 400 });
      }
      const targetPath = path.join(backupDir, filename);
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);

      return NextResponse.json({ success: true, message: "Copia de seguridad eliminada." });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    console.error("[BACKUP_AUTO_POST]", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
