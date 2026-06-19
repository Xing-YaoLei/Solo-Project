SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 门店初始数据
-- --------------------------------------------------------
INSERT INTO `t_store` (`id`, `name`, `address`, `phone`) VALUES
(1, '优车达·朝阳旗舰店', '北京市朝阳区望京西路88号', '010-88886666'),
(2, '优车达·浦东中心店', '上海市浦东新区陆家嘴东路128号', '021-66668888'),
(3, '优车达·天河体验店', '广州市天河区天河路368号', '020-33335555');

-- --------------------------------------------------------
-- 用户初始数据（密码统一为 BCrypt 加密的 123456）
-- --------------------------------------------------------
INSERT INTO `t_user` (`id`, `username`, `password`, `real_name`, `role`, `phone`, `store_id`) VALUES
(1, 'manager_zhang', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张建国', 'MANAGER', '13800001111', 1),
(2, 'assessor_li',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李明轩', 'ASSESSOR', '13800002222', 1),
(3, 'sales_wang',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '王思远', 'SALES', '13800003333', 1),
(4, 'finance_zhao',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '赵晓蕾', 'FINANCE', '13800004444', 1),
(5, 'manager_chen',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '陈志豪', 'MANAGER', '13800005555', 2),
(6, 'assessor_liu',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '刘宇航', 'ASSESSOR', '13800006666', 2),
(7, 'sales_sun',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '孙婉清', 'SALES', '13800007777', 2),
(8, 'finance_zhou',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '周嘉怡', 'FINANCE', '13800008888', 2);

-- --------------------------------------------------------
-- 车辆初始数据
-- --------------------------------------------------------
INSERT INTO `t_vehicle` (`id`, `vin`, `brand`, `model`, `year`, `color`, `mileage`, `purchase_price`, `listing_price`, `status`, `assessor_id`, `sales_id`, `store_id`, `purchase_date`, `listing_date`) VALUES
(1, 'LSVAU2180N2100001', '宝马', '3系 325Li', 2022, '矿石白', 28000, 210000.00, 238000.00, 'LISTED', 2, 3, 1, '2026-05-10', '2026-05-28'),
(2, 'LFPH4ACP3KA200002', '奔驰', 'C级 C260L', 2021, '曜岩黑', 35000, 225000.00, 258000.00, 'LISTED', 2, 3, 1, '2026-05-15', '2026-06-01'),
(3, 'LVSHDFAL5GN030003', '丰田', '凯美瑞 2.5G', 2023, '珍珠白', 12000, 155000.00, NULL, 'PREPARING', 2, NULL, 1, '2026-06-05', NULL),
(4, 'LSGJA52U7GS040004', '别克', '君威 552T', 2022, '墨玉黑', 22000, 108000.00, NULL, 'PENDING_INSPECTION', 6, NULL, 2, '2026-06-01', NULL),
(5, 'WVWZZZ3CZWE050005', '大众', '迈腾 380TSI', 2021, '极地白', 42000, 132000.00, 158000.00, 'LISTED', 6, 7, 2, '2026-04-20', '2026-05-15'),
(6, 'LGBH52E07GY060006', '本田', '雅阁 260TURBO', 2023, '星曜黑', 8000, 148000.00, NULL, 'PENDING_PREPARATION', 6, NULL, 2, '2026-06-12', NULL);

-- --------------------------------------------------------
-- 整备检查项初始数据
-- --------------------------------------------------------
INSERT INTO `t_preparation_checklist` (`id`, `vehicle_id`, `item_name`, `status`, `operator_id`, `completed_at`, `remark`) VALUES
(1,  1, 'washing',         'DONE',       3,    '2026-05-12 09:30:00', '外观清洗完毕'),
(2,  1, 'detailing',      'DONE',       3,    '2026-05-12 14:00:00', '内饰精洗完成'),
(3,  1, 'inspection',     'DONE',       2,    '2026-05-13 10:00:00', '检测通过'),
(4,  1, 'photo_shooting', 'DONE',       3,    '2026-05-14 11:00:00', '360度拍照完成'),
(5,  1, 'repair',         'DONE',       3,    '2026-05-12 16:00:00', '左前门微小划痕修复'),
(6,  3, 'washing',         'IN_PROGRESS', 3,   NULL, NULL),
(7,  3, 'detailing',      'PENDING',     NULL, NULL, NULL),
(8,  3, 'inspection',     'PENDING',     NULL, NULL, NULL),
(9,  3, 'photo_shooting', 'PENDING',     NULL, NULL, NULL),
(10, 3, 'repair',         'PENDING',     NULL, NULL, NULL);

-- --------------------------------------------------------
-- 试驾记录初始数据
-- --------------------------------------------------------
INSERT INTO `t_test_drive_record` (`id`, `vehicle_id`, `customer_name`, `customer_phone`, `drive_date`, `mileage_before`, `mileage_after`, `feedback`, `sales_id`) VALUES
(1, 1, '黄先生', '13911112222', '2026-06-02 10:00:00', 28000, 28035, '动力充沛，隔音效果好，有意向购买', 3),
(2, 1, '林女士', '13922223333', '2026-06-05 14:30:00', 28035, 28068, '外观漂亮，但觉得价格偏高', 3),
(3, 5, '吴先生', '13933334444', '2026-05-28 09:00:00', 42000, 42042, '空间宽敞，性价比高，考虑中', 7);

-- --------------------------------------------------------
-- 报价历史初始数据
-- --------------------------------------------------------
INSERT INTO `t_quotation_history` (`id`, `vehicle_id`, `quotation_price`, `quotation_type`, `operator_id`, `customer_name`, `remark`) VALUES
(1, 1, 230000.00, 'ONLINE',   3, '黄先生', '之家在线评估价'),
(2, 1, 228000.00, 'OFFLINE',  2, NULL,     '车商线下评估参考价'),
(3, 1, 225000.00, 'CUSTOMER', 3, '林女士', '客户出价'),
(4, 2, 250000.00, 'ONLINE',   3, NULL,     '在线评估'),
(5, 5, 152000.00, 'CUSTOMER', 7, '吴先生', '客户出价');

-- --------------------------------------------------------
-- 金融文档初始数据
-- --------------------------------------------------------
INSERT INTO `t_finance_document` (`id`, `vehicle_id`, `document_type`, `document_url`, `status`, `uploader_id`, `reviewed_at`, `remark`) VALUES
(1, 1, 'LOAN_APPLICATION', '/docs/loan_001.pdf', 'APPROVED', 4, '2026-05-20 16:00:00', '贷款审批通过'),
(2, 1, 'INSURANCE',        '/docs/ins_001.pdf',  'APPROVED', 4, '2026-05-22 10:00:00', '商业险+交强险'),
(3, 1, 'GUARANTEE',        '/docs/guar_001.pdf', 'PENDING',  4, NULL, '质保协议待审核'),
(4, 5, 'LOAN_APPLICATION', '/docs/loan_002.pdf', 'PENDING',  8, NULL, '贷款申请待审核'),
(5, 5, 'INSURANCE',        '/docs/ins_002.pdf',  'APPROVED', 8, '2026-05-10 14:00:00', '保险齐全'),
(6, 3, 'LOAN_APPLICATION', '/docs/loan_003.pdf', 'MISSING',  4, NULL, '贷款申请尚未提交');

-- --------------------------------------------------------
-- 车辆档案初始数据
-- --------------------------------------------------------
INSERT INTO `t_vehicle_archive` (`id`, `vehicle_id`, `archive_type`, `old_value`, `new_value`, `operator_id`, `remark`) VALUES
(1, 1, 'STATUS_CHANGE', 'PENDING_PREPARATION', 'PREPARING',              2, '开始整备'),
(2, 1, 'STATUS_CHANGE', 'PREPARING',            'PENDING_INSPECTION',    2, '整备完成待检测'),
(3, 1, 'STATUS_CHANGE', 'PENDING_INSPECTION',   'INSPECTING',            2, '开始检测'),
(4, 1, 'STATUS_CHANGE', 'INSPECTING',           'PENDING_LISTING',       2, '检测通过待上架'),
(5, 1, 'STATUS_CHANGE', 'PENDING_LISTING',      'LISTED',                3, '正式上架'),
(6, 1, 'PRICE_ADJUST',  '240000.00',            '238000.00',             1, '市场调价-2000'),
(7, 3, 'STATUS_CHANGE', 'PENDING_PREPARATION',  'PREPARING',             2, '开始整备'),
(8, 5, 'STATUS_CHANGE', 'PENDING_LISTING',      'LISTED',                7, '正式上架');

-- --------------------------------------------------------
-- 待办事项初始数据
-- --------------------------------------------------------
INSERT INTO `t_todo_item` (`id`, `vehicle_id`, `todo_type`, `status`, `title`, `description`, `assignee_id`, `creator_id`, `due_date`, `completed_at`, `remark`) VALUES
(1, 3, 'PREPARATION_OVERDUE', 'PENDING',   '丰田凯美瑞整备超时提醒', '车辆已超过整备计划期限3天，请尽快处理',  2, 1, '2026-06-18 18:00:00', NULL, NULL),
(2, 3, 'MISSING_DOCUMENT',   'PENDING',   '丰田凯美瑞缺少贷款申请文档', '贷款申请尚未提交，影响后续销售流程',      4, 1, '2026-06-20 18:00:00', NULL, NULL),
(3, 4, 'INSPECTION_OVERDUE',  'PROCESSING', '别克君威检测超时提醒',   '车辆检测已逾期2天，请联系检测人员',       6, 5, '2026-06-16 18:00:00', NULL, NULL),
(4, 6, 'LISTING_REMINDER',    'PENDING',   '本田雅阁上架提醒',       '整备完成后请尽快安排上架销售',             6, 5, '2026-06-25 18:00:00', NULL, NULL),
(5, 2, 'PRICE_ADJUSTMENT',    'PENDING',   '奔驰C260L价格调整建议',  '市场同款均价下探，建议下调挂牌价',         3, 1, '2026-06-22 18:00:00', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
