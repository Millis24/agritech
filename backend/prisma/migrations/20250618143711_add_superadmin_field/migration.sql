/*
  Warnings:

  - You are about to drop the column `darkMode` on the `Utente` table. All the data in the column will be lost.
  - You are about to drop the column `defaultReportRange` on the `Utente` table. All the data in the column will be lost.
  - You are about to drop the column `notifyErrors` on the `Utente` table. All the data in the column will be lost.
  - You are about to drop the column `notifySync` on the `Utente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Utente" DROP COLUMN "darkMode",
DROP COLUMN "defaultReportRange",
DROP COLUMN "notifyErrors",
DROP COLUMN "notifySync",
ADD COLUMN     "superAdmin" BOOLEAN NOT NULL DEFAULT false;
