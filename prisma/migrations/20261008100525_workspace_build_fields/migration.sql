-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "instructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceYearFrom" INTEGER,
ADD COLUMN     "sourceYearTo" INTEGER;
