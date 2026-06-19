SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 表 t_store 门店表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_store`;
CREATE TABLE `t_store` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '门店名称',
  `address` VARCHAR(255) NOT NULL COMMENT '门店地址',
  `phone` VARCHAR(20) NOT NULL COMMENT '门店电话',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门店表';

-- --------------------------------------------------------
-- 表 t_user 用户表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码',
  `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `role` ENUM('ASSESSOR','SALES','FINANCE','MANAGER') NOT NULL COMMENT '角色：评估师/销售/财务/经理',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `store_id` BIGINT NOT NULL COMMENT '所属门店',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_role` (`role`),
  CONSTRAINT `fk_user_store` FOREIGN KEY (`store_id`) REFERENCES `t_store` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- --------------------------------------------------------
-- 表 t_vehicle 车辆表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_vehicle`;
CREATE TABLE `t_vehicle` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vin` VARCHAR(17) NOT NULL COMMENT '车架号',
  `brand` VARCHAR(50) NOT NULL COMMENT '品牌',
  `model` VARCHAR(50) NOT NULL COMMENT '车型',
  `year` INT NOT NULL COMMENT '年份',
  `color` VARCHAR(30) NOT NULL COMMENT '颜色',
  `mileage` INT NOT NULL COMMENT '里程数(公里)',
  `purchase_price` DECIMAL(12,2) NOT NULL COMMENT '收购价',
  `listing_price` DECIMAL(12,2) DEFAULT NULL COMMENT '挂牌价',
  `status` ENUM('PENDING_PREPARATION','PREPARING','PENDING_INSPECTION','INSPECTING','PENDING_LISTING','LISTED','SOLD','OFFLINE') NOT NULL DEFAULT 'PENDING_PREPARATION' COMMENT '车辆状态',
  `assessor_id` BIGINT DEFAULT NULL COMMENT '评估师ID',
  `sales_id` BIGINT DEFAULT NULL COMMENT '销售ID',
  `store_id` BIGINT NOT NULL COMMENT '所属门店',
  `purchase_date` DATE NOT NULL COMMENT '收购日期',
  `listing_date` DATE DEFAULT NULL COMMENT '上架日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vin` (`vin`),
  KEY `idx_status` (`status`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_assessor_id` (`assessor_id`),
  KEY `idx_sales_id` (`sales_id`),
  KEY `idx_brand_model` (`brand`, `model`),
  CONSTRAINT `fk_vehicle_assessor` FOREIGN KEY (`assessor_id`) REFERENCES `t_user` (`id`),
  CONSTRAINT `fk_vehicle_sales` FOREIGN KEY (`sales_id`) REFERENCES `t_user` (`id`),
  CONSTRAINT `fk_vehicle_store` FOREIGN KEY (`store_id`) REFERENCES `t_store` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆表';

-- --------------------------------------------------------
-- 表 t_preparation_checklist 整备检查项表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_preparation_checklist`;
CREATE TABLE `t_preparation_checklist` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `item_name` ENUM('washing','detailing','repair','inspection','photo_shooting') NOT NULL COMMENT '检查项名称：洗车/精洗/维修/检测/拍照',
  `status` ENUM('PENDING','IN_PROGRESS','DONE') NOT NULL DEFAULT 'PENDING' COMMENT '状态',
  `operator_id` BIGINT DEFAULT NULL COMMENT '操作人ID',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_status` (`status`),
  KEY `idx_operator_id` (`operator_id`),
  CONSTRAINT `fk_checklist_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `t_vehicle` (`id`),
  CONSTRAINT `fk_checklist_operator` FOREIGN KEY (`operator_id`) REFERENCES `t_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='整备检查项表';

-- --------------------------------------------------------
-- 表 t_test_drive_record 试驾记录表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_test_drive_record`;
CREATE TABLE `t_test_drive_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `customer_name` VARCHAR(50) NOT NULL COMMENT '客户姓名',
  `customer_phone` VARCHAR(20) NOT NULL COMMENT '客户电话',
  `drive_date` DATETIME NOT NULL COMMENT '试驾日期时间',
  `mileage_before` INT NOT NULL COMMENT '试驾前里程',
  `mileage_after` INT NOT NULL COMMENT '试驾后里程',
  `feedback` TEXT DEFAULT NULL COMMENT '客户反馈',
  `sales_id` BIGINT NOT NULL COMMENT '销售ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_drive_date` (`drive_date`),
  KEY `idx_sales_id` (`sales_id`),
  CONSTRAINT `fk_test_drive_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `t_vehicle` (`id`),
  CONSTRAINT `fk_test_drive_sales` FOREIGN KEY (`sales_id`) REFERENCES `t_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试驾记录表';

-- --------------------------------------------------------
-- 表 t_quotation_history 报价历史表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_quotation_history`;
CREATE TABLE `t_quotation_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `quotation_price` DECIMAL(12,2) NOT NULL COMMENT '报价金额',
  `quotation_type` ENUM('ONLINE','OFFLINE','CUSTOMER') NOT NULL COMMENT '报价类型：线上/线下/客户',
  `operator_id` BIGINT NOT NULL COMMENT '操作人ID',
  `customer_name` VARCHAR(50) DEFAULT NULL COMMENT '客户姓名',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_quotation_type` (`quotation_type`),
  KEY `idx_operator_id` (`operator_id`),
  CONSTRAINT `fk_quotation_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `t_vehicle` (`id`),
  CONSTRAINT `fk_quotation_operator` FOREIGN KEY (`operator_id`) REFERENCES `t_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价历史表';

-- --------------------------------------------------------
-- 表 t_finance_document 金融文档表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_finance_document`;
CREATE TABLE `t_finance_document` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `document_type` ENUM('LOAN_APPLICATION','INSURANCE','GUARANTEE','OTHER') NOT NULL COMMENT '文档类型：贷款申请/保险/质保/其他',
  `document_url` VARCHAR(500) NOT NULL COMMENT '文档地址',
  `status` ENUM('MISSING','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'MISSING' COMMENT '状态：缺失/待审/已批/已拒',
  `uploader_id` BIGINT NOT NULL COMMENT '上传人ID',
  `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_document_type` (`document_type`),
  KEY `idx_status` (`status`),
  KEY `idx_uploader_id` (`uploader_id`),
  CONSTRAINT `fk_document_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `t_vehicle` (`id`),
  CONSTRAINT `fk_document_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `t_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='金融文档表';

-- --------------------------------------------------------
-- 表 t_vehicle_archive 车辆档案表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_vehicle_archive`;
CREATE TABLE `t_vehicle_archive` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `archive_type` ENUM('STATUS_CHANGE','PRICE_ADJUST','OWNER_CHANGE','DOCUMENT_UPDATE') NOT NULL COMMENT '归档类型：状态变更/调价/过户/文档更新',
  `old_value` VARCHAR(255) DEFAULT NULL COMMENT '原值',
  `new_value` VARCHAR(255) DEFAULT NULL COMMENT '新值',
  `operator_id` BIGINT NOT NULL COMMENT '操作人ID',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_archive_type` (`archive_type`),
  KEY `idx_operator_id` (`operator_id`),
  CONSTRAINT `fk_archive_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `t_vehicle` (`id`),
  CONSTRAINT `fk_archive_operator` FOREIGN KEY (`operator_id`) REFERENCES `t_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆档案表';

-- --------------------------------------------------------
-- 表 t_todo_item 待办事项表
-- --------------------------------------------------------
DROP TABLE IF EXISTS `t_todo_item`;
CREATE TABLE `t_todo_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `todo_type` ENUM('MISSING_DOCUMENT','PREPARATION_OVERDUE','INSPECTION_OVERDUE','LISTING_REMINDER','PRICE_ADJUSTMENT') NOT NULL COMMENT '待办类型：缺件/整备超时/检测超时/上架提醒/调价',
  `status` ENUM('PENDING','PROCESSING','DONE','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT '状态',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
  `assignee_id` BIGINT NOT NULL COMMENT '指派人ID',
  `creator_id` BIGINT NOT NULL COMMENT '创建人ID',
  `due_date` DATETIME DEFAULT NULL COMMENT '截止时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_todo_type` (`todo_type`),
  KEY `idx_status` (`status`),
  KEY `idx_assignee_id` (`assignee_id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fk_todo_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `t_vehicle` (`id`),
  CONSTRAINT `fk_todo_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `t_user` (`id`),
  CONSTRAINT `fk_todo_creator` FOREIGN KEY (`creator_id`) REFERENCES `t_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办事项表';

SET FOREIGN_KEY_CHECKS = 1;
