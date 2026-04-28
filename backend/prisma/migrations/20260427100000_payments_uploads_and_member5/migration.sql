-- New enums
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE "AssessmentSeverity" AS ENUM ('MINIMAL', 'MILD', 'MODERATE', 'MODERATELY_SEVERE', 'SEVERE');
CREATE TYPE "TreatmentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- User: avatar
ALTER TABLE "User"
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "avatarPublicId" TEXT;

-- Payment: stripe + invoice + refunded amount
ALTER TABLE "Payment"
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeChargeId" TEXT,
ADD COLUMN "invoiceUrl" TEXT,
ADD COLUMN "invoicePublicId" TEXT,
ADD COLUMN "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");

-- Subscription: stripe ids + cancelledAt
ALTER TABLE "Subscription"
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- Withdrawal table
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rejectionReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Withdrawal_therapistId_status_idx" ON "Withdrawal"("therapistId", "status");

ALTER TABLE "Withdrawal"
ADD CONSTRAINT "Withdrawal_therapistId_fkey"
FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Assessment: type + crisisFlag + severity enum migration
ALTER TABLE "Assessment"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PHQ9',
ADD COLUMN "crisisFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "severity_new" "AssessmentSeverity";

UPDATE "Assessment" SET "severity_new" =
  CASE upper("severity")
    WHEN 'MINIMAL' THEN 'MINIMAL'::"AssessmentSeverity"
    WHEN 'MILD' THEN 'MILD'::"AssessmentSeverity"
    WHEN 'MODERATE' THEN 'MODERATE'::"AssessmentSeverity"
    WHEN 'MODERATELY_SEVERE' THEN 'MODERATELY_SEVERE'::"AssessmentSeverity"
    WHEN 'SEVERE' THEN 'SEVERE'::"AssessmentSeverity"
    ELSE 'MILD'::"AssessmentSeverity"
  END;

ALTER TABLE "Assessment" DROP COLUMN "severity";
ALTER TABLE "Assessment" RENAME COLUMN "severity_new" TO "severity";
ALTER TABLE "Assessment" ALTER COLUMN "severity" SET NOT NULL;

-- TreatmentPlan: progress + status enum
ALTER TABLE "TreatmentPlan"
ADD COLUMN "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "status_new" "TreatmentPlanStatus";

UPDATE "TreatmentPlan" SET "status_new" =
  CASE lower("status")
    WHEN 'active' THEN 'ACTIVE'::"TreatmentPlanStatus"
    WHEN 'completed' THEN 'COMPLETED'::"TreatmentPlanStatus"
    WHEN 'cancelled' THEN 'CANCELLED'::"TreatmentPlanStatus"
    ELSE 'ACTIVE'::"TreatmentPlanStatus"
  END;

ALTER TABLE "TreatmentPlan" DROP COLUMN "status";
ALTER TABLE "TreatmentPlan" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "TreatmentPlan" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "TreatmentPlan" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- Prescription: sessionId + diagnosis + pdfPublicId
ALTER TABLE "Prescription"
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "diagnosis" TEXT,
ADD COLUMN "pdfPublicId" TEXT;
