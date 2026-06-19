-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HOUSEKEEPER', 'RECEPTIONIST', 'MANAGER');

-- CreateEnum
CREATE TYPE "CleaningTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('COLLECTED', 'PARTIAL_REFUNDED', 'FULLY_REFUNDED', 'DEDUCTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MISSED_ORDER', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'DEPOSIT_CHANGED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'COMPLETE', 'CANCEL', 'ASSIGN', 'NOTIFY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" DOUBLE PRECISION,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "maxGuests" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "depositAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_tasks" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "completedById" TEXT,
    "taskDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "status" "CleaningTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'COLLECTED',
    "refundAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductReason" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_audit_logs" (
    "id" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_documents" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentImage" TEXT,
    "guestName" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkin_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "reason" TEXT,
    "details" TEXT,
    "createdById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missed_orders" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notifiedRoles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missed_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_tasks_bookingId_key" ON "cleaning_tasks"("bookingId");

-- CreateIndex
CREATE INDEX "cleaning_tasks_propertyId_taskDate_idx" ON "cleaning_tasks"("propertyId", "taskDate");

-- CreateIndex
CREATE INDEX "cleaning_tasks_assignedToId_status_idx" ON "cleaning_tasks"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "cleaning_tasks_status_taskDate_idx" ON "cleaning_tasks"("status", "taskDate");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_bookingId_key" ON "deposits"("bookingId");

-- CreateIndex
CREATE INDEX "deposit_audit_logs_depositId_createdAt_idx" ON "deposit_audit_logs"("depositId", "createdAt");

-- CreateIndex
CREATE INDEX "checkin_documents_bookingId_idx" ON "checkin_documents"("bookingId");

-- CreateIndex
CREATE INDEX "checkin_documents_propertyId_idx" ON "checkin_documents"("propertyId");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "notifications"("type", "createdAt");

-- CreateIndex
CREATE INDEX "system_logs_entityType_entityId_idx" ON "system_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "system_logs_action_createdAt_idx" ON "system_logs"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "missed_orders_taskId_key" ON "missed_orders"("taskId");

-- CreateIndex
CREATE INDEX "missed_orders_status_detectedAt_idx" ON "missed_orders"("status", "detectedAt");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_audit_logs" ADD CONSTRAINT "deposit_audit_logs_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "deposits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_documents" ADD CONSTRAINT "checkin_documents_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_documents" ADD CONSTRAINT "checkin_documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missed_orders" ADD CONSTRAINT "missed_orders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "cleaning_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
