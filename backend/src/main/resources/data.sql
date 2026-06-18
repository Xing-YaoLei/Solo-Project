-- H2 兼容 Mock 数据

-- 初始化门店
INSERT INTO store (id, store_name, address, manager_id) VALUES
(1, '北京朝阳旗舰店', '北京市朝阳区建国路88号', 2),
(2, '上海浦东中心店', '上海市浦东新区世纪大道1000号', NULL),
(3, '深圳南山店', '深圳市南山区科技园路66号', NULL);

-- 初始化用户（密码均为 123456 的 BCrypt 哈希，实际开发中应加密存储，这里用明文方便开发）
INSERT INTO sys_user (id, username, password, real_name, role, store_id) VALUES
(1, 'admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '系统管理员', 'STORE_MANAGER', 1),
(2, 'manager', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '张店长', 'STORE_MANAGER', 1),
(3, 'assessor1', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '李评估师', 'ASSESSOR', 1),
(4, 'assessor2', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '王评估师', 'ASSESSOR', 1),
(5, 'sales1', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '赵销售', 'SALES', 1),
(6, 'sales2', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '孙销售', 'SALES', 1),
(7, 'finance1', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '周金融', 'FINANCE_STAFF', 1),
(8, 'external1', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '外部合作方', 'EXTERNAL', NULL);

-- 初始化车源（320条模拟数据，这里创建50条代表不同阶段的车源）
INSERT INTO car_inventory (id, car_vin, plate_number, brand, model, mileage, register_date, assessor_id, status, source_library_delay, detector_missing, created_at) VALUES
(1, 'LBV5S3100FSI20001', '京A12345', '宝马', '320Li 2.0T', 35000.00, '2020-03-15', 3, 'LISTED', 0, 0, '2026-05-01 10:00:00'),
(2, 'LBV5S3100FSI20002', '京A12346', '奔驰', 'C200L 2.0T', 28000.00, '2021-05-20', 3, 'LISTED', 0, 0, '2026-05-02 09:30:00'),
(3, 'LFV3A23C4C3000003', '京A12347', '奥迪', 'A4L 40TFSI', 42000.00, '2019-08-10', 4, 'LISTED', 0, 0, '2026-05-03 14:00:00'),
(4, 'LVGBH42K0BG000004', '京A12348', '丰田', '凯美瑞 2.5G', 51000.00, '2018-11-25', 3, 'LISTED', 0, 0, '2026-05-04 11:15:00'),
(5, 'LHGCV2F40K1000005', '京A12349', '本田', '雅阁 260TURBO', 38000.00, '2020-01-08', 4, 'LISTED', 0, 0, '2026-05-05 16:40:00'),
(6, 'SVW714411ET000006', '京A12350', '大众', '帕萨特 330TSI', 45000.00, '2019-06-12', 3, 'PENDING_LISTING', 0, 0, '2026-05-06 08:20:00'),
(7, '5YJ3E1EA0JF000007', '京A12351', '特斯拉', 'Model 3 标准续航', 22000.00, '2021-09-30', 4, 'PENDING_LISTING', 0, 0, '2026-05-07 13:50:00'),
(8, 'BYD481ZQA00000008', '京A12352', '比亚迪', '汉EV 超长续航', 18000.00, '2022-02-14', 3, 'PENDING_LISTING', 0, 1, '2026-05-08 15:30:00'),
(9, 'LBV5S3100FSI20009', '京A12353', '宝马', 'X3 xDrive28i', 32000.00, '2020-07-22', 4, 'PENDING_LISTING', 0, 1, '2026-05-09 10:45:00'),
(10, 'LBV5S3100FSI20010', '京A12354', '奔驰', 'GLC 260L 4MATIC', 36000.00, '2020-04-18', 3, 'PENDING_LISTING', 1, 0, '2026-05-10 09:00:00'),
(11, 'LFV3A23C4C3000011', '京A12355', '奥迪', 'Q5L 40TFSI', 48000.00, '2019-12-01', 4, 'PENDING_LISTING', 1, 0, '2026-05-11 14:30:00'),
(12, 'LVGBH42K0BG000012', '京A12356', '丰田', '汉兰达 2.0T 四驱', 62000.00, '2018-08-08', 3, 'PENDING_LISTING', 0, 1, '2026-05-12 16:00:00'),
(13, 'LHGCV2F40K1000013', '京A12357', '本田', 'CR-V 240TURBO', 41000.00, '2020-05-15', 4, 'PENDING_LISTING', 0, 0, '2026-05-13 11:20:00'),
(14, 'SVW714411ET000014', '京A12358', '大众', '途观L 330TSI', 55000.00, '2019-03-20', 3, 'PENDING_LISTING', 0, 1, '2026-05-14 08:40:00'),
(15, '5YJ3E1EA0JF000015', '京A12359', '特斯拉', 'Model Y 长续航', 15000.00, '2022-06-01', 4, 'PENDING_LISTING', 0, 0, '2026-05-15 13:10:00'),
(16, 'BYD481ZQA00000016', '京A12360', '比亚迪', '唐DM-i 112KM', 20000.00, '2021-11-11', 3, 'PENDING_LISTING', 1, 0, '2026-05-16 15:45:00'),
(17, 'LBV5S3100FSI20017', '京A12361', '宝马', '530Li 2.0T', 29000.00, '2021-03-25', 4, 'PENDING_LISTING', 0, 0, '2026-05-17 09:20:00'),
(18, 'LBV5S3100FSI20018', '京A12362', '奔驰', 'E300L 2.0T', 33000.00, '2020-10-10', 3, 'PENDING_LISTING', 0, 1, '2026-05-18 14:00:00'),
(19, 'LFV3A23C4C3000019', '京A12363', '奥迪', 'A6L 45TFSI', 38000.00, '2020-09-05', 4, 'PENDING_LISTING', 0, 0, '2026-05-19 10:30:00'),
(20, 'LVGBH42K0BG000020', '京A12364', '丰田', '亚洲龙 2.5L 混动', 25000.00, '2021-08-20', 3, 'PENDING_LISTING', 0, 0, '2026-05-20 16:15:00'),
(21, 'LHGCV2F40K1000021', '京A12365', '本田', '英仕派 260TURBO', 27000.00, '2021-06-15', 4, 'PENDING_LISTING', 1, 0, '2026-05-21 11:45:00'),
(22, 'SVW714411ET000022', '京A12366', '大众', '迈腾 380TSI', 31000.00, '2020-12-30', 3, 'PENDING_LISTING', 0, 0, '2026-05-22 08:55:00'),
(23, '5YJ3E1EA0JF000023', '京A12367', '特斯拉', 'Model S Plaid', 12000.00, '2022-09-15', 4, 'PENDING_LISTING', 0, 0, '2026-05-23 13:40:00'),
(24, 'BYD481ZQA00000024', '京A12368', '比亚迪', '海豹 长续航版', 8000.00, '2023-01-20', 3, 'PENDING_LISTING', 0, 0, '2026-05-24 15:20:00'),
(25, 'LBV5S3100FSI20025', '京A12369', '宝马', 'X5 xDrive40i', 22000.00, '2021-04-08', 4, 'SOLD', 0, 0, '2026-05-25 09:50:00'),
(26, 'LBV5S3100FSI20026', '京A12370', '奔驰', 'S450L 3.0T', 18000.00, '2022-01-10', 3, 'SOLD', 0, 0, '2026-05-26 14:25:00'),
(27, 'LFV3A23C4C3000027', '京A12371', '奥迪', 'A8L 55TFSI', 20000.00, '2021-07-22', 4, 'PENDING_LISTING', 0, 0, '2026-05-27 11:00:00'),
(28, 'LVGBH42K0BG000028', '京A12372', '丰田', '兰德酷路泽 4.0L', 85000.00, '2018-05-30', 3, 'PENDING_LISTING', 0, 1, '2026-05-28 16:35:00'),
(29, 'LHGCV2F40K1000029', '京A12373', '本田', '奥德赛 2.0L 混动', 48000.00, '2020-02-14', 4, 'PENDING_LISTING', 1, 0, '2026-05-29 10:10:00'),
(30, 'SVW714411ET000030', '京A12374', '大众', '威然 380TSI', 35000.00, '2020-11-11', 3, 'PENDING_LISTING', 0, 0, '2026-05-30 13:25:00'),
(31, 'LBV5S3100FSI20031', '沪B88881', '宝马', '325Li M运动', 31000.00, '2020-09-18', 3, 'LISTED', 0, 0, '2026-06-01 09:00:00'),
(32, 'LBV5S3100FSI20032', '沪B88882', '奔驰', 'GLE 450 4MATIC', 16000.00, '2022-03-05', 4, 'LISTED', 0, 0, '2026-06-02 14:15:00'),
(33, 'LFV3A23C4C3000033', '沪B88883', '奥迪', 'Q7 55TFSI', 28000.00, '2021-05-12', 3, 'PENDING_LISTING', 0, 0, '2026-06-03 11:30:00'),
(34, 'LVGBH42K0BG000034', '沪B88884', '丰田', '埃尔法 3.5L', 45000.00, '2019-10-01', 4, 'PENDING_LISTING', 0, 1, '2026-06-04 15:50:00'),
(35, 'LHGCV2F40K1000035', '沪B88885', '本田', '思域 Type R', 15000.00, '2023-02-14', 3, 'PENDING_LISTING', 0, 0, '2026-06-05 08:30:00'),
(36, 'SVW714411ET000036', '粤C66661', '大众', '高尔夫 GTI', 22000.00, '2021-08-08', 4, 'LISTED', 0, 0, '2026-06-06 13:40:00'),
(37, '5YJ3E1EA0JF000037', '粤C66662', '特斯拉', 'Model X Plaid', 9000.00, '2023-04-20', 3, 'PENDING_LISTING', 0, 0, '2026-06-07 10:25:00'),
(38, 'BYD481ZQA00000038', '粤C66663', '比亚迪', '海豚 骑士版', 5000.00, '2023-08-15', 4, 'PENDING_LISTING', 1, 0, '2026-06-08 16:05:00'),
(39, 'LBV5S3100FSI20039', '粤C66664', '宝马', 'Z4 sDrive30i', 11000.00, '2022-06-30', 3, 'PENDING_LISTING', 0, 0, '2026-06-09 11:15:00'),
(40, 'LBV5S3100FSI20040', '粤C66665', '奔驰', 'AMG C63', 14000.00, '2022-11-25', 4, 'PENDING_LISTING', 0, 1, '2026-06-10 14:45:00'),
(41, 'LFV3A23C4C3000041', '浙D77771', '奥迪', 'RS5 Coupe', 10000.00, '2023-01-18', 3, 'PENDING_LISTING', 0, 0, '2026-06-11 09:35:00'),
(42, 'LVGBH42K0BG000042', '浙D77772', '丰田', 'Supra 3.0T', 6000.00, '2023-05-10', 4, 'PENDING_LISTING', 0, 0, '2026-06-12 15:20:00'),
(43, 'LHGCV2F40K1000043', '苏E55551', '本田', 'NSX 3.5T 混动', 3000.00, '2023-09-01', 3, 'PENDING_LISTING', 0, 0, '2026-06-13 10:55:00'),
(44, 'SVW714411ET000044', '苏E55552', '大众', '途锐 3.0TSI', 26000.00, '2021-02-28', 4, 'LISTED', 0, 0, '2026-06-14 08:15:00'),
(45, '5YJ3E1EA0JF000045', '川F99991', '特斯拉', 'Cybertruck', 2000.00, '2024-01-15', 3, 'PENDING_LISTING', 0, 0, '2026-06-15 13:00:00'),
(46, 'BYD481ZQA00000046', '川F99992', '比亚迪', '仰望U8', 1500.00, '2024-03-20', 4, 'PENDING_LISTING', 0, 0, '2026-06-16 11:40:00'),
(47, 'LBV5S3100FSI20047', '鲁G33331', '宝马', 'XM 50e', 4000.00, '2023-12-10', 3, 'PENDING_LISTING', 0, 1, '2026-06-17 09:10:00'),
(48, 'LBV5S3100FSI20048', '鲁G33332', '奔驰', '迈巴赫 S680', 2500.00, '2024-02-05', 4, 'PENDING_LISTING', 0, 0, '2026-06-17 14:30:00'),
(49, 'LFV3A23C4C3000049', '津H22221', '奥迪', 'Horch 创始人版', 1800.00, '2024-04-18', 3, 'PENDING_LISTING', 1, 0, '2026-06-18 10:05:00'),
(50, 'LVGBH42K0BG000050', '津H22222', '丰田', '世纪 SUV', 800.00, '2024-06-01', 4, 'PENDING_LISTING', 0, 0, '2026-06-18 16:20:00');

-- 上架漏斗阶段（为每个车源创建对应的阶段记录）
-- 阶段1: 评估 (全部50辆都已完成评估)
INSERT INTO listing_funnel (car_id, stage, completed_at, is_completed, remark) VALUES
(1, 'ASSESSMENT', '2026-05-01 12:00:00', 1, NULL),
(2, 'ASSESSMENT', '2026-05-02 11:00:00', 1, NULL),
(3, 'ASSESSMENT', '2026-05-03 16:00:00', 1, NULL),
(4, 'ASSESSMENT', '2026-05-04 13:00:00', 1, NULL),
(5, 'ASSESSMENT', '2026-05-05 18:00:00', 1, NULL),
(6, 'ASSESSMENT', '2026-05-06 10:00:00', 1, NULL),
(7, 'ASSESSMENT', '2026-05-07 15:00:00', 1, NULL),
(8, 'ASSESSMENT', '2026-05-08 17:00:00', 1, NULL),
(9, 'ASSESSMENT', '2026-05-09 12:30:00', 1, NULL),
(10, 'ASSESSMENT', '2026-05-10 11:00:00', 1, NULL),
(11, 'ASSESSMENT', '2026-05-11 16:00:00', 1, NULL),
(12, 'ASSESSMENT', '2026-05-12 17:30:00', 1, NULL),
(13, 'ASSESSMENT', '2026-05-13 13:00:00', 1, NULL),
(14, 'ASSESSMENT', '2026-05-14 10:00:00', 1, NULL),
(15, 'ASSESSMENT', '2026-05-15 15:00:00', 1, NULL),
(16, 'ASSESSMENT', '2026-05-16 17:00:00', 1, NULL),
(17, 'ASSESSMENT', '2026-05-17 11:00:00', 1, NULL),
(18, 'ASSESSMENT', '2026-05-18 16:00:00', 1, NULL),
(19, 'ASSESSMENT', '2026-05-19 12:00:00', 1, NULL),
(20, 'ASSESSMENT', '2026-05-20 18:00:00', 1, NULL),
(21, 'ASSESSMENT', '2026-05-21 13:30:00', 1, NULL),
(22, 'ASSESSMENT', '2026-05-22 10:30:00', 1, NULL),
(23, 'ASSESSMENT', '2026-05-23 15:00:00', 1, NULL),
(24, 'ASSESSMENT', '2026-05-24 17:00:00', 1, NULL),
(25, 'ASSESSMENT', '2026-05-25 11:30:00', 1, NULL),
(26, 'ASSESSMENT', '2026-05-26 16:00:00', 1, NULL),
(27, 'ASSESSMENT', '2026-05-27 13:00:00', 1, NULL),
(28, 'ASSESSMENT', '2026-05-28 18:00:00', 1, NULL),
(29, 'ASSESSMENT', '2026-05-29 12:00:00', 1, NULL),
(30, 'ASSESSMENT', '2026-05-30 15:00:00', 1, NULL),
(31, 'ASSESSMENT', '2026-06-01 11:00:00', 1, NULL),
(32, 'ASSESSMENT', '2026-06-02 16:00:00', 1, NULL),
(33, 'ASSESSMENT', '2026-06-03 13:30:00', 1, NULL),
(34, 'ASSESSMENT', '2026-06-04 17:30:00', 1, NULL),
(35, 'ASSESSMENT', '2026-06-05 10:00:00', 1, NULL),
(36, 'ASSESSMENT', '2026-06-06 15:00:00', 1, NULL),
(37, 'ASSESSMENT', '2026-06-07 12:00:00', 1, NULL),
(38, 'ASSESSMENT', '2026-06-08 17:30:00', 1, NULL),
(39, 'ASSESSMENT', '2026-06-09 13:00:00', 1, NULL),
(40, 'ASSESSMENT', '2026-06-10 16:30:00', 1, NULL),
(41, 'ASSESSMENT', '2026-06-11 11:00:00', 1, NULL),
(42, 'ASSESSMENT', '2026-06-12 17:00:00', 1, NULL),
(43, 'ASSESSMENT', '2026-06-13 12:30:00', 1, NULL),
(44, 'ASSESSMENT', '2026-06-14 10:00:00', 1, NULL),
(45, 'ASSESSMENT', '2026-06-15 15:00:00', 1, NULL),
(46, 'ASSESSMENT', '2026-06-16 13:30:00', 1, NULL),
(47, 'ASSESSMENT', '2026-06-17 11:00:00', 1, NULL),
(48, 'ASSESSMENT', '2026-06-17 16:00:00', 1, NULL),
(49, 'ASSESSMENT', '2026-06-18 12:00:00', 1, NULL),
(50, 'ASSESSMENT', '2026-06-18 18:00:00', 1, NULL);

-- 阶段2: 报价 (44辆完成报价)
INSERT INTO listing_funnel (car_id, stage, completed_at, is_completed, remark)
SELECT id, 'QUOTATION', DATEADD('DAY', 1, created_at), TRUE, NULL
FROM car_inventory WHERE id NOT IN (28, 29, 35, 38, 40, 43);

-- 阶段3: 资料收集 (37辆完成资料收集)
INSERT INTO listing_funnel (car_id, stage, completed_at, is_completed, remark)
SELECT id, 'DATA_COLLECTION', DATEADD('DAY', 3, created_at), TRUE, NULL
FROM car_inventory WHERE id IN (1,2,3,4,5,6,7,10,11,13,15,16,17,18,19,20,22,23,24,25,26,27,30,31,32,33,34,36,37,39,41,42,44,45,46,48,50);

-- 阶段4: 金融审批 (31辆通过金融审批)
INSERT INTO listing_funnel (car_id, stage, completed_at, is_completed, remark)
SELECT id, 'FINANCE_APPROVAL', DATEADD('DAY', 5, created_at), TRUE, NULL
FROM car_inventory WHERE id IN (1,2,3,4,5,6,7,10,13,15,17,18,19,20,22,23,24,25,26,30,31,32,33,36,37,39,41,42,44,46,48);

-- 阶段5: 上架成功 (26辆上架成功)
INSERT INTO listing_funnel (car_id, stage, completed_at, is_completed, remark)
SELECT id, 'LISTING_SUCCESS', DATEADD('DAY', 6, created_at), TRUE, NULL
FROM car_inventory WHERE id IN (1,2,3,4,5,25,26,31,32,36,44,6,7,13,15,17,20,22,23,24,30,33,37,39,42,46);

-- 未完成的阶段记录 (当前所在阶段)
INSERT INTO listing_funnel (car_id, stage, completed_at, is_completed, remark) VALUES
-- 停留在报价阶段的
(28, 'QUOTATION', NULL, 0, '客户报价确认中'),
(29, 'QUOTATION', NULL, 0, '价格协商中'),
(35, 'QUOTATION', NULL, 0, '等待客户反馈'),
(38, 'QUOTATION', NULL, 0, '源库数据延迟，等待同步'),
(40, 'QUOTATION', NULL, 0, '检测仪缺失，评估数据待补充'),
(43, 'QUOTATION', NULL, 0, '高端车型特殊报价流程'),
-- 停留在资料收集阶段的
(8, 'DATA_COLLECTION', NULL, 0, '登记证未上传'),
(9, 'DATA_COLLECTION', NULL, 0, '检测仪缺失，数据补录中'),
(12, 'DATA_COLLECTION', NULL, 0, '客户身份证待上传'),
(14, 'DATA_COLLECTION', NULL, 0, '银行流水缺失'),
(21, 'DATA_COLLECTION', NULL, 0, '保险单过期，需重新上传'),
(28, 'DATA_COLLECTION', NULL, 0, '行驶证待上传'),
(34, 'DATA_COLLECTION', NULL, 0, '登记证待解压'),
(38, 'DATA_COLLECTION', NULL, 0, '源库延迟导致资料不全'),
(40, 'DATA_COLLECTION', NULL, 0, '检测仪数据缺失，资料不完整'),
(45, 'DATA_COLLECTION', NULL, 0, '进口车关单待出'),
(47, 'DATA_COLLECTION', NULL, 0, '检测仪缺失，待补充检测报告'),
(49, 'DATA_COLLECTION', NULL, 0, '源库延迟，资料等待同步'),
(50, 'DATA_COLLECTION', NULL, 0, '部分金融资料待补充'),
-- 停留在金融审批阶段的
(11, 'FINANCE_APPROVAL', NULL, 0, '金融审批中，等待口径更新后的结果'),
(16, 'FINANCE_APPROVAL', NULL, 0, '源库数据延迟影响审批进度'),
(18, 'FINANCE_APPROVAL', NULL, 0, '检测报告缺失，需补充后再审'),
(27, 'FINANCE_APPROVAL', NULL, 0, '高端车需要总部审批'),
(34, 'FINANCE_APPROVAL', NULL, 0, '金融审批表口径变化，重新审核中'),
(45, 'FINANCE_APPROVAL', NULL, 0, '客户资质需补充材料'),
(48, 'FINANCE_APPROVAL', NULL, 0, '金融额度审批中'),
(50, 'FINANCE_APPROVAL', NULL, 0, '审批口径变更待确认');

-- 金融审批口径配置
INSERT INTO finance_approval_config (effective_date, approval_rate_min, approval_rate_max, remark, changed) VALUES
('2026-01-01', 0.6500, 0.8500, 'Q1 基础审批率标准', 0),
('2026-04-01', 0.6000, 0.8200, 'Q2 收紧审批标准，降低通过率', 1),
('2026-06-01', 0.7000, 0.8800, '6月政策调整，放宽审批以促进销售', 1);

-- 报价历史
INSERT INTO quotation_history (car_id, price, quoted_by, quoted_at, valid_days) VALUES
(1, 285000.00, 3, '2026-05-01 14:00:00', 7),
(1, 280000.00, 3, '2026-05-03 10:00:00', 7),
(1, 278000.00, 5, '2026-05-05 16:00:00', 14),
(2, 320000.00, 3, '2026-05-02 15:00:00', 7),
(2, 315000.00, 5, '2026-05-04 11:00:00', 14),
(3, 265000.00, 4, '2026-05-03 18:00:00', 7),
(3, 260000.00, 6, '2026-05-06 09:00:00', 14),
(4, 195000.00, 3, '2026-05-04 15:00:00', 7),
(5, 185000.00, 4, '2026-05-05 20:00:00', 7),
(6, 220000.00, 3, '2026-05-06 12:00:00', 7),
(7, 235000.00, 4, '2026-05-07 17:00:00', 7),
(8, 255000.00, 3, '2026-05-08 18:00:00', 7),
(9, 395000.00, 4, '2026-05-09 15:00:00', 7),
(10, 375000.00, 3, '2026-05-10 13:00:00', 7),
(25, 720000.00, 5, '2026-05-25 15:00:00', 7),
(26, 1080000.00, 6, '2026-05-26 18:00:00', 7),
(31, 298000.00, 3, '2026-06-01 13:00:00', 14),
(32, 780000.00, 4, '2026-06-02 18:00:00', 14),
(36, 230000.00, 3, '2026-06-06 17:00:00', 14),
(44, 560000.00, 4, '2026-06-14 12:00:00', 14);

-- 金融资料 (为部分车源创建资料记录，故意制造缺失以触发异常)
INSERT INTO finance_document (car_id, doc_type, is_missing, missing_reason, uploaded_at) VALUES
-- 已完成的车辆，资料完整
(1, 'ID_CARD', 0, NULL, '2026-05-03 10:00:00'),
(1, 'DRIVING_LICENSE', 0, NULL, '2026-05-03 10:05:00'),
(1, 'REGISTRATION_CERT', 0, NULL, '2026-05-03 10:10:00'),
(1, 'INSURANCE', 0, NULL, '2026-05-03 10:15:00'),
(1, 'BANK_STATEMENT', 0, NULL, '2026-05-03 10:20:00'),
(2, 'ID_CARD', 0, NULL, '2026-05-04 09:00:00'),
(2, 'DRIVING_LICENSE', 0, NULL, '2026-05-04 09:05:00'),
(2, 'REGISTRATION_CERT', 0, NULL, '2026-05-04 09:10:00'),
(2, 'INSURANCE', 0, NULL, '2026-05-04 09:15:00'),
(2, 'BANK_STATEMENT', 0, NULL, '2026-05-04 09:20:00'),
-- 资料收集阶段但有缺失的
(8, 'ID_CARD', 0, NULL, '2026-05-09 14:00:00'),
(8, 'DRIVING_LICENSE', 0, NULL, '2026-05-09 14:05:00'),
(8, 'REGISTRATION_CERT', 1, '车主登记证在银行抵押，等待解压', NULL),
(8, 'INSURANCE', 0, NULL, '2026-05-09 14:10:00'),
(8, 'BANK_STATEMENT', 0, NULL, '2026-05-09 14:15:00'),
(9, 'ID_CARD', 0, NULL, '2026-05-10 10:00:00'),
(9, 'DRIVING_LICENSE', 0, NULL, '2026-05-10 10:05:00'),
(9, 'REGISTRATION_CERT', 0, NULL, '2026-05-10 10:10:00'),
(9, 'INSURANCE', 1, '商业险保单即将到期，需更新', NULL),
(9, 'BANK_STATEMENT', 0, NULL, '2026-05-10 10:20:00'),
(12, 'ID_CARD', 1, '客户身份证复印件待上传', NULL),
(12, 'DRIVING_LICENSE', 0, NULL, '2026-05-13 15:00:00'),
(12, 'REGISTRATION_CERT', 0, NULL, '2026-05-13 15:05:00'),
(12, 'INSURANCE', 0, NULL, '2026-05-13 15:10:00'),
(12, 'BANK_STATEMENT', 1, '客户表示近3个月流水较少，待补充', NULL),
(14, 'ID_CARD', 0, NULL, '2026-05-15 11:00:00'),
(14, 'DRIVING_LICENSE', 0, NULL, '2026-05-15 11:05:00'),
(14, 'REGISTRATION_CERT', 0, NULL, '2026-05-15 11:10:00'),
(14, 'INSURANCE', 0, NULL, '2026-05-15 11:15:00'),
(14, 'BANK_STATEMENT', 1, '银行流水缺失，影响金融审批进度', NULL),
-- 源库延迟相关的
(38, 'ID_CARD', 1, '源库数据延迟，客户信息未同步', NULL),
(38, 'DRIVING_LICENSE', 1, '源库数据延迟，行驶证信息待同步', NULL),
(38, 'REGISTRATION_CERT', 1, '源库数据延迟，登记证待上传', NULL),
(38, 'INSURANCE', 1, '源库数据延迟，保单信息待确认', NULL),
(38, 'BANK_STATEMENT', 1, '源库数据延迟，金融资料不完整', NULL),
(49, 'ID_CARD', 0, NULL, '2026-06-18 14:00:00'),
(49, 'DRIVING_LICENSE', 1, '源库延迟，行驶证扫描件待同步', NULL),
(49, 'REGISTRATION_CERT', 1, '源库延迟，登记证待上传', NULL),
(49, 'INSURANCE', 0, NULL, '2026-06-18 14:10:00'),
(49, 'BANK_STATEMENT', 1, '源库延迟，流水信息待同步', NULL),
-- 检测仪缺失相关的
(40, 'ID_CARD', 0, NULL, '2026-06-11 10:00:00'),
(40, 'DRIVING_LICENSE', 0, NULL, '2026-06-11 10:05:00'),
(40, 'REGISTRATION_CERT', 0, NULL, '2026-06-11 10:10:00'),
(40, 'INSURANCE', 0, NULL, '2026-06-11 10:15:00'),
(40, 'BANK_STATEMENT', 1, '检测仪缺失，无法评估车辆真实价值，金融补充材料待定', NULL),
(47, 'ID_CARD', 0, NULL, '2026-06-17 14:00:00'),
(47, 'DRIVING_LICENSE', 0, NULL, '2026-06-17 14:05:00'),
(47, 'REGISTRATION_CERT', 1, '检测仪缺失，需等检测完成后同步归档', NULL),
(47, 'INSURANCE', 0, NULL, '2026-06-17 14:10:00'),
(47, 'BANK_STATEMENT', 0, NULL, '2026-06-17 14:15:00');

-- 车辆档案
INSERT INTO vehicle_archive (car_id, archive_data, is_complete, saved_at) VALUES
(1, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"4S店全程保养","interior":"9成新","paint":"原车漆占85%","tireWear":"正常","engineStatus":"良好","gearboxStatus":"正常"}', 1, '2026-05-03 16:00:00'),
(2, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"4S店保养","interior":"9成新","paint":"原车漆","tireWear":"轻微","engineStatus":"良好","gearboxStatus":"正常"}', 1, '2026-05-04 14:00:00'),
(3, '{"condition":"良好","accidentHistory":"前后保险杠喷漆","maintenanceRecords":"4S店保养","interior":"8成新","paint":"补漆2处","tireWear":"正常","engineStatus":"良好","gearboxStatus":"正常"}', 1, '2026-05-06 12:00:00'),
(4, '{"condition":"良好","accidentHistory":"无","maintenanceRecords":"常规保养","interior":"8成新","paint":"原车漆","tireWear":"正常","engineStatus":"正常","gearboxStatus":"正常"}', 1, '2026-05-07 10:00:00'),
(5, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"4S店全程","interior":"9成新","paint":"原车漆","tireWear":"轻微","engineStatus":"优秀","gearboxStatus":"正常"}', 1, '2026-05-08 15:00:00'),
(6, '{"condition":"良好","accidentHistory":"右侧轻微刮蹭","maintenanceRecords":"4S店保养","interior":"8成新","paint":"补漆1处","tireWear":"正常","engineStatus":"良好","gearboxStatus":"正常"}', 1, '2026-05-09 16:00:00'),
(7, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"官方保养","interior":"9.5成新","paint":"原车漆","tireWear":"轻微","engineStatus":"优秀","gearboxStatus":"正常"}', 1, '2026-05-10 12:00:00'),
(8, '{"condition":"良好","accidentHistory":"无","maintenanceRecords":"4S店保养","interior":"8.5成新","paint":"原车漆","tireWear":"正常","engineStatus":"待复检","gearboxStatus":"正常"}', 0, '2026-05-11 14:00:00'),
(9, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"4S店全程保养","interior":"9成新","paint":"原车漆","tireWear":"正常","engineStatus":"良好","gearboxStatus":"正常"}', 0, '2026-05-12 10:00:00'),
(10, '{"condition":"良好","accidentHistory":"无","maintenanceRecords":"部分记录缺失","interior":"8成新","paint":"原车漆","tireWear":"正常","engineStatus":"良好","gearboxStatus":"正常"}', 0, '2026-05-13 15:00:00'),
(25, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"4S店全程","interior":"9.5成新","paint":"原车漆","tireWear":"轻微","engineStatus":"优秀","gearboxStatus":"优秀"}', 1, '2026-05-27 12:00:00'),
(31, '{"condition":"优秀","accidentHistory":"无","maintenanceRecords":"4S店全程","interior":"9成新","paint":"原车漆","tireWear":"轻微","engineStatus":"良好","gearboxStatus":"正常"}', 1, '2026-06-03 14:00:00');

-- 复盘备注
INSERT INTO review_note (car_id, stage, note_content, created_by, created_at) VALUES
(8, 'DATA_COLLECTION', '登记证抵押问题已与车主沟通，预计3个工作日内解压完成', 3, '2026-05-12 10:00:00'),
(14, 'DATA_COLLECTION', '银行流水缺失问题，已建议客户提供存款证明和工资流水替代', 4, '2026-05-17 14:30:00'),
(34, 'FINANCE_APPROVAL', '6月1日金融审批口径变化，此车在旧口径下已接近通过，建议按新标准补充材料后重新提交', 7, '2026-06-05 11:00:00'),
(38, 'QUOTATION', '源库数据延迟，已通知IT部门检查同步机制，预计今日内恢复', 2, '2026-06-10 09:00:00'),
(40, 'QUOTATION', '检测仪故障导致检测数据缺失，新设备明天到位，预计后天完成补测', 3, '2026-06-12 15:00:00'),
(49, 'DATA_COLLECTION', '源库延迟持续超过24小时，已升级至技术主管处理', 2, '2026-06-19 09:30:00');

-- 数据异常标记
INSERT INTO data_anomaly (car_id, anomaly_type, description, start_date, end_date, resolved) VALUES
(10, 'LIBRARY_DELAY', '车源库数据更新延迟超过6小时，影响上架进度评估', '2026-05-10 00:00:00', '2026-05-11 08:00:00', 1),
(11, 'LIBRARY_DELAY', '源库里程数据与实际检测不符', '2026-05-11 00:00:00', '2026-05-11 16:00:00', 1),
(16, 'LIBRARY_DELAY', '车主信息更新延迟，影响金融资料匹配', '2026-05-16 00:00:00', '2026-05-17 12:00:00', 1),
(21, 'LIBRARY_DELAY', '车辆配置信息源库缺失', '2026-05-21 00:00:00', NULL, 0),
(38, 'LIBRARY_DELAY', '源库全量数据同步延迟，车源基本信息不完整', '2026-06-08 00:00:00', NULL, 0),
(49, 'LIBRARY_DELAY', '行驶证、登记证、流水信息源库均未同步', '2026-06-18 00:00:00', NULL, 0),
(8, 'DETECTOR_MISSING', '检测仪数据未上传，发动机状态待复检', '2026-05-08 00:00:00', NULL, 0),
(9, 'DETECTOR_MISSING', '检测仪电池故障，刹车系统数据缺失', '2026-05-09 00:00:00', NULL, 0),
(12, 'DETECTOR_MISSING', '检测仪与系统连接失败，评估部分数据空', '2026-05-12 00:00:00', '2026-05-13 10:00:00', 1),
(28, 'DETECTOR_MISSING', '越野车型底盘检测数据缺失', '2026-05-28 00:00:00', NULL, 0),
(40, 'DETECTOR_MISSING', 'AMG车型性能检测仪故障，性能测试未完成', '2026-06-10 00:00:00', NULL, 0),
(47, 'DETECTOR_MISSING', 'XM高端车型专用检测仪未到位', '2026-06-17 00:00:00', NULL, 0),
(11, 'FINANCE_CALIBER_CHANGE', '4月1日起审批口径收紧，此车原评估通过率需重算', '2026-04-01 00:00:00', NULL, 0),
(34, 'FINANCE_CALIBER_CHANGE', '6月1日审批口径调整，金融审批结果需二次确认', '2026-06-01 00:00:00', NULL, 0),
(50, 'FINANCE_CALIBER_CHANGE', '6月最新口径，客户资质等级重新评估中', '2026-06-01 00:00:00', NULL, 0),
(8, 'DOCUMENT_MISSING', '登记证缺失，影响资料收集进度', '2026-05-08 00:00:00', NULL, 0),
(12, 'DOCUMENT_MISSING', '客户身份证+银行流水双缺失', '2026-05-12 00:00:00', NULL, 0),
(14, 'DOCUMENT_MISSING', '银行流水缺失，金融审批无法推进', '2026-05-14 00:00:00', NULL, 0),
(38, 'DOCUMENT_MISSING', '源库延迟导致全部5项资料均未同步', '2026-06-08 00:00:00', NULL, 0),
(40, 'DOCUMENT_MISSING', '检测仪缺失导致评估资料不完整，银行流水待定', '2026-06-10 00:00:00', NULL, 0),
(49, 'DOCUMENT_MISSING', '行驶证、登记证、银行流水三项缺失', '2026-06-18 00:00:00', NULL, 0);

-- 库存周转记录
INSERT INTO inventory_turnover (car_id, days_in_inventory, turnover_stage, calculated_at) VALUES
(1, 5, 'LISTING_SUCCESS', '2026-05-06 00:00:00'),
(2, 5, 'LISTING_SUCCESS', '2026-05-07 00:00:00'),
(3, 6, 'LISTING_SUCCESS', '2026-05-09 00:00:00'),
(4, 6, 'LISTING_SUCCESS', '2026-05-10 00:00:00'),
(5, 7, 'LISTING_SUCCESS', '2026-05-12 00:00:00'),
(6, 8, 'FINANCE_APPROVAL', '2026-06-14 00:00:00'),
(7, 7, 'LISTING_SUCCESS', '2026-06-14 00:00:00'),
(8, 42, 'DATA_COLLECTION', '2026-06-19 00:00:00'),
(9, 41, 'DATA_COLLECTION', '2026-06-19 00:00:00'),
(10, 40, 'FINANCE_APPROVAL', '2026-06-19 00:00:00'),
(11, 39, 'FINANCE_APPROVAL', '2026-06-19 00:00:00'),
(12, 38, 'DATA_COLLECTION', '2026-06-19 00:00:00'),
(13, 37, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(14, 36, 'DATA_COLLECTION', '2026-06-19 00:00:00'),
(15, 35, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(16, 34, 'FINANCE_APPROVAL', '2026-06-19 00:00:00'),
(17, 33, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(18, 32, 'FINANCE_APPROVAL', '2026-06-19 00:00:00'),
(19, 31, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(20, 30, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(25, 6, 'SOLD', '2026-06-01 00:00:00'),
(26, 7, 'SOLD', '2026-06-02 00:00:00'),
(31, 18, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(32, 17, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(36, 13, 'LISTING_SUCCESS', '2026-06-19 00:00:00'),
(44, 5, 'LISTING_SUCCESS', '2026-06-19 00:00:00');
