/**
 * Script de conversión batch: imágenes → WebP, videos → WebM
 * Uso: node scripts/convert-to-webp.mjs
 * En VPS: docker exec chimucheck-web node scripts/convert-to-webp.mjs
 */

import sharp from "sharp";
import { readdir, unlink, stat, rename } from "fs/promises";
import { existsSync } from "fs";
import { join, extname, basename, dirname } from "path";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Configuración de resoluciones por carpeta ────────────────────────────────
const FOLDER_CONFIG = {
  avatars:   { width: 400,  height: 400,  fit: "cover",  quality: 85 },
  fondos:    { width: 1920, height: 1080, fit: "inside", quality: 82 },
  imagenes:  { width: 1280, height: 720,  fit: "inside", quality: 85 },
  juegos:    { width: 800,  height: 1100, fit: "inside", quality: 85 },
  default:   { width: 1280, height: 1280, fit: "inside", quality: 85 },
};

// ── Extensiones a convertir ──────────────────────────────────────────────────
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".avif", ".tiff", ".webp"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".mkv"]);
const SKIP_FILES = new Set(["favicon.ico"]);
const SKIP_EXTS  = new Set([".svg", ".ico"]);

let converted = 0;
let skipped   = 0;
let errors    = 0;

const isProd   = process.env.NODE_ENV === "production";
const BASE_DIR = isProd ? "/app/public" : join(process.cwd(), "public");

console.log(`\n🚀 Iniciando conversión de media`);
console.log(`📁 Directorio base: ${BASE_DIR}`);
console.log(`🌐 Entorno: ${isProd ? "producción" : "desarrollo"}\n`);

// ── Detectar ffmpeg ──────────────────────────────────────────────────────────
let ffmpegAvailable = false;
try {
  execSync("ffmpeg -version", { stdio: "ignore" });
  ffmpegAvailable = true;
  console.log("✅ ffmpeg disponible — los videos serán convertidos a WebM");
} catch {
  console.warn("⚠️  ffmpeg no encontrado — los videos se omitirán");
}

// ── Obtener configuración según la carpeta del archivo ───────────────────────
function getConfig(filePath) {
  const parts = filePath.replace(BASE_DIR, "").split("/").filter(Boolean);
  const folder = parts.length >= 2 ? parts[1] : "default";
  return FOLDER_CONFIG[folder] ?? FOLDER_CONFIG.default;
}

// ── Convertir imagen ─────────────────────────────────────────────────────────
async function convertImage(filePath) {
  const ext     = extname(filePath).toLowerCase();
  const dir     = dirname(filePath);
  const base    = basename(filePath, ext);
  const outPath = join(dir, `${base}.webp`);
  const isSame  = ext === ".webp";
  const config  = getConfig(filePath);

  try {
    const tempPath = outPath + ".tmp";
    const target   = isSame ? tempPath : outPath;

    await sharp(filePath)
      .resize(config.width, config.height, { fit: config.fit, withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toFile(target);

    if (isSame) {
      await unlink(filePath);
      await rename(tempPath, outPath);
    } else {
      if (!existsSync(outPath)) throw new Error("Archivo destino no creado");
      await unlink(filePath);
    }

    const info = await stat(outPath);
    console.log(`  ✅ ${basename(filePath)} → ${basename(outPath)} (${(info.size / 1024).toFixed(1)} KB)`);
    return { original: filePath, converted: outPath };
  } catch (err) {
    console.error(`  ❌ Error convirtiendo ${basename(filePath)}: ${err.message}`);
    errors++;
    return null;
  }
}

// ── Convertir video ──────────────────────────────────────────────────────────
async function convertVideo(filePath) {
  if (!ffmpegAvailable) { skipped++; return null; }

  const ext     = extname(filePath).toLowerCase();
  const dir     = dirname(filePath);
  const base    = basename(filePath, ext);
  const outPath = join(dir, `${base}.webm`);

  try {
    execSync(
      `ffmpeg -i "${filePath}" -c:v libvpx-vp9 -crf 33 -b:v 0 -vf "scale='min(1280,iw)':'-2'" -c:a libopus -b:a 96k -y "${outPath}"`,
      { stdio: "pipe" }
    );
    if (!existsSync(outPath)) throw new Error("Archivo destino no creado");
    await unlink(filePath);
    console.log(`  ✅ ${basename(filePath)} → ${basename(outPath)}`);
    return { original: filePath, converted: outPath };
  } catch (err) {
    console.error(`  ❌ Error convirtiendo video ${basename(filePath)}: ${err.message}`);
    errors++;
    return null;
  }
}

// ── Recorrer directorio recursivamente ──────────────────────────────────────
async function processDirectory(dirPath, results = []) {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath, results);
      continue;
    }

    const ext = extname(entry.name).toLowerCase();

    if (SKIP_FILES.has(entry.name) || SKIP_EXTS.has(ext)) {
      skipped++;
      continue;
    }

    if (IMAGE_EXTS.has(ext)) {
      const result = await convertImage(fullPath);
      if (result) { converted++; results.push(result); }
    } else if (VIDEO_EXTS.has(ext)) {
      const result = await convertVideo(fullPath);
      if (result) { converted++; results.push(result); }
    }
  }

  return results;
}

