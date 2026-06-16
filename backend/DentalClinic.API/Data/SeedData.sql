-- =============================================
-- 口腔诊所会员复诊排程系统数据库初始化脚本
-- =============================================

-- 创建数据库
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DentalClinic')
BEGIN
    CREATE DATABASE DentalClinic;
END
GO

USE DentalClinic;
GO

-- =============================================
-- 示例数据
-- =============================================

-- 插入示例患者数据
SET IDENTITY_INSERT Patients ON;
GO

IF NOT EXISTS (SELECT * FROM Patients WHERE Id = 1)
BEGIN
    INSERT INTO Patients (Id, PatientNo, Name, Phone, Email, Gender, DateOfBirth, Address, MemberLevel, MedicalHistory, AllergyHistory, Remarks, CreatedAt, NoShowCount, TotalAppointments)
    VALUES 
    (1, 'P202406010001', '张伟', '13800138001', 'zhangwei@email.com', 0, '1985-03-15', '北京市朝阳区建国路88号', 2, '高血压', '青霉素过敏', 'VIP客户，需要提前预约', GETDATE(), 1, 5),
    (2, 'P202406020002', '李娜', '13900139002', 'lina@email.com', 1, '1990-07-22', '北京市海淀区中关村大街1号', 3, '糖尿病', '无', '正畸治疗中', GETDATE(), 0, 8),
    (3, 'P202406030003', '王强', '13700137003', 'wangqiang@email.com', 0, '1978-11-08', '北京市西城区金融街3号', 1, '心脏病', '磺胺类药物过敏', '种植牙患者', GETDATE(), 3, 6),
    (4, 'P202406040004', '刘芳', '13600136004', 'liufang@email.com', 1, '1995-05-30', '北京市东城区王府井大街10号', 0, '无', '无', '常规洗牙客户', GETDATE(), 0, 2),
    (5, 'P202406050005', '陈明', '13500135005', 'chenming@email.com', 0, '1982-12-10', '北京市丰台区南三环西路5号', 2, '胃炎', '无', '根管治疗中', GETDATE(), 2, 7);
END
GO

SET IDENTITY_INSERT Patients OFF;
GO

-- 插入示例治疗计划
SET IDENTITY_INSERT TreatmentPlans ON;
GO

IF NOT EXISTS (SELECT * FROM TreatmentPlans WHERE Id = 1)
BEGIN
    INSERT INTO TreatmentPlans (Id, PatientId, PlanName, Description, Status, StartDate, ExpectedEndDate, ActualEndDate, EstimatedCost, ActualCost, DoctorName, AssistantName, TotalVisits, CompletedVisits, Notes, CreatedAt)
    VALUES 
    (1, 1, '牙周治疗计划', '深度洁治+牙周刮治', 1, '2024-06-01', '2024-08-01', NULL, 8000.00, 4000.00, '张医生', '李护士', 4, 2, '需要分两次完成', GETDATE()),
    (2, 2, '正畸治疗计划', '隐形正畸治疗', 1, '2024-03-01', '2025-03-01', NULL, 35000.00, 20000.00, '王医生', '赵护士', 12, 6, '每月复诊一次', GETDATE()),
    (3, 3, '种植牙计划', '上下颌各一颗种植牙', 2, '2024-02-01', '2024-06-01', '2024-06-10', 25000.00, 24800.00, '张医生', '李护士', 6, 6, '治疗效果良好', GETDATE()),
    (4, 5, '根管治疗计划', '右下6号牙根管治疗', 1, '2024-06-10', '2024-07-10', NULL, 3500.00, 2000.00, '李医生', '王护士', 3, 2, '需要三次就诊', GETDATE());
END
GO

SET IDENTITY_INSERT TreatmentPlans OFF;
GO

-- 插入示例治疗项目
SET IDENTITY_INSERT TreatmentPlanItems ON;
GO

IF NOT EXISTS (SELECT * FROM TreatmentPlanItems WHERE Id = 1)
BEGIN
    INSERT INTO TreatmentPlanItems (Id, TreatmentPlanId, ItemName, Description, Sequence, Price, Quantity, IsCompleted, CompletedAt)
    VALUES 
    (1, 1, '口腔检查', '全面口腔检查', 1, 200.00, 1, 1, '2024-06-01'),
    (2, 1, '深度洁治', '超声波洁治+抛光', 2, 800.00, 1, 1, '2024-06-05'),
    (3, 1, '牙周刮治', '上下颌牙周刮治', 3, 3000.00, 1, 0, NULL),
    (4, 1, '复查', '牙周治疗后复查', 4, 500.00, 1, 0, NULL),
    (5, 4, '开髓引流', '根管治疗第一步', 1, 800.00, 1, 1, '2024-06-10'),
    (6, 4, '根管预备', '根管预备+消毒', 2, 1200.00, 1, 1, '2024-06-17'),
    (7, 4, '根管充填', '根管充填+暂封', 3, 1500.00, 1, 0, NULL);
