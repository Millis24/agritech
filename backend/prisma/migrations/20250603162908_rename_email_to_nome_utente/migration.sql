/*
  Warnings:

  - You are about to drop the column `email` on the `Utente` table. All the data in the column will be lost.
  - Added the required column `nomeUtente` to the `Utente` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Utente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomeUtente" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
INSERT INTO "new_Utente" ("id", "password") SELECT "id", "password" FROM "Utente";
DROP TABLE "Utente";
ALTER TABLE "new_Utente" RENAME TO "Utente";
CREATE UNIQUE INDEX "Utente_nomeUtente_key" ON "Utente"("nomeUtente");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
