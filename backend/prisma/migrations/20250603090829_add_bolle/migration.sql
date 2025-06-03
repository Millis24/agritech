-- CreateTable
CREATE TABLE "Bolla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "data" DATETIME NOT NULL,
    "causale" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    CONSTRAINT "Bolla_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Articolo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bollaId" INTEGER NOT NULL,
    "prodotto" TEXT NOT NULL,
    "qualita" TEXT NOT NULL,
    "prezzo" REAL NOT NULL,
    "imballaggio" TEXT NOT NULL,
    "nColli" INTEGER NOT NULL,
    "pesoLordo" INTEGER NOT NULL,
    "pesoNetto" INTEGER NOT NULL,
    CONSTRAINT "Articolo_bollaId_fkey" FOREIGN KEY ("bollaId") REFERENCES "Bolla" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImballaggioReso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bollaId" INTEGER NOT NULL,
    "tipologia" TEXT NOT NULL,
    "valore" REAL NOT NULL,
    "daTrasportare" INTEGER NOT NULL,
    "totaliARendere" INTEGER NOT NULL,
    CONSTRAINT "ImballaggioReso_bollaId_fkey" FOREIGN KEY ("bollaId") REFERENCES "Bolla" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
