/*
  Warnings:

  - Added the required column `destinatarioCognome` to the `Bolla` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bolla" ADD COLUMN     "destinatarioCognome" TEXT NOT NULL;