END
GO

SET IDENTITY_INSERT TreatmentPlanItems OFF;
GO

-- 插入示例预约
SET IDENTITY_INSERT Appointments ON;
GO

IF NOT EXISTS (SELECT * FROM Appointments WHERE Id = 1)
BEGIN
    INSERT INTO Appointments (Id, PatientId, TreatmentPlanId, AppointmentDate, StartTime, EndTime, Subject, Description, Status, DoctorName, AssistantName, ChairNumber, RiskLevel, NoShowCount, CommunicationNotes, ReviewComments, ReminderSentAt, CreatedAt)
    VALUES 
    (1, 1, 1, '2024-06-20', '09:00:00', '10:00:00', '牙周刮治', '牙周刮治治疗（下半口）', 0, '张医生', '李护士', 'A01', 1, 1, '已电话确认，患者表示会准时到', NULL, '2024-06-19 08:30:00', GETDATE()),
    (2, 2, 2, '2024-06-20', '10:30:00', '11:30:00', '正畸复诊', '常规正畸复诊，调整弓丝', 0, '王医生', '赵护士', 'A02', 0, 0, NULL, NULL, '2024-06-19 08:35:00', GETDATE()),
    (3, 3, NULL, '2024-06-20', '14:00:00', '15:00:00', '种植牙复查', '种植牙术后一个月复查', 0, '张医生', '李护士', 'A03', 2, 3, '多次电话未接听，已发短信提醒', '高风险患者，需要重点关注', '2024-06-19 09:00:00', GETDATE()),
    (4, 5, 4, '2024-06-20', '15:30:00', '16:30:00', '根管治疗复诊', '根管治疗第三次，根管充填', 0, '李医生', '王护士', 'A01', 2, 2, '患者表示可能会迟到', NULL, '2024-06-19 09:30:00', GETDATE()),
    (5, 4, NULL, '2024-06-21', '09:30:00', '10:00:00', '常规洗牙', '常规洗牙+抛光', 0, '赵医生', '周护士', 'B01', 0, 0, NULL, NULL, NULL, GETDATE()),
    (6, 3, 3, '2024-06-18', '10:00:00', '11:00:00', '种植牙拆线', '种植牙拆线', 5, '张医生', '李护士', 'A01', 3, 3, '患者未到，电话关机', '爽约3次，考虑列入黑名单', NULL, GETDATE()),
    (7, 1, NULL, '2024-06-15', '14:00:00', '15:00:00', '口腔检查', '年度口腔检查', 3, '李医生', '王护士', 'B02', 1, 1, NULL, NULL, '2024-06-14 08:30:00', GETDATE());
END
GO

SET IDENTITY_INSERT Appointments OFF;
GO

-- 插入示例随访任务
SET IDENTITY_INSERT FollowUpTasks ON;
GO

IF NOT EXISTS (SELECT * FROM FollowUpTasks WHERE Id = 1)
BEGIN
    INSERT INTO FollowUpTasks (Id, PatientId, AppointmentId, TreatmentPlanId, Type, Status, Title, Content, Result, ScheduledDate, CompletedAt, AssignedTo, CompletedBy, Remarks, CreatedAt)
    VALUES 
    (1, 3, 6, 3, 0, 0, '爽约跟进', '患者王强6月18日种植牙拆线预约未到，需要电话联系确认原因', NULL, '2024-06-19', NULL, '前台小张', NULL, '高优先级', GETDATE()),
    (2, 1, 7, 1, 0, 2, '治疗后随访', '牙周治疗后随访，询问患者感受', '患者表示术后有轻微不适，已告知属正常现象，建议观察', '2024-06-16', '2024-06-16 14:30:00', '前台小李', '小李', '患者恢复良好', GETDATE()),
    (3, 2, NULL, 2, 2, 1, '微信提醒', '微信发送下次复诊提醒', NULL, '2024-06-21', NULL, '客服小王', NULL, '已发送消息待回复', GETDATE()),
    (4, 5, 4, 4, 0, 0, '根管治疗随访', '根管治疗后电话随访', NULL, '2024-06-22', NULL, '前台小张', NULL, NULL, GETDATE()),
    (5, 3, NULL, NULL, 0, 0, '预约确认', '确认6月20日复查预约', NULL, '2024-06-19', NULL, '前台小李', NULL, '电话未接通', GETDATE());
