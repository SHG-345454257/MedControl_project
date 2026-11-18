-- AlterTable
ALTER TABLE "ScheduledDose" ADD COLUMN     "stockDebited" DECIMAL(65,30),
ADD COLUMN     "stockDebitedUnit" TEXT;
