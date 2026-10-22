/**
 * Script de normalización y matching difuso (fuzzy matching) de Provincias y Localidades
 * para usuarios ya registrados en la base de datos de Chimucheck (Dokploy / SQLite).
 *
 * Se ejecuta automáticamente en el despliegue vía start.sh o manualmente con:
 *   node prisma/fix-locations.js
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// Cargar dataset oficial de Argentina
const datasetPath = path.join(__dirname, "../src/data/provincias_localidades.json");
let locationsData = {};
try {
  locationsData = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
} catch (e) {
  // Fallback si corre en standalone
  const altPath = path.join(__dirname, "../export_localidades/provincias_localidades_simple.json");
  if (fs.existsSync(altPath)) {
    locationsData = JSON.parse(fs.readFileSync(altPath, "utf8"));
  } else {
    console.error("[fix-locations] No se pudo encontrar el archivo de provincias y localidades");
    process.exit(0);
  }
}

const ALL_PROVINCES = Object.keys(locationsData);

// Normalización de texto: minúsculas, sin tildes ni caracteres extraños
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_.,/()]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Distancia Levenshtein para medir similitud tipográfica
function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 0; i <= bn; ++i) matrix[i][0] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

// Diccionario de alias y abreviaciones comunes de Provincias argentinas
const PROVINCE_ALIASES = {
  "caba": "Ciudad Autónoma de Buenos Aires",
  "capital federal": "Ciudad Autónoma de Buenos Aires",
  "ciudad autonoma de buenos aires": "Ciudad Autónoma de Buenos Aires",
  "buenos aires capital": "Ciudad Autónoma de Buenos Aires",
  "capital": "Ciudad Autónoma de Buenos Aires",
  "bs as": "Buenos Aires",
  "bsas": "Buenos Aires",
  "bs as interior": "Buenos Aires",
  "pba": "Buenos Aires",
  "provincia de buenos aires": "Buenos Aires",
  "sgo": "Santiago del Estero",
  "sgo del estero": "Santiago del Estero",
  "sgo. del estero": "Santiago del Estero",
  "tuc": "Tucumán",
  "tucuman": "Tucumán",
  "mza": "Mendoza",
  "cba": "Córdoba",
  "cordoba": "Córdoba",
  "tdf": "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "tierra del fuego": "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "sta fe": "Santa Fe",
  "santa fe": "Santa Fe",
  "sta cruz": "Santa Cruz",
  "santa cruz": "Santa Cruz",
  "e rios": "Entre Ríos",
  "entre rios": "Entre Ríos",
  "la rioja": "La Rioja",
  "san juan": "San Juan",
  "san luis": "San Luis",
  "neuquen": "Neuquén",
  "rio negro": "Río Negro",
  "chubut": "Chubut",
  "corrientes": "Corrientes",
  "misiones": "Misiones",
  "formosa": "Formosa",
  "chaco": "Chaco",
  "salta": "Salta",
  "jujuy": "Jujuy",
  "catamarca": "Catamarca",
  "la pampa": "La Pampa",
};

// Diccionario de abreviaturas frecuentes en nombres de localidades
const ABBREVIATIONS = {
  "r": ["riacho", "rio", "san"],
  "gral": "general",
  "cnel": "coronel",
  "dr": "doctor",
  "dra": "doctora",
  "pto": "puerto",
  "sta": "santa",
  "sto": "santo",
  "v": "villa",
  "vlla": "villa",
  "tte": "teniente",
  "subtte": "subteniente",
  "cmte": "comandante",
  "ing": "ingeniero",
  "cdad": "ciudad",
  "bo": "barrio",
  "b": "barrio",
};

function matchProvince(rawInput) {
  if (!rawInput) return null;
  const norm = normalize(rawInput);
  if (!norm) return null;

  // 1. Alias directo
  if (PROVINCE_ALIASES[norm]) return PROVINCE_ALIASES[norm];

  // 2. Coincidencia exacta normalizada
  for (const p of ALL_PROVINCES) {
    if (normalize(p) === norm) return p;
  }

  // 3. Prefijo o sufijo claro
  for (const p of ALL_PROVINCES) {
    const np = normalize(p);
    if (np.startsWith(norm) || (norm.length >= 4 && norm.startsWith(np))) {
      return p;
    }
  }

  // 4. Búsqueda por menor distancia Levenshtein
  let best = null;
  let minDistance = 999;
  for (const p of ALL_PROVINCES) {
    const np = normalize(p);
    const dist = levenshtein(norm, np);
    if (dist < minDistance) {
      minDistance = dist;
      best = p;
    }
  }

  return minDistance <= 3 ? best : null;
}

function matchCity(province, rawCity) {
  if (!province || !rawCity) return null;
  const cities = locationsData[province] || [];
  if (cities.length === 0) return null;

  const norm = normalize(rawCity);
  if (!norm) return null;

  // Si el usuario puso "Capital" y la provincia tiene localidad homónima
  if (norm === "capital" || norm === "capital federal") {
    const homonima = cities.find((c) => normalize(c) === normalize(province));
    if (homonima) return homonima;
  }

  // 1. Coincidencia exacta normalizada
  for (const c of cities) {
    if (normalize(c) === norm) return c;
  }

  // 2. Comparación por tokens con expansión de abreviaturas
  const inputTokens = norm.split(" ").filter(Boolean);
  let bestCity = null;
  let highestScore = 0;

  for (const c of cities) {
    const cTokens = normalize(c).split(" ").filter(Boolean);
    let matchedScore = 0;

    for (const inTok of inputTokens) {
      let tokMatch = 0;
      for (const targetTok of cTokens) {
        if (targetTok === inTok) {
          tokMatch = Math.max(tokMatch, 1.0);
        } else if (targetTok.startsWith(inTok) && inTok.length >= 3) {
          tokMatch = Math.max(tokMatch, 0.85);
        } else if (inTok.length === 1 && targetTok.startsWith(inTok)) {
          // Abreviatura de una letra como "r" -> "riacho"
          tokMatch = Math.max(tokMatch, 0.8);
        } else if (ABBREVIATIONS[inTok]) {
          const expanded = ABBREVIATIONS[inTok];
          if (Array.isArray(expanded) ? expanded.includes(targetTok) : expanded === targetTok) {
            tokMatch = Math.max(tokMatch, 0.95);
          }
        } else {
          const d = levenshtein(inTok, targetTok);
          const maxL = Math.max(inTok.length, targetTok.length);
          if (d <= 2 && maxL > 3) {
            tokMatch = Math.max(tokMatch, 1 - d / maxL);
          }
        }
      }
      matchedScore += tokMatch;
    }

    const tokenPrecision = matchedScore / Math.max(inputTokens.length, cTokens.length);
    const rawDist = levenshtein(norm, normalize(c));
    const levRatio = 1 - rawDist / Math.max(norm.length, normalize(c).length);
    const finalScore = Math.max(tokenPrecision, levRatio);

    if (finalScore > highestScore) {
      highestScore = finalScore;
      bestCity = c;
    }
  }

  return highestScore >= 0.45 ? bestCity : null;
}

// Analiza si un string contiene provincia y localidad juntos (ej: "Formosa - Riacho Hehe" o "Formosa, R. Hehe")
function splitCombinedLocation(raw) {
  if (!raw) return null;
  const separators = [" - ", " / ", ", ", ",", " (", " – "];
  for (const sep of separators) {
    if (raw.includes(sep)) {
      const parts = raw.split(sep);
      if (parts.length >= 2) {
        const partA = parts[0].replace(/[()]/g, "").trim();
        const partB = parts[1].replace(/[()]/g, "").trim();
        const provA = matchProvince(partA);
        if (provA) {
          return { provinceCandidate: provA, cityCandidate: partB };
        }
        const provB = matchProvince(partB);
        if (provB) {
          return { provinceCandidate: provB, cityCandidate: partA };
        }
      }
    }
  }
  return null;
}

async function fixLocations() {
  const prisma = new PrismaClient();
  console.log("======================================================");
  console.log("📍 Iniciando normalización de Provincias y Localidades");
  console.log("======================================================");

  try {
    const players = await prisma.player.findMany({
      select: {
        id: true,
        alias: true,
        province: true,
        city: true,
      },
    });

    console.log(`Total de jugadores encontrados en BD: ${players.length}`);

    let updatedCount = 0;
    let alreadyValidCount = 0;
    let emptyCount = 0;

    for (const player of players) {
      const rawProvince = player.province || "";
      const rawCity = player.city || "";

      if (!rawProvince && !rawCity) {
        emptyCount++;
        continue;
      }

      // Comprobar si ya está 100% normalizado
      if (
        rawProvince &&
        ALL_PROVINCES.includes(rawProvince) &&
        rawCity &&
        (locationsData[rawProvince] || []).includes(rawCity)
      ) {
        alreadyValidCount++;
        continue;
      }

      let matchedProvince = null;
      let matchedCity = null;

      // 1. Verificar si rawProvince tiene provincia y localidad juntos
      const combined = splitCombinedLocation(rawProvince);
      if (combined) {
        matchedProvince = combined.provinceCandidate;
        matchedCity = matchCity(matchedProvince, rawCity || combined.cityCandidate);
      } else {
        matchedProvince = matchProvince(rawProvince);
        if (matchedProvince) {
          matchedCity = matchCity(matchedProvince, rawCity);
        } else if (rawCity) {
          // Si province no matcheó pero city sí, buscar en qué provincia está esa city
          for (const prov of ALL_PROVINCES) {
            const foundCity = matchCity(prov, rawCity);
            if (foundCity) {
              matchedProvince = prov;
              matchedCity = foundCity;
              break;
            }
          }
        }
      }

      // Si no encontró ciudad pero la provincia es oficial y no había ciudad
      if (matchedProvince && !matchedCity && rawCity) {
        matchedCity = matchCity(matchedProvince, rawCity);
      }

      const newProvince = matchedProvince || rawProvince || null;
      const newCity = matchedCity || rawCity || null;

      if (newProvince !== rawProvince || newCity !== rawCity) {
        await prisma.player.update({
          where: { id: player.id },
          data: {
            country: "Argentina",
            province: newProvince,
            city: newCity,
          },
        });

        console.log(
          `✔ Jugador [${player.alias || player.id}]: "${rawProvince}" | "${rawCity}" ➡️ "${newProvince}" | "${newCity}"`
        );
        updatedCount++;
      } else {
        alreadyValidCount++;
      }
    }

    console.log("------------------------------------------------------");
    console.log(`✅ Finalizado con éxito (ubicaciones):`);
    console.log(`   - Actualizados con match: ${updatedCount}`);
    console.log(`   - Ya correctos o sin cambios: ${alreadyValidCount}`);
    console.log(`   - Sin datos de ubicación: ${emptyCount}`);
    console.log("======================================================");

    // Sincronizar nombres completos de ganadores de sorteos
    await fixRaffleWinners(prisma);

    // Marcar jugadores OAuth sin perfil completo
    await fixOAuthProfileCompletion(prisma);
  } catch (err) {
    console.error("[fix-locations] Error durante la ejecución:", err);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixRaffleWinners(prisma) {
  try {
    console.log("======================================================");
    console.log("🎁 Sincronizando nombres completos de ganadores de sorteos...");
    const raffles = await prisma.raffle.findMany({
      where: { winnerId: { not: null } },
      select: { id: true, title: true, winnerId: true, winnerAlias: true },
    });

    let raffleUpdated = 0;
    for (const r of raffles) {
      if (!r.winnerId) continue;
      const player = await prisma.player.findUnique({
        where: { id: r.winnerId },
        select: { name: true, alias: true },
      });
      if (player) {
        const fullName = player.name?.trim() || player.alias;
        if (fullName && r.winnerAlias !== fullName) {
          await prisma.raffle.update({
            where: { id: r.id },
            data: { winnerAlias: fullName },
          });
          console.log(`✔ Sorteo "${r.title}": "${r.winnerAlias}" ➡️ "${fullName}"`);
          raffleUpdated++;
        }
      }
    }

    const prizes = await prisma.rafflePrize.findMany({
      where: { winnerId: { not: null } },
      select: { id: true, title: true, winnerId: true, winnerAlias: true },
    });

    let prizesUpdated = 0;
    for (const p of prizes) {
      if (!p.winnerId) continue;
      const player = await prisma.player.findUnique({
        where: { id: p.winnerId },
        select: { name: true, alias: true },
      });
      if (player) {
        const fullName = player.name?.trim() || player.alias;
        if (fullName && p.winnerAlias !== fullName) {
          await prisma.rafflePrize.update({
            where: { id: p.id },
            data: { winnerAlias: fullName },
          });
          console.log(`✔ Premio "${p.title}": "${p.winnerAlias}" ➡️ "${fullName}"`);
          prizesUpdated++;
        }
      }
    }
    console.log(`✅ Sorteos actualizados: ${raffleUpdated}, Premios actualizados: ${prizesUpdated}`);
    console.log("======================================================");
  } catch (err) {
    console.error("[fix-raffle-winners] Error:", err);
  }
}

async function fixOAuthProfileCompletion(prisma) {
  try {
    console.log("======================================================");
    console.log("👤 Marcando jugadores OAuth sin perfil completo...");

    // Find players who have an OAuth account and no province or city
    const oauthPlayers = await prisma.player.findMany({
      where: {
        accounts: { some: {} }, // has at least one OAuth account
        needsProfileCompletion: false,
        OR: [
          { province: null },
          { province: "" },
          { city: null },
          { city: "" },
        ],
      },
      select: { id: true, alias: true, province: true, city: true },
    });

    let markedCount = 0;
    for (const player of oauthPlayers) {
      await prisma.player.update({
        where: { id: player.id },
        data: { needsProfileCompletion: true },
      });
      console.log(`✔ Jugador [${player.alias || player.id}] marcado para completar perfil`);
      markedCount++;
    }

    console.log(`✅ Jugadores marcados para completar perfil: ${markedCount}`);
    console.log("======================================================");
  } catch (err) {
    console.error("[fix-oauth-profile] Error:", err);
  }
}

if (require.main === module) {
  fixLocations();
}

module.exports = { fixLocations, fixRaffleWinners, fixOAuthProfileCompletion, matchProvince, matchCity };