END
GO

SET IDENTITY_INSERT FollowUpTasks OFF;
GO

-- 插入示例收费记录
SET IDENTITY_INSERT BillingRecords ON;
GO

IF NOT EXISTS (SELECT * FROM BillingRecords WHERE Id = 1)
BEGIN
    INSERT INTO BillingRecords (Id, PatientId, AppointmentId, TreatmentPlanId, InvoiceNo, BillingDate, TotalAmount, DiscountAmount, PaidAmount, RemainingAmount, Status, PaymentMethod, Remarks, Cashier, CreatedAt)
    VALUES 
    (1, 1, 7, 1, 'INV202406150001', '2024-06-15', 800.00, 100.00, 700.00, 0.00, 2, '微信支付', '会员优惠', '张收银', GETDATE()),
    (2, 2, NULL, 2, 'INV202406010002', '2024-06-01', 5000.00, 0.00, 5000.00, 30000.00, 1, '银行卡', '首付30%', '李收银', GETDATE()),
    (3, 3, NULL, 3, 'INV202402010003', '2024-02-01', 25000.00, 200.00, 24800.00, 0.00, 2, '医保+自费', '医保报销部分', '王收银', GETDATE()),
    (4, 5, NULL, 4, 'INV202406100004', '2024-06-10', 800.00, 0.00, 800.00, 2700.00, 1, '现金', '分期付款', '张收银', GETDATE()),
    (5, 4, NULL, NULL, 'INV202405010005', '2024-05-01', 300.00, 0.00, 300.00, 0.00, 2, '支付宝', '', '李收银', GETDATE());
END
GO

SET IDENTITY_INSERT BillingRecords OFF;
GO

-- 插入示例收费项目
SET IDENTITY_INSERT BillingItems ON;
GO

IF NOT EXISTS (SELECT * FROM BillingItems WHERE Id = 1)
BEGIN
    INSERT INTO BillingItems (Id, BillingRecordId, ItemName, Description, UnitPrice, Quantity, Subtotal)
    VALUES 
    (1, 1, '口腔检查', '全面口腔检查', 200.00, 1, 200.00),
    (2, 1, '超声波洁治', '超声波洁牙+抛光', 600.00, 1, 600.00),
    (3, 4, '开髓引流', '根管治疗第一步', 800.00, 1, 800.00),
    (4, 5, '常规洗牙', '洗牙+抛光', 300.00, 1, 300.00);
END
GO

SET IDENTITY_INSERT BillingItems OFF;
GO

-- 插入示例影像附件
SET IDENTITY_INSERT ImageAttachments ON;
GO

IF NOT EXISTS (SELECT * FROM ImageAttachments WHERE Id = 1)
BEGIN
    INSERT INTO ImageAttachments (Id, PatientId, AppointmentId, TreatmentPlanId, FileName, FilePath, FileType, FileSize, Description, Category, UploadedAt, UploadedBy)
    VALUES 
    (1, 1, 7, 1, '口腔全景片.jpg', '/uploads/images/p1_001.jpg', 'image/jpeg', 2048000, '治疗前口腔全景片', '口腔全景片', '2024-06-01 10:00:00', '张医生'),
    (2, 1, NULL, 1, '牙周检查照片.jpg', '/uploads/images/p1_002.jpg', 'image/jpeg', 1536000, '牙周检查口内照片', '口内照片', '2024-06-01 10:15:00', '李护士'),
    (3, 2, NULL, 2, '头颅侧位片.jpg', '/uploads/images/p2_001.jpg', 'image/jpeg', 2560000, '正畸初诊头颅侧位片', '头颅侧位片', '2024-03-01 09:30:00', '王医生'),
    (4, 3, NULL, 3, 'CBCT影像.jpg', '/uploads/images/p3_001.jpg', 'image/jpeg', 5120000, '种植牙术前CBCT', 'CBCT', '2024-01-15 14:00:00', '张医生'),
    (5, 3, NULL, 3, '种植牙术后照片.jpg', '/uploads/images/p3_002.jpg', 'image/jpeg', 1024000, '种植牙术后口内照', '治疗后', '2024-06-10 11:00:00', '李护士'),
    (6, 5, 4, 4, '根尖片.jpg', '/uploads/images/p5_001.jpg', 'image/jpeg', 819200, '右下6号牙根尖片', '根尖片', '2024-06-10 15:00:00', '李医生');
END
GO

SET IDENTITY_INSERT ImageAttachments OFF;
GO

PRINT '示例数据插入完成！';
GO
