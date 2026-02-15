-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "maxPlayers" INTEGER NOT NULL DEFAULT 16,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "prizePool" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "game" TEXT,
    "format" TEXT,
    "games" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("active", "createdAt", "currentPlayers", "date", "description", "format", "game", "id", "image", "maxPlayers", "name", "prizePool", "status", "updatedAt") SELECT "active", "createdAt", "currentPlayers", "date", "description", "format", "game", "id", "image", "maxPlayers", "name", "prizePool", "status", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
