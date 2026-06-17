-- 初始化迁移
-- 此文件包含装修设计变更管理系统的完整数据库 schema
-- 可以通过 `prisma migrate dev` 自动生成，此处为手动创建的初始化版本

-- 创建枚举类型
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'DESIGNER', 'FOREMAN', 'SUPERVISOR');
CREATE TYPE "ChangeOrderStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'DESIGNER_APPROVED', 'OWNER_APPROVED', 'IN_PROGRESS', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "MaterialDelayStatus" AS ENUM ('REPORTED', 'CONFIRMED', 'RESCHEDULED', 'RESOLVED', 'CLOSED');
CREATE TYPE "AfterSalesStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'RESOLVED', 'CLOSED');
CREATE TYPE "AcceptanceStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'RE_INSPECTED');
CREATE TYPE "BatchOperationType" AS ENUM ('STATUS_UPDATE', 'ASSIGN', 'NOTIFY', 'EXPORT');
CREATE TYPE "LogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'COMMENT', 'ATTACH', 'BATCH_OPERATION');

-- 用户表
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 项目表
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "designerId" TEXT,
    "foremanId" TEXT,
    "supervisorId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- 设计变更单表
CREATE TABLE "DesignChangeOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT,
    "originalDesign" TEXT,
    "newDesign" TEXT,
    "impactOnSchedule" INTEGER,
    "impactOnCost" DECIMAL(12,2),
    "status" "ChangeOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "designerId" TEXT,
    "submittedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignChangeOrder_pkey" PRIMARY KEY ("id")
);

-- 变更状态日志表
CREATE TABLE "ChangeStatusLog" (
    "id" TEXT NOT NULL,
    "changeOrderId" TEXT NOT NULL,
    "oldStatus" "ChangeOrderStatus",
    "newStatus" "ChangeOrderStatus" NOT NULL,
    "remark" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeStatusLog_pkey" PRIMARY KEY ("id")
);

-- 验收照片表
CREATE TABLE "AcceptancePhoto" (
    "id" TEXT NOT NULL,
    "changeOrderId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "status" "AcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "reviewRemark" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "phase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcceptancePhoto_pkey" PRIMARY KEY ("id")
);

-- 工人签到表
CREATE TABLE "WorkerCheckin" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "checkinTime" TIMESTAMP(3) NOT NULL,
    "checkoutTime" TIMESTAMP(3),
    "location" TEXT,
    "photoUrl" TEXT,
    "remark" TEXT,
    "workType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerCheckin_pkey" PRIMARY KEY ("id")
);

-- 售后工单表
CREATE TABLE "AfterSalesTicket" (
    "id" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AfterSalesStatus" NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "reporterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfterSalesTicket_pkey" PRIMARY KEY ("id")
);

-- 材料延期表
CREATE TABLE "MaterialDelay" (
    "id" TEXT NOT NULL,
    "changeOrderId" TEXT,
    "projectId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "specification" TEXT,
    "quantity" DECIMAL(12,2),
    "originalDate" TIMESTAMP(3) NOT NULL,
    "estimatedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "delayDays" INTEGER,
    "reason" TEXT NOT NULL,
    "status" "MaterialDelayStatus" NOT NULL DEFAULT 'REPORTED',
    "impact" TEXT,
    "reportedById" TEXT NOT NULL,
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialDelay_pkey" PRIMARY KEY ("id")
);

-- 材料延期日志表
CREATE TABLE "MaterialDelayLog" (
    "id" TEXT NOT NULL,
    "materialDelayId" TEXT NOT NULL,
    "oldStatus" "MaterialDelayStatus",
    "newStatus" "MaterialDelayStatus" NOT NULL,
    "remark" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialDelayLog_pkey" PRIMARY KEY ("id")
);

-- 评论表
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "changeOrderId" TEXT,
    "ticketId" TEXT,
    "isSupplement" BOOLEAN NOT NULL DEFAULT false,
    "supplementType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- 附件表
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "changeOrderId" TEXT,
    "commentId" TEXT,
    "ticketId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- 操作日志表
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "remark" TEXT,
    "operatorId" TEXT NOT NULL,
    "batchOperationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- 批量操作表
CREATE TABLE "BatchOperation" (
    "id" TEXT NOT NULL,
    "type" "BatchOperationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "operatorId" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BatchOperation_pkey" PRIMARY KEY ("id")
);

-- 批量操作明细表
CREATE TABLE "BatchOperationItem" (
    "id" TEXT NOT NULL,
    "batchOperationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "result" TEXT,

    CONSTRAINT "BatchOperationItem_pkey" PRIMARY KEY ("id")
);

-- 项目统计表
CREATE TABLE "ProjectStat" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "totalChanges" INTEGER NOT NULL DEFAULT 0,
    "completedChanges" INTEGER NOT NULL DEFAULT 0,
    "delayedDays" INTEGER NOT NULL DEFAULT 0,
    "costIncrease" DECIMAL(12,2),
    "materialDelays" INTEGER NOT NULL DEFAULT 0,
    "afterSalesCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStat_pkey" PRIMARY KEY ("id")
);

-- 唯一索引
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "DesignChangeOrder_orderNo_key" ON "DesignChangeOrder"("orderNo");
CREATE UNIQUE INDEX "AfterSalesTicket_ticketNo_key" ON "AfterSalesTicket"("ticketNo");
CREATE UNIQUE INDEX "ProjectStat_projectId_key" ON "ProjectStat"("projectId");

-- 外键约束
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_foremanId_fkey" FOREIGN KEY ("foremanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DesignChangeOrder" ADD CONSTRAINT "DesignChangeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DesignChangeOrder" ADD CONSTRAINT "DesignChangeOrder_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DesignChangeOrder" ADD CONSTRAINT "DesignChangeOrder_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChangeStatusLog" ADD CONSTRAINT "ChangeStatusLog_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "DesignChangeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChangeStatusLog" ADD CONSTRAINT "ChangeStatusLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AcceptancePhoto" ADD CONSTRAINT "AcceptancePhoto_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "DesignChangeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcceptancePhoto" ADD CONSTRAINT "AcceptancePhoto_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcceptancePhoto" ADD CONSTRAINT "AcceptancePhoto_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkerCheckin" ADD CONSTRAINT "WorkerCheckin_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkerCheckin" ADD CONSTRAINT "WorkerCheckin_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaterialDelay" ADD CONSTRAINT "MaterialDelay_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "DesignChangeOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaterialDelay" ADD CONSTRAINT "MaterialDelay_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialDelay" ADD CONSTRAINT "MaterialDelay_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialDelay" ADD CONSTRAINT "MaterialDelay_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaterialDelayLog" ADD CONSTRAINT "MaterialDelayLog_materialDelayId_fkey" FOREIGN KEY ("materialDelayId") REFERENCES "MaterialDelay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialDelayLog" ADD CONSTRAINT "MaterialDelayLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "DesignChangeOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "AfterSalesTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "DesignChangeOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "AfterSalesTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_batchOperationId_fkey" FOREIGN KEY ("batchOperationId") REFERENCES "BatchOperation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BatchOperation" ADD CONSTRAINT "BatchOperation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BatchOperationItem" ADD CONSTRAINT "BatchOperationItem_batchOperationId_fkey" FOREIGN KEY ("batchOperationId") REFERENCES "BatchOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectStat" ADD CONSTRAINT "ProjectStat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
