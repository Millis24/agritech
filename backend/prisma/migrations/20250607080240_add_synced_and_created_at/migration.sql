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
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Bolla" ("causale", "consegnaACarico", "createdAt", "daRendere", "daTrasportare", "dataOra", "destinatarioCodiceSDI", "destinatarioEmail", "destinatarioIndirizzo", "destinatarioNome", "destinatarioPartitaIva", "destinatarioTelefono", "id", "indirizzoDestinazione", "numeroBolla", "prodotti", "vettore") SELECT "causale", "consegnaACarico", "createdAt", "daRendere", "daTrasportare", "dataOra", "destinatarioCodiceSDI", "destinatarioEmail", "destinatarioIndirizzo", "destinatarioNome", "destinatarioPartitaIva", "destinatarioTelefono", "id", "indirizzoDestinazione", "numeroBolla", "prodotti", "vettore" FROM "Bolla";
DROP TABLE "Bolla";
ALTER TABLE "new_Bolla" RENAME TO "Bolla";
CREATE UNIQUE INDEX "Bolla_numeroBolla_key" ON "Bolla"("numeroBolla");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
