-- ============================================================
-- 二手车门店车源上架趋势看板 - MySQL 数据库初始化脚本
-- ============================================================

CREATE DATABASE IF NOT EXISTS usedcar_dashboard
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE usedcar_dashboard;

-- ------------------------------------------------------------
-- 1. 门店表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_store`;
CREATE TABLE `t_store` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_id`       VARCHAR(64)  NOT NULL COMMENT '门店编码（业务主键）',
  `store_name`     VARCHAR(128) NOT NULL COMMENT '门店名称',
  `region`         VARCHAR(64)  DEFAULT NULL COMMENT '所在区域',
  `manager`        VARCHAR(64)  DEFAULT NULL COMMENT '门店负责人',
  `phone`          VARCHAR(32)  DEFAULT NULL COMMENT '联系电话',
  `status`         TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 1-正常 0-停用',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店表';

-- ------------------------------------------------------------
-- 2. 车辆车源明细表（车源库 - 明细追溯来源）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_vehicle_source`;
CREATE TABLE `t_vehicle_source` (
  `id`                  BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `vehicle_id`          VARCHAR(64)   NOT NULL COMMENT '车辆唯一ID',
  `store_id`            VARCHAR(64)   NOT NULL COMMENT '门店编码',
  `brand`               VARCHAR(64)   NOT NULL COMMENT '品牌',
  `model`               VARCHAR(128)  NOT NULL COMMENT '车型',
  `vehicle_condition`   VARCHAR(16)   NOT NULL DEFAULT '良好' COMMENT '车况（优秀/良好/一般/较差）',
  `source_type`         VARCHAR(32)   NOT NULL COMMENT '来源类型（inspection检测仪/finance金融审批/inventory车源库）',
  `purchase_price`      DECIMAL(12,2) DEFAULT NULL COMMENT '采购价（元）',
  `listing_price`       DECIMAL(12,2) DEFAULT NULL COMMENT '上架价（元）',
  `mileage`             INT           DEFAULT NULL COMMENT '表显里程（公里）',
  `register_date`       DATE          DEFAULT NULL COMMENT '初次登记日期',
  `listed_date`         DATETIME      DEFAULT NULL COMMENT '上架时间',
  `delisted_date`       DATETIME      DEFAULT NULL COMMENT '下架时间',
  `sold_date`           DATETIME      DEFAULT NULL COMMENT '成交时间',
  `turnover_days`       INT           DEFAULT NULL COMMENT '周转天数（从采购到售出）',
  `inspection_status`   TINYINT       NOT NULL DEFAULT 0 COMMENT '检测状态 0-未检测 1-合格 2-不合格',
  `inspection_report_id` VARCHAR(64)  DEFAULT NULL COMMENT '检测报告ID',
  `prep_status`         TINYINT       NOT NULL DEFAULT 0 COMMENT '整备状态 0-未开始 1-进行中 2-完成 3-超期',
  `finance_status`      VARCHAR(16)   DEFAULT '未提交' COMMENT '金融审批状态（未提交/审批中/已审批/已拒绝）',
  `test_drive_count`    INT           NOT NULL DEFAULT 0 COMMENT '试驾次数',
  `abnormal_count`      INT           NOT NULL DEFAULT 0 COMMENT '试驾异常次数',
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vehicle_id` (`vehicle_id`),
  KEY `idx_store_listed` (`store_id`, `listed_date`),
  KEY `idx_brand` (`brand`),
  KEY `idx_source_type` (`source_type`),
  KEY `idx_condition` (`vehicle_condition`),
  KEY `idx_turnover_days` (`turnover_days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆车源明细表';

-- ------------------------------------------------------------
-- 3. 检测报告表（接入检测仪）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_inspection_report`;
CREATE TABLE `t_inspection_report` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `report_id`        VARCHAR(64)  NOT NULL COMMENT '报告唯一ID',
  `vehicle_id`       VARCHAR(64)  NOT NULL COMMENT '关联车辆ID',
  `store_id`         VARCHAR(64)  NOT NULL COMMENT '门店编码',
  `inspector`        VARCHAR(64)  DEFAULT NULL COMMENT '检测员',
  `inspection_date`  DATETIME     NOT NULL COMMENT '检测时间',
  `overall_score`    DECIMAL(5,2) DEFAULT NULL COMMENT '综合评分（0-100）',
  `category`         VARCHAR(32)  NOT NULL COMMENT '检测结论分类（excellent/good/normal/poor/accident/flood/fire）',
  `description`      TEXT         DEFAULT NULL COMMENT '检测说明',
  `defect_count`     INT          NOT NULL DEFAULT 0 COMMENT '缺陷项数量',
  `has_accident`     TINYINT      NOT NULL DEFAULT 0 COMMENT '是否事故车',
  `has_flood`        TINYINT      NOT NULL DEFAULT 0 COMMENT '是否泡水车',
  `has_fire`         TINYINT      NOT NULL DEFAULT 0 COMMENT '是否火烧车',
  `defect_details`   JSON         DEFAULT NULL COMMENT '缺陷明细 JSON',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_id` (`report_id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_store_date` (`store_id`, `inspection_date`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检测报告表';

-- ------------------------------------------------------------
-- 4. 整备清单明细表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_prep_item`;
CREATE TABLE `t_prep_item` (
  `id`            BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `vehicle_id`    VARCHAR(64)   NOT NULL COMMENT '关联车辆ID',
  `store_id`      VARCHAR(64)   NOT NULL COMMENT '门店编码',
  `item_name`     VARCHAR(256)  NOT NULL COMMENT '整备项目名称',
  `item_category` VARCHAR(64)   DEFAULT NULL COMMENT '项目类别（钣金/喷漆/机电/美容/其他）',
  `cost`          DECIMAL(10,2) DEFAULT NULL COMMENT '整备费用',
  `start_date`    DATETIME      DEFAULT NULL COMMENT '整备开始时间',
  `end_date`      DATETIME      DEFAULT NULL COMMENT '整备完成时间',
  `expected_days` INT           DEFAULT 5 COMMENT '预期完成天数',
  `actual_days`   INT           DEFAULT NULL COMMENT '实际完成天数',
  `status`        VARCHAR(16)   NOT NULL DEFAULT 'not_started' COMMENT '状态（not_started/in_progress/completed/overdue）',
  `is_overdue`    TINYINT       NOT NULL DEFAULT 0 COMMENT '是否超期',
  `remark`        VARCHAR(512)  DEFAULT NULL COMMENT '备注',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_status` (`vehicle_id`, `status`),
  KEY `idx_store_date` (`store_id`, `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='整备清单明细表';

-- ------------------------------------------------------------
-- 5. 试驾记录表（含异常标注）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_test_drive`;
CREATE TABLE `t_test_drive` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `drive_id`       VARCHAR(64)  NOT NULL COMMENT '试驾记录ID',
  `vehicle_id`     VARCHAR(64)  NOT NULL COMMENT '关联车辆ID',
  `store_id`       VARCHAR(64)  NOT NULL COMMENT '门店编码',
  `driver_name`    VARCHAR(64)  DEFAULT NULL COMMENT '试驾人姓名',
  `driver_phone`   VARCHAR(32)  DEFAULT NULL COMMENT '试驾人电话',
  `start_time`     DATETIME     NOT NULL COMMENT '试驾开始时间',
  `end_time`       DATETIME     DEFAULT NULL COMMENT '试驾结束时间',
  `duration_min`   INT          DEFAULT NULL COMMENT '试驾时长（分钟）',
  `route_planned`  VARCHAR(256) DEFAULT NULL COMMENT '规划路线',
  `route_actual`   VARCHAR(256) DEFAULT NULL COMMENT '实际行驶路线',
  `max_speed`      INT          DEFAULT NULL COMMENT '最高车速（km/h）',
  `speed_limit`    INT          DEFAULT 80 COMMENT '路线限速（km/h）',
  `is_abnormal`    TINYINT      NOT NULL DEFAULT 0 COMMENT '是否异常',
  `anomaly_type`   VARCHAR(32)  DEFAULT NULL COMMENT '异常类型（accident_test事故试驾/overspeed超速/unauthorized_route偏移路线/long_duration超长试驾）',
  `anomaly_severity` VARCHAR(16) DEFAULT NULL COMMENT '严重程度（low/medium/high）',
  `anomaly_desc`   VARCHAR(512) DEFAULT NULL COMMENT '异常描述',
  `report_status`  VARCHAR(16)  DEFAULT 'normal' COMMENT '上报状态（normal/reported/resolved）',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drive_id` (`drive_id`),
  KEY `idx_vehicle_start` (`vehicle_id`, `start_time`),
  KEY `idx_store_date` (`store_id`, `start_time`),
  KEY `idx_is_abnormal` (`is_abnormal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试驾记录表';

-- ------------------------------------------------------------
-- 6. 金融审批表（接入金融系统）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_finance_approval`;
CREATE TABLE `t_finance_approval` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `approval_id`     VARCHAR(64)  NOT NULL COMMENT '审批单号',
  `vehicle_id`      VARCHAR(64)  NOT NULL COMMENT '关联车辆ID',
  `store_id`        VARCHAR(64)  NOT NULL COMMENT '门店编码',
  `customer_name`   VARCHAR(64)  DEFAULT NULL COMMENT '客户姓名',
  `loan_amount`     DECIMAL(12,2) DEFAULT NULL COMMENT '贷款金额（元）',
  `loan_term`       INT           DEFAULT NULL COMMENT '贷款期限（月）',
  `approver`        VARCHAR(64)  DEFAULT NULL COMMENT '审批人',
  `submit_time`     DATETIME      DEFAULT NULL COMMENT '提交时间',
  `approve_time`    DATETIME      DEFAULT NULL COMMENT '审批完成时间',
  `status`          VARCHAR(16)   NOT NULL DEFAULT '未提交' COMMENT '审批状态',
  `reject_reason`   VARCHAR(512)  DEFAULT NULL COMMENT '拒绝原因',
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_approval_id` (`approval_id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金融审批表';

-- ------------------------------------------------------------
-- 7. 筛选视图表（保存车商老板常用筛选）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_filter_view`;
CREATE TABLE `t_filter_view` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `view_id`         VARCHAR(64)  NOT NULL COMMENT '视图ID（UUID）',
  `name`            VARCHAR(128) NOT NULL COMMENT '视图名称',
  `is_default`      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否默认视图 0-否 1-是',
  `filters_json`    JSON         NOT NULL COMMENT '筛选条件JSON',
  `creator`         VARCHAR(64)  DEFAULT 'system' COMMENT '创建人',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_view_id` (`view_id`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='筛选视图表';

-- ------------------------------------------------------------
-- 8. 分享链接表（权限控制）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_share_link`;
CREATE TABLE `t_share_link` (
  `id`                         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `token`                      VARCHAR(64)  NOT NULL COMMENT '分享令牌（唯一）',
  `view_id`                    VARCHAR(64)  DEFAULT NULL COMMENT '关联的筛选视图ID',
  `filters_json`               JSON         NOT NULL COMMENT '当时保存的筛选条件',
  `permissions_json`           JSON         NOT NULL COMMENT '权限数组JSON ["view","export"]',
  `includes_turnover_metrics`  TINYINT      NOT NULL DEFAULT 1 COMMENT '是否包含库存周转口径 1-是 0-否',
  `creator`                    VARCHAR(64)  DEFAULT 'system' COMMENT '分享创建人',
  `created_at`                 DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`                 DATETIME     NOT NULL COMMENT '过期时间',
  `revoked_at`                 DATETIME     DEFAULT NULL COMMENT '撤销时间',
  `is_valid`                   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否有效 0-无效 1-有效',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_is_valid` (`is_valid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享链接表';

-- ------------------------------------------------------------
-- 9. 库存周转率日统计表（基于车源明细表的物化视图）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_inventory_daily_snapshot`;
CREATE TABLE `t_inventory_daily_snapshot` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `snapshot_date`   DATE         NOT NULL COMMENT '快照日期',
  `store_id`        VARCHAR(64)  NOT NULL COMMENT '门店编码',
  `opening_count`   INT          NOT NULL DEFAULT 0 COMMENT '期初在架数',
  `new_listed`      INT          NOT NULL DEFAULT 0 COMMENT '当日上架数',
  `delisted`        INT          NOT NULL DEFAULT 0 COMMENT '当日下架数',
  `sold_count`      INT          NOT NULL DEFAULT 0 COMMENT '当日成交数',
  `closing_count`   INT          NOT NULL DEFAULT 0 COMMENT '期末在架数',
  `avg_turnover_days` DECIMAL(8,2) DEFAULT NULL COMMENT '平均周转天数',
  `fast_moving_count` INT        NOT NULL DEFAULT 0 COMMENT '快消车辆数（≤30天）',
  `slow_moving_count` INT        NOT NULL DEFAULT 0 COMMENT '滞销车辆数（≥60天）',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date_store` (`snapshot_date`, `store_id`),
  KEY `idx_date` (`snapshot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存周转日统计表';

-- ------------------------------------------------------------
-- 10. 数据源同步状态表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_datasource_sync_log`;
CREATE TABLE `t_datasource_sync_log` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `source_name`   VARCHAR(32)  NOT NULL COMMENT '数据源名（inspection/finance/inventory）',
  `sync_time`     DATETIME     NOT NULL COMMENT '同步时间',
  `status`        VARCHAR(16)  NOT NULL COMMENT '状态（online/delayed/offline/error）',
  `record_count`  INT          DEFAULT 0 COMMENT '本次同步记录数',
  `error_message` VARCHAR(512) DEFAULT NULL COMMENT '错误信息',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_source_time` (`source_name`, `sync_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据源同步日志表';
