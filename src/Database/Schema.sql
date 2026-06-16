-- =============================================
-- 康复中心医保结算排程台 - 数据库架构
-- SQL Server
-- =============================================

-- =============================================
-- 1. 基础枚举表
-- =============================================

CREATE TABLE [SettlementStatus] (
    [Id] INT PRIMARY KEY,
    [Name] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(200) NULL
);

INSERT INTO [SettlementStatus] ([Id], [Name], [Description]) VALUES
(1, '待录入', '单据已创建，待完善信息'),
(2, '待审核', '信息已录入，待审核人员审核'),
(3, '审核通过', '审核通过，进入处理阶段'),
(4, '审核驳回', '审核不通过，需补充材料'),
(5, '处理中', '正在进行医保结算处理'),
(6, '待复盘', '处理完成，待复盘'),
(7, '已完成', '复盘通过，流程结束'),
(8, '已关闭', '正常关闭的单据'),
(9, '医保拒付', '医保拒绝支付，进入异常处理'),
(10, '补充材料中', '拒付后补充材料阶段'),
(11, '升级处理', '拒付后升级处理阶段');

CREATE TABLE [RejectionReason] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Code] NVARCHAR(50) NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1
);

CREATE TABLE [SourceChannel] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1
);

CREATE TABLE [ReviewTag] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(100) NOT NULL,
    [Color] NVARCHAR(20) NULL,
    [Description] NVARCHAR(200) NULL
);

CREATE TABLE [DeviceStatus] (
    [Id] INT PRIMARY KEY,
    [Name] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(200) NULL
);

INSERT INTO [DeviceStatus] ([Id], [Name], [Description]) VALUES
(1, '正常', '设备运行正常'),
(2, '维护中', '设备正在维护'),
(3, '故障', '设备出现故障'),
(4, '报废', '设备已报废');

CREATE TABLE [TreatmentStatus] (
    [Id] INT PRIMARY KEY,
    [Name] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(200) NULL
);

INSERT INTO [TreatmentStatus] ([Id], [Name], [Description]) VALUES
(1, '已预约', '治疗已预约'),
(2, '进行中', '治疗正在进行'),
(3, '已完成', '治疗已完成'),
(4, '已取消', '治疗已取消'),
(5, '未到', '患者未到');

-- =============================================
-- 2. 用户与权限
-- =============================================

