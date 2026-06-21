-- 二手车收购任务分派台数据库脚本
CREATE DATABASE IF NOT EXISTS used_car_acquisition DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE used_car_acquisition;

-- 1. 系统用户表
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role VARCHAR(20) NOT NULL DEFAULT 'SALES' COMMENT '角色: ADMIN-管理员, MANAGER-经理, SALES-业务员, ASSESSOR-评估师',
    phone VARCHAR(20) COMMENT '联系电话',
    status TINYINT DEFAULT 1 COMMENT '状态: 1-启用 0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 2. 车辆档案表
DROP TABLE IF EXISTS vehicle_archive;
CREATE TABLE vehicle_archive (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vin VARCHAR(17) NOT NULL UNIQUE COMMENT '车架号VIN',
    plate_no VARCHAR(20) COMMENT '车牌号',
    brand VARCHAR(50) NOT NULL COMMENT '品牌',
    series VARCHAR(50) NOT NULL COMMENT '车系',
    model VARCHAR(100) NOT NULL COMMENT '车型规格',
    color VARCHAR(20) COMMENT '车身颜色',
    register_date DATE COMMENT '上牌日期',
    mileage INT COMMENT '表显里程(公里)',
    emission_standard VARCHAR(20) COMMENT '排放标准',
    transmission VARCHAR(20) COMMENT '变速箱: 手动/自动',
    displacement DECIMAL(3,1) COMMENT '排量(L)',
    fuel_type VARCHAR(20) COMMENT '燃油类型: 汽油/柴油/混动/纯电',
    body_type VARCHAR(20) COMMENT '车身类型: 轿车/SUV/MPV等',
    drive_type VARCHAR(20) COMMENT '驱动方式',
    engine_no VARCHAR(50) COMMENT '发动机号',
    has_insurance TINYINT DEFAULT 0 COMMENT '是否有保险',
    insurance_expire DATE COMMENT '保险到期日',
    has_annual_inspection TINYINT DEFAULT 0 COMMENT '是否有年检',
    annual_inspection_expire DATE COMMENT '年检到期日',
    vehicle_usage VARCHAR(20) DEFAULT '非营运' COMMENT '车辆性质: 营运/非营运',
    owner_name VARCHAR(50) COMMENT '原车主姓名',
    owner_phone VARCHAR(20) COMMENT '原车主电话',
    owner_id_card VARCHAR(20) COMMENT '原车主身份证号',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vin (vin),
    INDEX idx_plate_no (plate_no),
    INDEX idx_brand (brand),
    INDEX idx_register_date (register_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆档案表';

-- 3. 收购任务单主表
DROP TABLE IF EXISTS acquisition_task;
CREATE TABLE acquisition_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_no VARCHAR(32) NOT NULL UNIQUE COMMENT '任务单号',
    vehicle_id BIGINT NOT NULL COMMENT '车辆档案ID',
    source_type VARCHAR(30) NOT NULL COMMENT '来源类型: WALK_IN-到店, ONLINE-线上平台, REFERRAL-转介绍, AUCTION-拍卖, OTHER-其他',
    source_detail VARCHAR(200) COMMENT '来源详情(平台名称/介绍人等)',
    customer_name VARCHAR(50) NOT NULL COMMENT '客户姓名',
    customer_phone VARCHAR(20) NOT NULL COMMENT '客户电话',
    assessor_id BIGINT COMMENT '评估师ID',
    sales_id BIGINT COMMENT '业务员ID',
    manager_id BIGINT COMMENT '跟进经理ID',
    expected_price DECIMAL(12,2) COMMENT '客户期望价(元)',
    final_price DECIMAL(12,2) COMMENT '最终成交收购价(元)',
    vehicle_status VARCHAR(30) DEFAULT 'NORMAL' COMMENT '车辆状况: NORMAL-正常, ACCIDENT-事故车, WATER-水泡车, FIRE-火烧车, MODIFIED-改装车',
    task_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT '任务状态: 
        PENDING-待录入,
        ASSESSING-评估中,
        QUOTING-报价中,
        MATERIAL_MISSING-资料缺失,
        SUPPLEMENTING-补充材料中,
        ESCALATED-升级处理中,
        APPROVING-审批中,
        DEALING-成交待入库,
        NORMAL_CLOSED-正常关闭(收购成功),
        REJECT_CLOSED-放弃关闭,
        CANCELLED-已取消',
    close_type VARCHAR(30) COMMENT '关闭类型: NORMAL-正常收购成功, REJECT-放弃, CANCEL-取消',
    close_reason VARCHAR(500) COMMENT '关闭原因/结论',
    missing_materials VARCHAR(500) COMMENT '缺失材料列表(JSON数组格式)',
    escalate_reason VARCHAR(500) COMMENT '升级处理原因',
    escalate_target_role VARCHAR(20) COMMENT '升级处理目标角色',
    inventory_days INT DEFAULT 0 COMMENT '库存天数',
    is_active TINYINT DEFAULT 1 COMMENT '是否活跃(未关闭)',
    create_by BIGINT COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    close_time DATETIME COMMENT '关闭时间',
    INDEX idx_task_no (task_no),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_task_status (task_status),
    INDEX idx_source_type (source_type),
    INDEX idx_assessor (assessor_id),
    INDEX idx_sales (sales_id),
    INDEX idx_create_time (create_time),
    INDEX idx_close_time (close_time),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收购任务单主表';

-- 4. 报价历史表
DROP TABLE IF EXISTS quote_history;
CREATE TABLE quote_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '任务单ID',
    quote_round INT NOT NULL DEFAULT 1 COMMENT '报价轮次',
    quote_type VARCHAR(20) NOT NULL COMMENT '报价类型: INITIAL-初评价, COUNTER-还价, FINAL-最终价',
    quote_price DECIMAL(12,2) NOT NULL COMMENT '报价金额(元)',
    quote_by BIGINT NOT NULL COMMENT '报价人ID',
    customer_response VARCHAR(20) COMMENT '客户回应: ACCEPT-接受, REJECT-拒绝, COUNTER-还价, PENDING-待考虑',
    customer_counter_price DECIMAL(12,2) COMMENT '客户还价金额',
    quote_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报价时间',
    remark VARCHAR(500) COMMENT '报价备注/说明',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    INDEX idx_quote_round (quote_round),
    INDEX idx_quote_time (quote_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价历史表';

-- 5. 金融资料表
DROP TABLE IF EXISTS finance_material;
CREATE TABLE finance_material (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '任务单ID',
    material_type VARCHAR(50) NOT NULL COMMENT '资料类型: 
        ID_CARD_OWNER-车主身份证,
        ID_CARD_SPOUSE-配偶身份证,
        VEHICLE_REG_CERT-车辆登记证(绿本),
        VEHICLE_LICENSE-行驶证,
        PURCHASE_INVOICE-购车发票,
        INSURANCE_POLICY-保险单,
        MAINTENANCE_RECORD-保养记录,
        VEHICLE_PHOTO-车辆照片,
        KEY_CERT-车钥匙/备用钥匙,
        LOAN_AGREEMENT-贷款合同(如有),
        OTHER-其他',
    material_name VARCHAR(100) NOT NULL COMMENT '资料名称',
    file_url VARCHAR(500) COMMENT '文件存储路径',
    file_size BIGINT COMMENT '文件大小(字节)',
    is_original TINYINT DEFAULT 0 COMMENT '是否原件: 1-是 0-复印件/电子档',
    is_verified TINYINT DEFAULT 0 COMMENT '是否已核验: 1-已核验 0-未核验',
    verify_by BIGINT COMMENT '核验人ID',
    verify_time DATETIME COMMENT '核验时间',
    is_missing TINYINT DEFAULT 0 COMMENT '是否缺失: 1-缺失 0-已提供',
    missing_remark VARCHAR(200) COMMENT '缺失说明',
    upload_by BIGINT COMMENT '上传人ID',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remark VARCHAR(200) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    INDEX idx_material_type (material_type),
    INDEX idx_is_missing (is_missing),
    INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金融资料表';

-- 6. 状态流转日志表
DROP TABLE IF EXISTS status_log;
CREATE TABLE status_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '任务单ID',
    from_status VARCHAR(30) COMMENT '原状态',
    to_status VARCHAR(30) NOT NULL COMMENT '目标状态',
    action_type VARCHAR(30) NOT NULL COMMENT '操作类型: 
        CREATE-创建任务,
        ASSESS-开始评估,
        QUOTE-发起报价,
        FLAG_MISSING-标记资料缺失,
        SUPPLEMENT-提交补充材料,
        ESCALATE-升级处理,
        APPROVE-审批,
        DEAL-确认成交,
        NORMAL_CLOSE-正常关闭,
        REJECT_CLOSE-放弃关闭,
        CANCEL-取消,
        REASSIGN-改派',
    operator_id BIGINT NOT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名(冗余)',
    target_user_id BIGINT COMMENT '改派/升级的目标用户ID',
    action_remark VARCHAR(1000) COMMENT '操作备注/原因',
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    INDEX idx_from_status (from_status),
    INDEX idx_to_status (to_status),
    INDEX idx_action_time (action_time),
    INDEX idx_operator (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='状态流转日志表';

-- 7. 库存表(任务成交后同步)
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL UNIQUE COMMENT '关联任务单ID',
    vehicle_id BIGINT NOT NULL COMMENT '车辆档案ID',
    purchase_price DECIMAL(12,2) NOT NULL COMMENT '收购价(元)',
    inbound_date DATE NOT NULL COMMENT '入库日期',
    expected_sale_price DECIMAL(12,2) COMMENT '期望销售价',
    warehouse_location VARCHAR(50) COMMENT '仓库位置',
    inventory_status VARCHAR(30) DEFAULT 'IN_STOCK' COMMENT '库存状态: IN_STOCK-在库, RESERVED-已预订, SOLD-已售出, TRANSFERRED-调拨出库',
    days_in_stock INT DEFAULT 0 COMMENT '在库天数',
    last_count_date DATE COMMENT '最近盘点日期',
    outbound_date DATE COMMENT '出库日期',
    sale_price DECIMAL(12,2) COMMENT '实际销售价',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_inventory_status (inventory_status),
    INDEX idx_inbound_date (inbound_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- ============ 初始化测试数据 ============
INSERT INTO sys_user (username, real_name, role, phone) VALUES
('admin', '系统管理员', 'ADMIN', '13800000000'),
('manager01', '王经理', 'MANAGER', '13800000001'),
('manager02', '李经理', 'MANAGER', '13800000002'),
('assessor01', '张评估', 'ASSESSOR', '13800000003'),
('assessor02', '刘评估', 'ASSESSOR', '13800000004'),
('sales01', '陈销售', 'SALES', '13800000005'),
('sales02', '赵销售', 'SALES', '13800000006'),
('sales03', '孙销售', 'SALES', '13800000007');

INSERT INTO vehicle_archive (vin, plate_no, brand, series, model, color, register_date, mileage, emission_standard, transmission, displacement, fuel_type, body_type, owner_name, owner_phone, remark) VALUES
('LBV5S3108FSI23456', '粤B12345', '宝马', '3系', '2020款 325Li M运动套装', '白色', '2020-03-15', 35000, '国VI', '自动', 2.0, '汽油', '轿车', '张三', '13900001111', '车况良好，无重大事故'),
('LFV2A21K7N3098765', '粤B67890', '大众', '帕萨特', '2019款 330TSI DSG豪华版', '黑色', '2019-08-20', 52000, '国VI', '自动', 2.0, '汽油', '轿车', '李四', '13900002222', '全程4S店保养'),
('LGBF2DE05DY123456', '粤B54321', '丰田', '凯美瑞', '2021款 2.5G 豪华版', '银色', '2021-01-10', 18000, '国VI', '自动', 2.5, '汽油', '轿车', '王五', '13900003333', '准新车，个人一手'),
('LVSHFFAL6MF654321', '粤B09876', '本田', 'CR-V', '2020款 240TURBO CVT两驱风尚版', '白色', '2020-06-25', 42000, '国VI', '自动', 1.5, '汽油', 'SUV', '赵六', '13900004444', '家用SUV，空间大'),
('LSVAU2180N2345678', '粤B13579', '奥迪', 'A4L', '2018款 40 TFSI 时尚型', '黑色', '2018-11-08', 68000, '国V', '自动', 2.0, '汽油', '轿车', '钱七', '13900005555', '有轻微剐蹭，已修复');

INSERT INTO acquisition_task (task_no, vehicle_id, source_type, source_detail, customer_name, customer_phone, assessor_id, sales_id, manager_id, expected_price, vehicle_status, task_status, create_by, create_time) VALUES
('ACQ202506001', 1, 'WALK_IN', '客户自行到店', '张三', '13900001111', 4, 6, 2, 220000.00, 'NORMAL', 'QUOTING', 6, '2025-06-10 09:30:00'),
('ACQ202506002', 2, 'ONLINE', '瓜子二手车平台', '李四', '13900002222', 5, 7, 2, 160000.00, 'NORMAL', 'MATERIAL_MISSING', 7, '2025-06-12 14:20:00'),
('ACQ202506003', 3, 'REFERRAL', '老客户王总介绍', '王五', '13900003333', 4, 6, 3, 185000.00, 'NORMAL', 'ASSESSING', 6, '2025-06-14 10:15:00'),
('ACQ202506004', 4, 'WALK_IN', '门店路过进店', '赵六', '13900004444', 5, 8, 3, 155000.00, 'ACCIDENT', 'ESCALATED', 8, '2025-06-15 11:00:00'),
('ACQ202506005', 5, 'AUCTION', '本地二手车拍卖会', '钱七', '13900005555', 4, 7, 2, 130000.00, 'NORMAL', 'NORMAL_CLOSED', 7, '2025-06-01 16:45:00');

UPDATE acquisition_task SET
    final_price = 125000.00,
    close_type = 'NORMAL',
    close_reason = '价格达成一致，资料齐全，收购成功',
    inventory_days = 15,
    is_active = 0,
    close_time = '2025-06-03 10:30:00'
WHERE task_no = 'ACQ202506005';

UPDATE acquisition_task SET
    missing_materials = '["VEHICLE_REG_CERT","PURCHASE_INVOICE","INSURANCE_POLICY"]'
WHERE task_no = 'ACQ202506002';

UPDATE acquisition_task SET
    escalate_reason = '车辆有碰撞事故，评估价格争议大，需要经理介入',
    escalate_target_role = 'MANAGER'
WHERE task_no = 'ACQ202506004';

INSERT INTO quote_history (task_id, quote_round, quote_type, quote_price, quote_by, customer_response, customer_counter_price, quote_time, remark) VALUES
(1, 1, 'INITIAL', 205000.00, 4, 'COUNTER', 215000.00, '2025-06-10 11:00:00', '初评价格，车况良好'),
(1, 2, 'COUNTER', 210000.00, 2, 'COUNTER', 213000.00, '2025-06-11 10:00:00', '经理介入，适当提价'),
(2, 1, 'INITIAL', 152000.00, 5, 'REJECT', NULL, '2025-06-12 16:00:00', '资料不齐，先做初步评估'),
(3, 1, 'INITIAL', 178000.00, 4, 'PENDING', NULL, '2025-06-14 15:00:00', '准新车，车况极佳，等客户回复'),
(4, 1, 'INITIAL', 125000.00, 5, 'REJECT', 145000.00, '2025-06-15 14:00:00', '有事故记录，价格偏低，客户不同意'),
(5, 1, 'INITIAL', 120000.00, 4, 'COUNTER', 128000.00, '2025-06-01 18:00:00', '拍卖会现场竞价'),
(5, 2, 'FINAL', 125000.00, 2, 'ACCEPT', NULL, '2025-06-02 09:30:00', '最终成交价');

INSERT INTO finance_material (task_id, material_type, material_name, is_original, is_verified, is_missing, upload_by, upload_time) VALUES
(1, 'ID_CARD_OWNER', '车主身份证', 1, 1, 0, 6, '2025-06-10 10:00:00'),
(1, 'VEHICLE_REG_CERT', '车辆登记证', 1, 1, 0, 6, '2025-06-10 10:05:00'),
(1, 'VEHICLE_LICENSE', '行驶证', 1, 1, 0, 6, '2025-06-10 10:08:00'),
(1, 'VEHICLE_PHOTO', '车辆照片(外观/内饰)', 0, 1, 0, 4, '2025-06-10 14:00:00'),
(2, 'ID_CARD_OWNER', '车主身份证', 1, 1, 0, 7, '2025-06-12 14:30:00'),
(2, 'VEHICLE_LICENSE', '行驶证', 0, 1, 0, 7, '2025-06-12 14:35:00'),
(2, 'VEHICLE_REG_CERT', '车辆登记证', 0, 0, 1, NULL, NULL),
(2, 'PURCHASE_INVOICE', '购车发票', 0, 0, 1, NULL, NULL),
(2, 'INSURANCE_POLICY', '保险单', 0, 0, 1, NULL, NULL),
(3, 'ID_CARD_OWNER', '车主身份证', 1, 1, 0, 6, '2025-06-14 10:30:00'),
(3, 'VEHICLE_REG_CERT', '车辆登记证', 1, 1, 0, 6, '2025-06-14 10:32:00'),
(3, 'VEHICLE_LICENSE', '行驶证', 1, 1, 0, 6, '2025-06-14 10:35:00'),
(3, 'MAINTENANCE_RECORD', '4S店保养记录', 0, 1, 0, 6, '2025-06-14 10:40:00'),
(5, 'ID_CARD_OWNER', '车主身份证', 1, 1, 0, 7, '2025-06-02 09:00:00'),
(5, 'VEHICLE_REG_CERT', '车辆登记证', 1, 1, 0, 7, '2025-06-02 09:05:00'),
(5, 'VEHICLE_LICENSE', '行驶证', 1, 1, 0, 7, '2025-06-02 09:10:00'),
(5, 'PURCHASE_INVOICE', '购车发票', 1, 1, 0, 7, '2025-06-02 09:15:00'),
(5, 'KEY_CERT', '车钥匙(2把)', 1, 1, 0, 7, '2025-06-02 09:20:00');

INSERT INTO status_log (task_id, from_status, to_status, action_type, operator_id, operator_name, action_remark, action_time) VALUES
(1, NULL, 'PENDING', 'CREATE', 6, '陈销售', '客户到店，创建收购任务', '2025-06-10 09:30:00'),
(1, 'PENDING', 'ASSESSING', 'ASSESS', 4, '张评估', '开始车辆评估', '2025-06-10 10:00:00'),
(1, 'ASSESSING', 'QUOTING', 'QUOTE', 4, '张评估', '完成评估，初评报价', '2025-06-10 11:00:00'),
(2, NULL, 'PENDING', 'CREATE', 7, '赵销售', '线上平台客户，创建任务', '2025-06-12 14:20:00'),
(2, 'PENDING', 'ASSESSING', 'ASSESS', 5, '刘评估', '开始评估', '2025-06-12 15:00:00'),
(2, 'ASSESSING', 'MATERIAL_MISSING', 'FLAG_MISSING', 5, '刘评估', '缺少登记证、发票、保险单', '2025-06-12 17:00:00'),
(3, NULL, 'PENDING', 'CREATE', 6, '陈销售', '老客户转介绍', '2025-06-14 10:15:00'),
(3, 'PENDING', 'ASSESSING', 'ASSESS', 4, '张评估', '开始评估', '2025-06-14 11:00:00'),
(4, NULL, 'PENDING', 'CREATE', 8, '孙销售', '路过进店客户', '2025-06-15 11:00:00'),
(4, 'PENDING', 'ASSESSING', 'ASSESS', 5, '刘评估', '开始评估，发现事故记录', '2025-06-15 12:00:00'),
(4, 'ASSESSING', 'ESCALATED', 'ESCALATE', 5, '刘评估', '事故车，价格争议大，升级给王经理', '2025-06-15 16:00:00'),
(5, NULL, 'PENDING', 'CREATE', 7, '赵销售', '拍卖会看车，创建任务', '2025-06-01 16:45:00'),
(5, 'PENDING', 'ASSESSING', 'ASSESS', 4, '张评估', '现场快速评估', '2025-06-01 17:30:00'),
(5, 'ASSESSING', 'QUOTING', 'QUOTE', 4, '张评估', '初步报价', '2025-06-01 18:00:00'),
(5, 'QUOTING', 'DEALING', 'DEAL', 2, '王经理', '客户接受最终报价', '2025-06-02 09:30:00'),
(5, 'DEALING', 'NORMAL_CLOSED', 'NORMAL_CLOSE', 2, '王经理', '资料齐全，完成收购入库', '2025-06-03 10:30:00');

INSERT INTO inventory (task_id, vehicle_id, purchase_price, inbound_date, expected_sale_price, warehouse_location, inventory_status, days_in_stock) VALUES
(5, 5, 125000.00, '2025-06-03', 145000.00, 'A区-015', 'IN_STOCK', 15);
