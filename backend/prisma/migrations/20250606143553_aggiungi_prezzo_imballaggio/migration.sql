-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Imballaggio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prezzo" REAL NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL,
    "dimensioni" TEXT NOT NULL,
    "capacitaKg" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Imballaggio" ("capacitaKg", "createdAt", "dimensioni", "id", "note", "tipo") SELECT "capacitaKg", "createdAt", "dimensioni", "id", "note", "tipo" FROM "Imballaggio";
DROP TABLE "Imballaggio";
ALTER TABLE "new_Imballaggio" RENAME TO "Imballaggio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
