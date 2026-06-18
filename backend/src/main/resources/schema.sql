-- 创建数据库
CREATE DATABASE IF NOT EXISTS secondhand_funnel DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE secondhand_funnel;

-- 门店表
CREATE TABLE IF NOT EXISTS store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL COMMENT '门店名称',
    address VARCHAR(500) COMMENT '门店地址',
    manager_id BIGINT COMMENT '店长ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_store_name (store_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店表';

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role VARCHAR(30) NOT NULL COMMENT '角色: ASSESSOR,SALES,FINANCE_STAFF,STORE_MANAGER,EXTERNAL',
    store_id BIGINT COMMENT '所属门店ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_store_id (store_id),
    FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 车源库
CREATE TABLE IF NOT EXISTS car_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_vin VARCHAR(50) NOT NULL UNIQUE COMMENT '车架号VIN',
    plate_number VARCHAR(20) COMMENT '车牌号',
    brand VARCHAR(50) NOT NULL COMMENT '品牌',
    model VARCHAR(100) NOT NULL COMMENT '车型',
    mileage DECIMAL(12,2) COMMENT '里程(公里)',
    register_date DATE COMMENT '上牌日期',
    assessor_id BIGINT COMMENT '评估师ID',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_LISTING' COMMENT '状态: PENDING_LISTING,LISTED,SOLD,DELISTED',
    source_library_delay TINYINT(1) NOT NULL DEFAULT 0 COMMENT '源库延迟标记',
    detector_missing TINYINT(1) NOT NULL DEFAULT 0 COMMENT '检测缺失标记',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_car_vin (car_vin),
    INDEX idx_status (status),
    INDEX idx_assessor_id (assessor_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (assessor_id) REFERENCES sys_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车源库';

-- 上架漏斗阶段
CREATE TABLE IF NOT EXISTS listing_funnel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    stage VARCHAR(30) NOT NULL COMMENT '阶段: ASSESSMENT,QUOTATION,DATA_COLLECTION,FINANCE_APPROVAL,LISTING_SUCCESS',
    completed_at DATETIME COMMENT '完成时间',
    is_completed TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成',
    remark VARCHAR(500) COMMENT '备注',
    INDEX idx_car_id (car_id),
    INDEX idx_stage (stage),
    INDEX idx_is_completed (is_completed),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上架漏斗阶段';

-- 金融审批口径
CREATE TABLE IF NOT EXISTS finance_approval_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    effective_date DATE NOT NULL COMMENT '生效日期',
    approval_rate_min DECIMAL(5,4) NOT NULL COMMENT '审批率下限',
    approval_rate_max DECIMAL(5,4) NOT NULL COMMENT '审批率上限',
    remark VARCHAR(500) COMMENT '备注',
    changed TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否变更',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金融审批口径';

-- 报价历史
CREATE TABLE IF NOT EXISTS quotation_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    price DECIMAL(15,2) NOT NULL COMMENT '报价金额(元)',
    quoted_by BIGINT NOT NULL COMMENT '报价人ID',
    quoted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报价时间',
    valid_days INT NOT NULL DEFAULT 7 COMMENT '报价有效期(天)',
    INDEX idx_car_id (car_id),
    INDEX idx_quoted_by (quoted_by),
    INDEX idx_quoted_at (quoted_at),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (quoted_by) REFERENCES sys_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价历史';

-- 金融资料
CREATE TABLE IF NOT EXISTS finance_document (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    doc_type VARCHAR(30) NOT NULL COMMENT '资料类型: ID_CARD,DRIVING_LICENSE,REGISTRATION_CERT,INSURANCE,BANK_STATEMENT,OTHER',
    is_missing TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否缺失',
    missing_reason VARCHAR(500) COMMENT '缺失原因',
    uploaded_at DATETIME COMMENT '上传时间',
    INDEX idx_car_id (car_id),
    INDEX idx_doc_type (doc_type),
    INDEX idx_is_missing (is_missing),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金融资料';

-- 车辆档案
CREATE TABLE IF NOT EXISTS vehicle_archive (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    archive_data JSON COMMENT '档案数据(JSON格式)',
    is_complete TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完整',
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '保存时间',
    UNIQUE KEY uk_car_id (car_id),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆档案';

-- 复盘备注
CREATE TABLE IF NOT EXISTS review_note (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    stage VARCHAR(30) COMMENT '关联阶段',
    note_content TEXT NOT NULL COMMENT '备注内容',
    created_by BIGINT NOT NULL COMMENT '创建人ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_car_id (car_id),
    INDEX idx_stage (stage),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES sys_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='复盘备注';

-- 分享链接
CREATE TABLE IF NOT EXISTS share_link (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    link_token VARCHAR(100) NOT NULL UNIQUE COMMENT '链接令牌',
    created_by BIGINT NOT NULL COMMENT '创建人ID',
    role_scope VARCHAR(255) COMMENT '角色范围(逗号分隔): ASSESSOR,SALES,FINANCE_STAFF,STORE_MANAGER',
    expire_at DATETIME NOT NULL COMMENT '过期时间',
    view_count INT NOT NULL DEFAULT 0 COMMENT '查看次数',
    include_sensitive TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否包含敏感数据',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_link_token (link_token),
    INDEX idx_created_by (created_by),
    INDEX idx_expire_at (expire_at),
    FOREIGN KEY (created_by) REFERENCES sys_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享链接';

-- 库存周转记录
CREATE TABLE IF NOT EXISTS inventory_turnover (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    days_in_inventory INT NOT NULL COMMENT '库存天数',
    turnover_stage VARCHAR(30) COMMENT '周转阶段',
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '计算时间',
    INDEX idx_car_id (car_id),
    INDEX idx_calculated_at (calculated_at),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存周转记录';

-- 数据异常标记
CREATE TABLE IF NOT EXISTS data_anomaly (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT NOT NULL COMMENT '车源ID',
    anomaly_type VARCHAR(50) NOT NULL COMMENT '异常类型: LIBRARY_DELAY,DETECTOR_MISSING,FINANCE_CALIBER_CHANGE,DOCUMENT_MISSING',
    description VARCHAR(500) COMMENT '异常描述',
    start_date DATETIME NOT NULL COMMENT '异常开始时间',
    end_date DATETIME COMMENT '异常结束时间',
    resolved TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已解决',
    INDEX idx_car_id (car_id),
    INDEX idx_anomaly_type (anomaly_type),
    INDEX idx_resolved (resolved),
    FOREIGN KEY (car_id) REFERENCES car_inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据异常标记';
