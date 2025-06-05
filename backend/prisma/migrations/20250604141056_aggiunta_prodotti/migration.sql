-- CreateTable
CREATE TABLE "Prodotto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "varieta" TEXT NOT NULL,
    "calibro" TEXT NOT NULL,
    "colore" TEXT NOT NULL,
    "synced" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
