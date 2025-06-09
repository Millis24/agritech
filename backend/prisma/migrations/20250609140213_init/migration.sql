-- CreateTable
CREATE TABLE "Utente" (
    "id" SERIAL NOT NULL,
    "nomeUtente" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Utente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "partitaIva" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imballaggio" (
    "id" SERIAL NOT NULL,
    "prezzo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL,
    "dimensioni" TEXT NOT NULL,
    "capacitaKg" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Imballaggio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prodotto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "varieta" TEXT NOT NULL,
    "calibro" TEXT NOT NULL,
    "colore" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prodotto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bolla" (
    "id" SERIAL NOT NULL,
    "numeroBolla" INTEGER NOT NULL,
    "dataOra" TIMESTAMP(3) NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bolla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Articolo" (
    "id" SERIAL NOT NULL,
    "bollaId" INTEGER NOT NULL,
    "prodotto" TEXT NOT NULL,
    "qualita" TEXT NOT NULL,
    "prezzo" DOUBLE PRECISION NOT NULL,
    "imballaggio" TEXT NOT NULL,
    "nColli" INTEGER NOT NULL,
    "pesoLordo" INTEGER NOT NULL,
    "pesoNetto" INTEGER NOT NULL,

    CONSTRAINT "Articolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImballaggioReso" (
    "id" SERIAL NOT NULL,
    "bollaId" INTEGER NOT NULL,
    "tipologia" TEXT NOT NULL,
    "valore" DOUBLE PRECISION NOT NULL,
    "daTrasportare" INTEGER NOT NULL,
    "totaliARendere" INTEGER NOT NULL,

    CONSTRAINT "ImballaggioReso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utente_nomeUtente_key" ON "Utente"("nomeUtente");

-- CreateIndex
CREATE UNIQUE INDEX "Bolla_numeroBolla_key" ON "Bolla"("numeroBolla");

-- AddForeignKey
ALTER TABLE "Articolo" ADD CONSTRAINT "Articolo_bollaId_fkey" FOREIGN KEY ("bollaId") REFERENCES "Bolla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImballaggioReso" ADD CONSTRAINT "ImballaggioReso_bollaId_fkey" FOREIGN KEY ("bollaId") REFERENCES "Bolla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
