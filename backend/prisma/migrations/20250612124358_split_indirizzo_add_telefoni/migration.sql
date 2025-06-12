/*
  Warnings:

  - You are about to drop the column `indirizzo` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Cliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "indirizzo",
DROP COLUMN "telefono",
ADD COLUMN     "cap" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "numeroCivico" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paese" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provincia" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "telefonoCell" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "telefonoFisso" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "via" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "codiceSDI" SET DEFAULT '';
