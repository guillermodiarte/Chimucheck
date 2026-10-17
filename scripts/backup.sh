#!/bin/sh
# ============================================================
# Backup Automático - Base de Datos Chimucheck
# Ejecuta diariamente a las 00:00 hs
# Retención: 7 días (rolling window)
# ============================================================

# --- Configuration ---
if [ -n "$DATABASE_URL" ]; then
  RAW_PATH=$(echo "$DATABASE_URL" | sed 's/file://')
  if   [ -f "$RAW_PATH" ];               then DB_PATH="$RAW_PATH"
  elif [ -f "./prisma/$RAW_PATH" ];      then DB_PATH="./prisma/$RAW_PATH"
  elif [ -f "./prisma/$(basename "$RAW_PATH")" ]; then DB_PATH="./prisma/$(basename "$RAW_PATH")"
  else DB_PATH="$RAW_PATH"
  fi
else
  DB_PATH="./prisma/dev.db"
fi

BACKUP_DIR="${BACKUP_DIR:-/app/chimu_backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="backup base de datos global ${TIMESTAMP}.db"

# --- Helpers ---
log() { echo "[backup.sh] $(date '+%Y-%m-%d %H:%M:%S') - $1"; }

# --- Main ---
log "Iniciando backup automático..."
log "Base de datos origen: $DB_PATH"
log "Directorio destino: $BACKUP_DIR"

if ! mkdir -p "$BACKUP_DIR"; then
  log "ERROR: No se pudo crear el directorio $BACKUP_DIR"
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  log "ERROR: Archivo de base de datos no encontrado en: $DB_PATH"
  exit 1
fi

DEST_PATH="$BACKUP_DIR/$BACKUP_NAME"

if command -v sqlite3 > /dev/null 2>&1; then
  log "sqlite3 disponible - usando .backup para copia atómica..."
  sqlite3 "$DB_PATH" ".backup '$DEST_PATH'"
else
  log "sqlite3 no disponible - usando cp..."
  cp "$DB_PATH" "$DEST_PATH"
fi

if [ $? -eq 0 ]; then
  log "✅ Backup completado: $DEST_PATH"
else
  log "ERROR: Falló la copia de la base de datos."
  exit 1
fi

# 4. Retention policy: delete backups older than 7 days
log "Aplicando política de retención (7 días)..."
find "$BACKUP_DIR" -maxdepth 1 -name "backup base de datos global *.db" -mtime +7 | while read OLD_FILE; do
  log "🗑  Eliminando backup antiguo: $OLD_FILE"
  rm -f "$OLD_FILE"
done

log "Backup finalizado correctamente."
ls -lh "$BACKUP_DIR" 2>/dev/null | tail -20
