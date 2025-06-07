/*
  Warnings:

  - You are about to drop the column `clienteId` on the `Bolla` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Bolla` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `Bolla` table. All the data in the column will be lost.
  - You are about to drop the column `synced` on the `Prodotto` table. All the data in the column will be lost.
  - Added the required column `consegnaACarico` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daRendere` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daTrasportare` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataOra` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinatarioCodiceSDI` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinatarioEmail` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinatarioIndirizzo` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinatarioNome` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinatarioPartitaIva` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinatarioTelefono` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indirizzoDestinazione` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numeroBolla` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prodotti` to the `Bolla` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vettore` to the `Bolla` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bolla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroBolla" INTEGER NOT NULL,
    "dataOra" DATETIME NOT NULL,
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioIndirizzo" TEXT NOT NULL,
    "destinatarioEmail" TEXT NOT NULL,
    "destinatarioTelefono" TEXT NOT NULL,
    "destinatarioPartitaIva" TEXT NOT NULL,
    "destinatarioCodiceSDI" TEXT NOT NULL,
    "indirizzoDestinazione" TEXT NOT NULL,
    "causale" TEXT NOT NULL,
    "prodotti" TEXT NOT NULL,
    "daTrasportare" TEXT NOT NULL,
    "daRendere" TEXT NOT NULL,
    "consegnaACarico" TEXT NOT NULL,
    "vettore" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Bolla" ("causale", "id") SELECT "causale", "id" FROM "Bolla";
DROP TABLE "Bolla";
ALTER TABLE "new_Bolla" RENAME TO "Bolla";
CREATE UNIQUE INDEX "Bolla_numeroBolla_key" ON "Bolla"("numeroBolla");
CREATE TABLE "new_Prodotto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "varieta" TEXT NOT NULL,
    "calibro" TEXT NOT NULL,
    "colore" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Prodotto" ("calibro", "colore", "createdAt", "id", "nome", "varieta") SELECT "calibro", "colore", "createdAt", "id", "nome", "varieta" FROM "Prodotto";
DROP TABLE "Prodotto";
ALTER TABLE "new_Prodotto" RENAME TO "Prodotto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
