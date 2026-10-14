-- CreateEnum
CREATE TYPE "MedicineForm" AS ENUM ('TABLET', 'CAPSULE', 'DROPS', 'SYRUP', 'SPRAY', 'OINTMENT', 'INJECTION', 'POWDER', 'OTHER');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DoseStatus" AS ENUM ('PLANNED', 'TAKEN', 'MISSED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'SELECTED_DAYS', 'EVERY_N_DAYS');

-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationLabel" TEXT,
    "birthDate" DATE,
    "avatarUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyAccess" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "grantedById" TEXT NOT NULL,
    "role" "AccessRole" NOT NULL DEFAULT 'VIEWER',
    "status" "AccessStatus" NOT NULL DEFAULT 'PENDING',
    "invitationToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "form" "MedicineForm" NOT NULL DEFAULT 'OTHER',
    "strengthValue" DECIMAL(10,3),
    "strengthUnit" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "quantityUnit" TEXT NOT NULL DEFAULT 'шт.',
    "expiryDate" DATE,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" DECIMAL(10,3),
    "notifyWhenLow" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentCourse" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isContinuous" BOOLEAN NOT NULL DEFAULT false,
    "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseMedicine" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "doseAmount" DECIMAL(10,3) NOT NULL,
    "doseUnit" TEXT NOT NULL,
    "stockUnitsPerDose" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRule" (
    "id" TEXT NOT NULL,
    "courseMedicineId" TEXT NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL DEFAULT 'DAILY',
    "timeOfDay" VARCHAR(5) NOT NULL,
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "intervalDays" INTEGER,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderMinutes" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledDose" (
    "id" TEXT NOT NULL,
    "courseMedicineId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "DoseStatus" NOT NULL DEFAULT 'PLANNED',
    "takenAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledDose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyOffer" (
    "id" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "pharmacyName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "productUrl" TEXT NOT NULL,
    "isAvailable" BOOLEAN,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "HealthProfile_ownerId_idx" ON "HealthProfile"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyAccess_invitationToken_key" ON "FamilyAccess"("invitationToken");

-- CreateIndex
CREATE INDEX "FamilyAccess_profileId_status_idx" ON "FamilyAccess"("profileId", "status");

-- CreateIndex
CREATE INDEX "FamilyAccess_invitedEmail_idx" ON "FamilyAccess"("invitedEmail");

-- CreateIndex
CREATE INDEX "Medicine_profileId_isActive_idx" ON "Medicine"("profileId", "isActive");

-- CreateIndex
CREATE INDEX "Medicine_expiryDate_idx" ON "Medicine"("expiryDate");

-- CreateIndex
CREATE INDEX "TreatmentCourse_profileId_status_idx" ON "TreatmentCourse"("profileId", "status");

-- CreateIndex
CREATE INDEX "CourseMedicine_medicineId_idx" ON "CourseMedicine"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseMedicine_courseId_medicineId_key" ON "CourseMedicine"("courseId", "medicineId");

-- CreateIndex
CREATE INDEX "ScheduleRule_courseMedicineId_idx" ON "ScheduleRule"("courseMedicineId");

-- CreateIndex
CREATE INDEX "ScheduledDose_scheduledAt_status_idx" ON "ScheduledDose"("scheduledAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledDose_courseMedicineId_scheduledAt_key" ON "ScheduledDose"("courseMedicineId", "scheduledAt");

-- CreateIndex
CREATE INDEX "PharmacyOffer_medicineId_price_idx" ON "PharmacyOffer"("medicineId", "price");

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyAccess" ADD CONSTRAINT "FamilyAccess_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyAccess" ADD CONSTRAINT "FamilyAccess_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyAccess" ADD CONSTRAINT "FamilyAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentCourse" ADD CONSTRAINT "TreatmentCourse_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMedicine" ADD CONSTRAINT "CourseMedicine_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TreatmentCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMedicine" ADD CONSTRAINT "CourseMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_courseMedicineId_fkey" FOREIGN KEY ("courseMedicineId") REFERENCES "CourseMedicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledDose" ADD CONSTRAINT "ScheduledDose_courseMedicineId_fkey" FOREIGN KEY ("courseMedicineId") REFERENCES "CourseMedicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyOffer" ADD CONSTRAINT "PharmacyOffer_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
