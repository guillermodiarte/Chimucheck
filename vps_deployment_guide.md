# Guía de Despliegue en VPS (Dokploy)

Esta guía detalla los pasos para actualizar tu despliegue en la VPS asegurando que la base de datos y los archivos subidos (imágenes) **no se borren** al reiniciar o volver a desplegar.

## Cambios Realizados

1.  **Persistencia de Base de Datos**:
    -   Se ha configurado `docker-compose.yml` para usar un volumen en `./data` que se mapea a `/app/data` dentro del contenedor.
    -   Se ha definido la variable `DATABASE_URL="file:/app/data/prod.db"` para que la base de datos se guarde en ese volumen seguro.
    -   Se actualizó `start.sh` para crear automáticamente la carpeta `/app/data` si no existe.

2.  **Persistencia de Archivos (Imágenes)**:
    -   Se mantiene el volumen `./public/uploads:/app/public/uploads` para que las imágenes de perfil y torneos se guarden en el disco de la VPS y no en el contenedor volátil.

## Configuración Crítica en Dokploy (Modo Nixpacks)

Dado que Dokploy está usando Nixpacks (construcción automática) y **NO** lee el archivo `docker-compose.yml`, es **OBLIGATORIO** configurar los volúmenes manualmente en la sección **"Volumes"** de tu aplicación en Dokploy.

### 1. Configurar Volúmenes (Persistencia)
Ve a la pestaña **Volumes** de tu aplicación y añade estos 3 volúmenes:

| Volume Name (Nombre) | Mount Path (Ruta Interna) | Descripción |
| :--- | :--- | :--- |
| `avatars-data` | `/app/public/avatars` | **CRÍTICO:** Aquí se guardan las fotos de perfil. |
| `uploads-data` | `/app/public/uploads` | Aquí se guardan otras imágenes subidas. |
| `db-data` | `/app/data` | **CRÍTICO:** Aquí vive tu base de datos SQLite. |

*   **Nota:** El "Volume Name" puede ser cualquier nombre que quieras (ej: `mis-avatars`), pero el **Mount Path** debe ser EXACTAMENTE el indicado arriba.

### 2. Variables de Entorno
Asegúrate de tener estas variables en la sección **Environment**:
-   `DATABASE_URL`: `file:/app/data/prod.db`
-   `AUTH_SECRET`: (Tu secreto generado)
-   `AUTH_TRUST_HOST`: `true`

### 3. Despliegue
Una vez configurados los volúmenes y las variables, haz clic en **Deploy**.

El script `start.sh` se encargará automáticamente de:
1.  Crear las carpetas si no existen.
2.  Crear "enlaces simbólicos" (atajos) para que el servidor encuentre las imágenes en esas carpetas persistentes.
3.  Iniciar la base de datos y la aplicación.

### 3. Migración de Datos (Importante)
Como hemos cambiado la ubicación de la base de datos (de `/app/prisma/dev.db` o `/app/build.db` a `/app/data/prod.db`), **la base de datos empezará vacía** en este despliegue si es la primera vez que se aplica este cambio.

El script de inicio (`start.sh`) ejecutará automáticamente:
1.  `prisma migrate deploy`: Creará las tablas.
2.  `prisma db push`: Asegurará que el esquema esté sincronizado.

**Si necesitas conservar datos previos:**
Tendrás que descargar el archivo `.db` antiguo de tu contenedor anterior (si aún existe) y colocarlo manualmente en la carpeta `./data` del host, renombrándolo a `prod.db`.

### 4. Reiniciar en Dokploy
Para aplicar los cambios (equivalente a `docker compose down && up`):
1.  Ve a tu dashboard de Dokploy.
2.  Entra en tu aplicación.
3.  Haz clic en el botón **"Deploy"**.
    *   Esto descargará el nuevo `docker-compose.yml` y recreará los contenedores con los nuevos volúmenes.

**Nota:** Si prefieres hacerlo por consola en la VPS, puedes usar los comandos de Docker habituales, pero el botón "Deploy" es lo más sencillo.

### 5. Verificación
1.  Ingresa a la web.
2.  Crea una cuenta o inicia sesión.
3.  Sube una foto de perfil.
4.  Reinicia el contenedor desde Dokploy.
5.  Verifica que la foto y el usuario sigan existiendo.

## Solución de Problemas

-   **Error de Permisos**: Si las imágenes no se suben, ejecuta en la VPS:
    ```bash
    chown -R 1001:1001 ./public/uploads
    chown -R 1001:1001 ./data
    ```
    (El usuario 1001 es el que usa Next.js dentro del contenedor).

-   **Base de Datos Bloqueada**: Si ocurre, reinicia el contenedor. SQLite a veces se bloquea si hay muchas conexiones concurrentes en modo dev, pero en producción debería funcionar bien.