CREATE TABLE [User] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [UserName] NVARCHAR(50) NOT NULL UNIQUE,
    [RealName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(200) NULL,
    [Phone] NVARCHAR(20) NULL,
    [Role] NVARCHAR(50) NOT NULL,
    [Department] NVARCHAR(100) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 3. 患者信息
-- =============================================

CREATE TABLE [Patient] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [PatientNo] NVARCHAR(50) NOT NULL UNIQUE,
    [Name] NVARCHAR(100) NOT NULL,
    [Gender] NVARCHAR(10) NULL,
    [BirthDate] DATE NULL,
    [IdCardNo] NVARCHAR(30) NULL,
    [Phone] NVARCHAR(20) NULL,
    [Address] NVARCHAR(500) NULL,
    [InsuranceType] NVARCHAR(50) NULL,
    [InsuranceNo] NVARCHAR(50) NULL,
    [SourceChannelId] INT NULL FOREIGN KEY REFERENCES [SourceChannel]([Id]),
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 4. 医保结算单据
-- =============================================

CREATE TABLE [SettlementBill] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillNo] NVARCHAR(50) NOT NULL UNIQUE,
    [PatientId] INT NOT NULL FOREIGN KEY REFERENCES [Patient]([Id]),
    [StatusId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementStatus]([Id]),
    [SourceChannelId] INT NULL FOREIGN KEY REFERENCES [SourceChannel]([Id]),
    [AssigneeId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [TreatmentStartDate] DATE NULL,
    [TreatmentEndDate] DATE NULL,
    [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [InsuranceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [SelfPayAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [RejectionReasonId] INT NULL FOREIGN KEY REFERENCES [RejectionReason]([Id]),
    [RejectionRemark] NVARCHAR(500) NULL,
    [Remark] NVARCHAR(1000) NULL,
    [CreatedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [SubmittedAt] DATETIME NULL,
    [ReviewedAt] DATETIME NULL,
    [ReviewedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [ProcessedAt] DATETIME NULL,
    [ProcessedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [ReviewedFinalAt] DATETIME NULL,
    [ReviewedFinalById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [ClosedAt] DATETIME NULL,
    [ClosedById] INT NULL FOREIGN KEY REFERENCES [User]([Id])
);

CREATE TABLE [SettlementItem] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [ItemCode] NVARCHAR(50) NULL,
    [ItemName] NVARCHAR(200) NOT NULL,
    [ItemType] NVARCHAR(50) NULL,
    [Quantity] DECIMAL(18,2) NOT NULL DEFAULT 1,
    [UnitPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [TotalPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [InsuranceCoverage] DECIMAL(5,2) NULL,
    [InsuranceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [SelfPayAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Remark] NVARCHAR(500) NULL,
    [SortOrder] INT NOT NULL DEFAULT 0
);

-- =============================================
-- 5. 治疗日历
-- =============================================

CREATE TABLE [TreatmentCalendar] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [PatientId] INT NOT NULL FOREIGN KEY REFERENCES [Patient]([Id]),
    [TreatmentDate] DATE NOT NULL,
    [StartTime] TIME NULL,
    [EndTime] TIME NULL,
    [TreatmentType] NVARCHAR(100) NULL,
    [TreatmentItem] NVARCHAR(200) NULL,
    [DoctorId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [TherapistId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [StatusId] INT NOT NULL DEFAULT 1 FOREIGN KEY REFERENCES [TreatmentStatus]([Id]),
    [Duration] INT NULL,
    [Remark] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 6. 器械设备
-- =============================================

CREATE TABLE [Device] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [DeviceCode] NVARCHAR(50) NOT NULL UNIQUE,
    [DeviceName] NVARCHAR(200) NOT NULL,
    [DeviceType] NVARCHAR(100) NULL,
    [Model] NVARCHAR(100) NULL,
    [Manufacturer] NVARCHAR(200) NULL,
    [PurchaseDate] DATE NULL,
    [StatusId] INT NOT NULL DEFAULT 1 FOREIGN KEY REFERENCES [DeviceStatus]([Id]),
    [Location] NVARCHAR(200) NULL,
    [Remark] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE [DeviceUsageRecord] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [DeviceId] INT NOT NULL FOREIGN KEY REFERENCES [Device]([Id]),
    [BillId] INT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [TreatmentCalendarId] INT NULL FOREIGN KEY REFERENCES [TreatmentCalendar]([Id]),
    [PatientId] INT NULL FOREIGN KEY REFERENCES [Patient]([Id]),
    [UseDate] DATE NOT NULL,
    [StartTime] TIME NULL,
    [EndTime] TIME NULL,
    [Duration] INT NULL,
    [OperatorId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [Remark] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 7. 护理日志
-- =============================================

CREATE TABLE [NursingLog] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [PatientId] INT NOT NULL FOREIGN KEY REFERENCES [Patient]([Id]),
    [TreatmentCalendarId] INT NULL FOREIGN KEY REFERENCES [TreatmentCalendar]([Id]),
    [LogDate] DATE NOT NULL,
    [LogTime] TIME NULL,
    [NurseId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [VitalSigns] NVARCHAR(500) NULL,
    [NursingContent] NVARCHAR(1000) NULL,
    [PatientCondition] NVARCHAR(500) NULL,
    [Remark] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 8. 状态流转记录
-- =============================================

CREATE TABLE [StatusTransition] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [FromStatusId] INT NULL FOREIGN KEY REFERENCES [SettlementStatus]([Id]),
    [ToStatusId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementStatus]([Id]),
    [OperatorId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [Remark] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 9. 异常处理记录（医保拒付相关）
-- =============================================

CREATE TABLE [ExceptionRecord] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [ExceptionType] NVARCHAR(50) NOT NULL,
    [RejectionReasonId] INT NULL FOREIGN KEY REFERENCES [RejectionReason]([Id]),
    [Description] NVARCHAR(1000) NULL,
    [HandlerId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [HandleMethod] NVARCHAR(50) NULL,
    [HandleRemark] NVARCHAR(1000) NULL,
    [HandledAt] DATETIME NULL,
    [EscalatedAt] DATETIME NULL,
    [EscalatedTo] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [IsClosed] BIT NOT NULL DEFAULT 0,
    [ClosedAt] DATETIME NULL,
    [ClosedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE [SupplementMaterial] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [ExceptionRecordId] INT NOT NULL FOREIGN KEY REFERENCES [ExceptionRecord]([Id]),
    [BillId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [MaterialName] NVARCHAR(200) NOT NULL,
    [MaterialType] NVARCHAR(50) NULL,
    [FileUrl] NVARCHAR(500) NULL,
    [UploadedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [Remark] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 10. 复盘标签关联
-- =============================================

CREATE TABLE [BillReviewTag] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NOT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [ReviewTagId] INT NOT NULL FOREIGN KEY REFERENCES [ReviewTag]([Id]),
    [TaggedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [TaggedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 11. 附件
-- =============================================

CREATE TABLE [Attachment] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [BillId] INT NULL FOREIGN KEY REFERENCES [SettlementBill]([Id]),
    [TreatmentCalendarId] INT NULL FOREIGN KEY REFERENCES [TreatmentCalendar]([Id]),
    [NursingLogId] INT NULL FOREIGN KEY REFERENCES [NursingLog]([Id]),
    [FileName] NVARCHAR(200) NOT NULL,
    [FileUrl] NVARCHAR(500) NOT NULL,
    [FileType] NVARCHAR(50) NULL,
    [FileSize] BIGINT NULL,
    [UploadedById] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 12. 操作日志
-- =============================================

CREATE TABLE [AuditLog] (
    [Id] BIGINT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NULL FOREIGN KEY REFERENCES [User]([Id]),
    [Action] NVARCHAR(100) NOT NULL,
    [EntityType] NVARCHAR(100) NULL,
    [EntityId] INT NULL,
    [OldValue] NVARCHAR(MAX) NULL,
    [NewValue] NVARCHAR(MAX) NULL,
    [IpAddress] NVARCHAR(50) NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- 索引
-- =============================================

CREATE NONCLUSTERED INDEX [IX_SettlementBill_StatusId] ON [SettlementBill]([StatusId]);
CREATE NONCLUSTERED INDEX [IX_SettlementBill_PatientId] ON [SettlementBill]([PatientId]);
CREATE NONCLUSTERED INDEX [IX_SettlementBill_AssigneeId] ON [SettlementBill]([AssigneeId]);
CREATE NONCLUSTERED INDEX [IX_SettlementBill_SourceChannelId] ON [SettlementBill]([SourceChannelId]);
CREATE NONCLUSTERED INDEX [IX_SettlementBill_CreatedAt] ON [SettlementBill]([CreatedAt]);

CREATE NONCLUSTERED INDEX [IX_TreatmentCalendar_BillId] ON [TreatmentCalendar]([BillId]);
CREATE NONCLUSTERED INDEX [IX_TreatmentCalendar_PatientId] ON [TreatmentCalendar]([PatientId]);
CREATE NONCLUSTERED INDEX [IX_TreatmentCalendar_TreatmentDate] ON [TreatmentCalendar]([TreatmentDate]);

CREATE NONCLUSTERED INDEX [IX_NursingLog_BillId] ON [NursingLog]([BillId]);
CREATE NONCLUSTERED INDEX [IX_NursingLog_PatientId] ON [NursingLog]([PatientId]);
CREATE NONCLUSTERED INDEX [IX_NursingLog_LogDate] ON [NursingLog]([LogDate]);

CREATE NONCLUSTERED INDEX [IX_DeviceUsageRecord_DeviceId] ON [DeviceUsageRecord]([DeviceId]);
CREATE NONCLUSTERED INDEX [IX_DeviceUsageRecord_BillId] ON [DeviceUsageRecord]([BillId]);

CREATE NONCLUSTERED INDEX [IX_StatusTransition_BillId] ON [StatusTransition]([BillId]);
CREATE NONCLUSTERED INDEX [IX_StatusTransition_CreatedAt] ON [StatusTransition]([CreatedAt]);

CREATE NONCLUSTERED INDEX [IX_ExceptionRecord_BillId] ON [ExceptionRecord]([BillId]);
CREATE NONCLUSTERED INDEX [IX_ExceptionRecord_IsClosed] ON [ExceptionRecord]([IsClosed]);

CREATE NONCLUSTERED INDEX [IX_BillReviewTag_BillId] ON [BillReviewTag]([BillId]);
CREATE NONCLUSTERED INDEX [IX_BillReviewTag_ReviewTagId] ON [BillReviewTag]([ReviewTagId]);
