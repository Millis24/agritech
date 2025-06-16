/*
  Warnings:

  - You are about to drop the column `destinatarioIndirizzo` on the `Bolla` table. All the data in the column will be lost.
  - You are about to drop the column `destinatarioTelefono` on the `Bolla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bolla" DROP COLUMN "destinatarioIndirizzo",
DROP COLUMN "destinatarioTelefono",
ADD COLUMN     "destinatarioNumeroCivico" TEXT,
ADD COLUMN     "destinatarioTelefonoCell" TEXT,
ADD COLUMN     "destinatarioTelefonoFisso" TEXT,
ADD COLUMN     "destinatarioVia" TEXT;
