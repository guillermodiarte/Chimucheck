# Guía de Despliegue en VPS (Dokploy)

Esta guía detalla los pasos para actualizar tu despliegue en la VPS asegurando que la base de datos y los archivos subidos (imágenes) **no se borren** al reiniciar o volver a desplegar.

## Cambios Realizados

1.  **Persistencia de Base de Datos**:
    -   Se ha configurado `docker-compose.yml` para usar un volumen en `./data` que se mapea a `/app/data` dentro del contenedor.
    -   Se ha definido la variable `DATABASE_URL="file:/app/data/prod.db"` para que la base de datos se guarde en ese volumen seguro.
    -   Se actualizó `start.sh` para crear automáticamente la carpeta `/app/data` si no existe.

2.  **Persistencia de Archivos (Imágenes)**:
    -   Se mantiene el volumen `./public/uploads:/app/public/uploads` para que las imágenes de perfil y torneos se guarden en el disco de la VPS y no en el contenedor volátil.

## Instrucciones para Dokploy

### 1. Configuración del Proyecto
Asegúrate de que en el panel de Dokploy, en la sección de **Environment** o **Docker Compose**, se reflejen los cambios.

Si usas **Docker Compose** directamente en Dokploy:
Simplemente haz un "Pull" o "Deploy" de los últimos cambios del repositorio. El archivo `docker-compose.yml` actualizado se encargará de todo.

### 2. Verificar Volúmenes
Después del despliegue, verifica que en tu servidor VPS existan las siguientes carpetas en la ruta de tu aplicación (normalmente `/etc/dokploy/applications/[nombre-app]/files` o similar):
-   `data/`: Aquí estará el archivo `prod.db`.
-   `public/uploads/`: Aquí se guardarán las imágenes.

### 3. Migración de Datos (Importante)
Como hemos cambiado la ubicación de la base de datos (de `/app/prisma/dev.db` o `/app/build.db` a `/app/data/prod.db`), **la base de datos empezará vacía** en este despliegue si es la primera vez que se aplica este cambio.

El script de inicio (`start.sh`) ejecutará automáticamente:
1.  `prisma migrate deploy`: Creará las tablas.
2.  `prisma db push`: Asegurará que el esquema esté sincronizado.

**Si necesitas conservar datos previos:**
Tendrás que descargar el archivo `.db` antiguo de tu contenedor anterior (si aún existe) y colocarlo manualmente en la carpeta `./data` del host, renombrándolo a `prod.db`.

### 4. Verificación
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
