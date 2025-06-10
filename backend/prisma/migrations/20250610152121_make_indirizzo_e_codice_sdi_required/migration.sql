/*
  Warnings:

  - Made the column `codiceSDI` on table `Cliente` required. This step will fail if there are existing NULL values in that column.
  - Made the column `indirizzo` on table `Cliente` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "codiceSDI" SET NOT NULL,
ALTER COLUMN "indirizzo" SET NOT NULL;
