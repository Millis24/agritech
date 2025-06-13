-- AlterTable
ALTER TABLE "Utente" ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultReportRange" TEXT NOT NULL DEFAULT 'month',
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notifyErrors" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifySync" BOOLEAN NOT NULL DEFAULT false;