// ── Actualizar URLs en la base de datos ─────────────────────────────────────
async function updateDatabase(conversions) {
  if (conversions.length === 0) {
    console.log("\n📦 No hay URLs que actualizar en la base de datos.");
    return;
  }

  console.log("\n🗄️  Actualizando URLs en la base de datos...");

  // Mapa de URL pública vieja → nueva
  const urlMap = new Map();
  for (const { original, converted: conv } of conversions) {
    const oldUrl = original.replace(BASE_DIR, "").replace(/\\/g, "/");
    const newUrl = conv.replace(BASE_DIR, "").replace(/\\/g, "/");
    urlMap.set(oldUrl, newUrl);
  }

  let dbUpdates = 0;

  // Banner.imageUrl
  for (const banner of await prisma.banner.findMany()) {
    const newUrl = urlMap.get(banner.imageUrl);
    if (newUrl) {
      await prisma.banner.update({ where: { id: banner.id }, data: { imageUrl: newUrl } });
      console.log(`  📌 Banner [${banner.title}]: ${banner.imageUrl} → ${newUrl}`);
      dbUpdates++;
    }
  }

  // News.imageUrl
  for (const item of await prisma.news.findMany()) {
    if (!item.imageUrl) continue;
    const newUrl = urlMap.get(item.imageUrl);
    if (newUrl) {
      await prisma.news.update({ where: { id: item.id }, data: { imageUrl: newUrl } });
      console.log(`  📌 News [${item.title}]: ${item.imageUrl} → ${newUrl}`);
      dbUpdates++;
    }
  }

  // Event.imageUrl
  for (const event of await prisma.event.findMany()) {
    if (!event.imageUrl) continue;
    const newUrl = urlMap.get(event.imageUrl);
    if (newUrl) {
      await prisma.event.update({ where: { id: event.id }, data: { imageUrl: newUrl } });
      console.log(`  📌 Event [${event.name}]: ${event.imageUrl} → ${newUrl}`);
      dbUpdates++;
    }
  }

  // Tournament.image + Tournament.photos (JSON)
  for (const t of await prisma.tournament.findMany()) {
    let changed = false;
    const data = {};
    if (t.image) {
      const newUrl = urlMap.get(t.image);
      if (newUrl) { data.image = newUrl; changed = true; }
    }
    if (t.photos) {
      try {
        const photos = JSON.parse(t.photos);
        const newPhotos = photos.map(url => urlMap.get(url) ?? url);
        if (JSON.stringify(photos) !== JSON.stringify(newPhotos)) {
          data.photos = JSON.stringify(newPhotos);
          changed = true;
        }
      } catch {}
    }
    if (changed) {
      await prisma.tournament.update({ where: { id: t.id }, data });
      console.log(`  📌 Tournament [${t.name}] actualizado`);
      dbUpdates++;
    }
  }

  // Game.images (JSON)
  for (const game of await prisma.game.findMany()) {
    if (!game.images) continue;
    try {
      const images = JSON.parse(game.images);
      const newImages = images.map(url => urlMap.get(url) ?? url);
      if (JSON.stringify(images) !== JSON.stringify(newImages)) {
        await prisma.game.update({ where: { id: game.id }, data: { images: JSON.stringify(newImages) } });
        console.log(`  📌 Game [${game.name}] actualizado`);
        dbUpdates++;
      }
    } catch {}
  }

  // Prize.images (JSON)
  for (const prize of await prisma.prize.findMany()) {
    try {
      const images = JSON.parse(prize.images);
      const newImages = images.map(url => urlMap.get(url) ?? url);
      if (JSON.stringify(images) !== JSON.stringify(newImages)) {
        await prisma.prize.update({ where: { id: prize.id }, data: { images: JSON.stringify(newImages) } });
        console.log(`  📌 Prize [${prize.title}] actualizado`);
        dbUpdates++;
      }
    } catch {}
  }

  // Player.image
  for (const player of await prisma.player.findMany()) {
    if (!player.image) continue;
    const newUrl = urlMap.get(player.image);
    if (newUrl) {
      await prisma.player.update({ where: { id: player.id }, data: { image: newUrl } });
      console.log(`  📌 Player [${player.name}] avatar actualizado`);
      dbUpdates++;
    }
  }

  // Raffle.prizeImage + Raffle.images (JSON)
  for (const raffle of await prisma.raffle.findMany()) {
    let changed = false;
    const data = {};
    if (raffle.prizeImage) {
      const newUrl = urlMap.get(raffle.prizeImage);
      if (newUrl) { data.prizeImage = newUrl; changed = true; }
    }
    if (raffle.images) {
      try {
        const images = JSON.parse(raffle.images);
        const newImages = images.map(url => urlMap.get(url) ?? url);
        if (JSON.stringify(images) !== JSON.stringify(newImages)) {
          data.images = JSON.stringify(newImages);
          changed = true;
        }
      } catch {}
    }
    if (changed) {
      await prisma.raffle.update({ where: { id: raffle.id }, data });
      console.log(`  📌 Raffle [${raffle.title}] actualizado`);
      dbUpdates++;
    }
  }

  // RafflePrize.image
  for (const rp of await prisma.rafflePrize.findMany()) {
    if (!rp.image) continue;
    const newUrl = urlMap.get(rp.image);
    if (newUrl) {
      await prisma.rafflePrize.update({ where: { id: rp.id }, data: { image: newUrl } });
      console.log(`  📌 RafflePrize actualizado`);
      dbUpdates++;
    }
  }

  // SiteSection — JSON genérico (reemplazar en string)
  for (const section of await prisma.siteSection.findMany()) {
    let contentStr = JSON.stringify(section.content);
    let newContentStr = contentStr;
    for (const [oldUrl, newUrl] of urlMap.entries()) {
      newContentStr = newContentStr.split(oldUrl).join(newUrl);
    }
    if (newContentStr !== contentStr) {
      await prisma.siteSection.update({
        where: { id: section.id },
        data: { content: JSON.parse(newContentStr) }
      });
      console.log(`  📌 SiteSection [${section.key}] actualizado`);
      dbUpdates++;
    }
  }

  console.log(`\n✅ Base de datos actualizada: ${dbUpdates} registros modificados.`);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(BASE_DIR)) {
    console.error(`❌ Directorio base no encontrado: ${BASE_DIR}`);
    process.exit(1);
  }

  console.log("🔍 Escaneando archivos...\n");
  const conversions = await processDirectory(BASE_DIR);

  console.log(`\n─────────────────────────────────────`);
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Convertidos: ${converted}`);
  console.log(`   ⏭️  Omitidos:   ${skipped}`);
  console.log(`   ❌ Errores:    ${errors}`);
  console.log(`─────────────────────────────────────`);

  await updateDatabase(conversions);
  await prisma.$disconnect();
  console.log("\n🎉 Conversión completada.\n");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  prisma.$disconnect();
  process.exit(1);
});
