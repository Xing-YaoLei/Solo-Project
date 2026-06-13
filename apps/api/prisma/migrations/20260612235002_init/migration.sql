-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PROCESSING', 'EVIDENCE_UPLOADED', 'REVIEWING', 'APPROVED', 'REJECTED', 'RETRY', 'SUPPLEMENT', 'CLOSED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "ResponsibilityParty" AS ENUM ('PLATFORM', 'MERCHANT', 'LOGISTICS', 'CUSTOMER', 'SUPPLIER', 'OTHER');

-- CreateEnum
CREATE TYPE "TimelineAction" AS ENUM ('CREATED', 'ASSIGNED', 'STATUS_CHANGED', 'EVIDENCE_UPLOADED', 'EVIDENCE_DELETED', 'RETRY_REQUESTED', 'SUPPLEMENT_REQUESTED', 'RESPONSIBILITY_ASSIGNED', 'NOTE_ADDED', 'TIMEOUT_WARNING', 'TIMEOUT', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WECHAT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "groupLeader" TEXT,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "refundAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "problemTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "visitResult" TEXT,
    "responsibility" "ResponsibilityParty",
    "assigneeId" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "actualClosedAt" TIMESTAMP(3),
    "handlingDurationMinutes" INTEGER,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "isTimeout" BOOLEAN NOT NULL DEFAULT false,
    "timeoutCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "RefundOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundEvidence" (
    "id" TEXT NOT NULL,
    "refundOrderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundTimeline" (
    "id" TEXT NOT NULL,
    "refundOrderId" TEXT NOT NULL,
    "action" "TimelineAction" NOT NULL,
    "oldStatus" "RefundStatus",
    "newStatus" "RefundStatus",
    "oldValue" TEXT,
    "newValue" TEXT,
    "note" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundReminder" (
    "id" TEXT NOT NULL,
    "refundOrderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'IN_APP',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "RefundReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitResult" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "thresholdDays" INTEGER NOT NULL DEFAULT 7,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "problemTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visitResults" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibility" "ResponsibilityParty" NOT NULL,
    "assigneeId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefundOrder_status_idx" ON "RefundOrder"("status");

-- CreateIndex
CREATE INDEX "RefundOrder_region_idx" ON "RefundOrder"("region");

-- CreateIndex
CREATE INDEX "RefundOrder_assigneeId_idx" ON "RefundOrder"("assigneeId");

-- CreateIndex
CREATE INDEX "RefundOrder_deadline_idx" ON "RefundOrder"("deadline");

-- CreateIndex
CREATE INDEX "RefundOrder_createdAt_idx" ON "RefundOrder"("createdAt");

-- CreateIndex
CREATE INDEX "RefundOrder_isTimeout_idx" ON "RefundOrder"("isTimeout");

-- CreateIndex
CREATE INDEX "RefundTimeline_refundOrderId_idx" ON "RefundTimeline"("refundOrderId");

-- CreateIndex
CREATE INDEX "RefundTimeline_createdAt_idx" ON "RefundTimeline"("createdAt");

-- CreateIndex
CREATE INDEX "RefundReminder_refundOrderId_idx" ON "RefundReminder"("refundOrderId");

-- CreateIndex
CREATE INDEX "RefundReminder_recipientId_idx" ON "RefundReminder"("recipientId");

-- CreateIndex
CREATE INDEX "RefundReminder_readAt_idx" ON "RefundReminder"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisitResult_code_key" ON "VisitResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTag_name_key" ON "ProblemTag"("name");

-- AddForeignKey
ALTER TABLE "RefundOrder" ADD CONSTRAINT "RefundOrder_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundOrder" ADD CONSTRAINT "RefundOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundEvidence" ADD CONSTRAINT "RefundEvidence_refundOrderId_fkey" FOREIGN KEY ("refundOrderId") REFERENCES "RefundOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundEvidence" ADD CONSTRAINT "RefundEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTimeline" ADD CONSTRAINT "RefundTimeline_refundOrderId_fkey" FOREIGN KEY ("refundOrderId") REFERENCES "RefundOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTimeline" ADD CONSTRAINT "RefundTimeline_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundReminder" ADD CONSTRAINT "RefundReminder_refundOrderId_fkey" FOREIGN KEY ("refundOrderId") REFERENCES "RefundOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundReminder" ADD CONSTRAINT "RefundReminder_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityRule" ADD CONSTRAINT "ResponsibilityRule_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
