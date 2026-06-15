-- 青少年培训续费跟进风险监测系统 - 数据库初始化脚本

CREATE DATABASE IF NOT EXISTS training_renewal
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE training_renewal;

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(32) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    real_name VARCHAR(64) NOT NULL,
    role VARCHAR(16),
    department VARCHAR(32),
    phone VARCHAR(32),
    email VARCHAR(64),
    status VARCHAR(16) DEFAULT 'ACTIVE',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 导入批次表
CREATE TABLE IF NOT EXISTS import_batch (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    batch_id VARCHAR(32) NOT NULL UNIQUE,
    batch_type VARCHAR(32) NOT NULL,
    batch_name VARCHAR(128) NOT NULL,
    batch_time DATETIME NOT NULL,
    total_count INT,
    success_count INT,
    fail_count INT,
    operator_id VARCHAR(32),
    operator_name VARCHAR(64),
    remark VARCHAR(512),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(16),
    expected_sync_time DATETIME,
    actual_sync_time DATETIME,
    is_delayed TINYINT(1) DEFAULT 0,
    INDEX idx_batch_type (batch_type),
    INDEX idx_batch_time (batch_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 学生报名表
CREATE TABLE IF NOT EXISTS student_enrollment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    batch_id VARCHAR(32) NOT NULL,
    student_no VARCHAR(32) NOT NULL UNIQUE,
    student_name VARCHAR(64) NOT NULL,
    grade VARCHAR(32),
    course_name VARCHAR(64),
    course_tag VARCHAR(32),
    enroll_date DATE,
    expire_date DATE,
    total_fee DECIMAL(10,2),
    paid_fee DECIMAL(10,2),
    consultant_id VARCHAR(32),
    consultant_name VARCHAR(64),
    completion_rate DECIMAL(5,2),
    renewal_status VARCHAR(16),
    remark VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_source VARCHAR(64),
    source_sync_time DATETIME,
    INDEX idx_batch_id (batch_id),
    INDEX idx_student_no (student_no),
    INDEX idx_grade (grade),
    INDEX idx_course_tag (course_tag),
    INDEX idx_consultant_id (consultant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 教务系统成绩表
CREATE TABLE IF NOT EXISTS academic_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    batch_id VARCHAR(32) NOT NULL,
    student_no VARCHAR(32) NOT NULL,
    course_name VARCHAR(64),
    course_tag VARCHAR(32),
    exam_date DATE,
    exam_name VARCHAR(64),
    score DECIMAL(5,2),
    class_rank DECIMAL(5,2),
    grade_rank DECIMAL(5,2),
    progress_rate DECIMAL(5,2),
    teacher_comment VARCHAR(255),
    level VARCHAR(16),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(64),
    INDEX idx_student_no (student_no),
    INDEX idx_batch_id (batch_id),
    INDEX idx_exam_date (exam_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家长群反馈表
CREATE TABLE IF NOT EXISTS parent_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    batch_id VARCHAR(32) NOT NULL,
    student_no VARCHAR(32),
    parent_name VARCHAR(64),
    feedback_type VARCHAR(16),
    feedback_channel VARCHAR(32),
    content TEXT,
    sentiment VARCHAR(16),
    score INT,
    feedback_time DATETIME,
    handler_id VARCHAR(64),
    handler_name VARCHAR(64),
    handle_status VARCHAR(16),
    handle_result TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_no (student_no),
    INDEX idx_batch_id (batch_id),
    INDEX idx_feedback_time (feedback_time),
    INDEX idx_feedback_type (feedback_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 进度注释表
CREATE TABLE IF NOT EXISTS progress_comment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_no VARCHAR(32) NOT NULL,
    student_name VARCHAR(64),
    consultant_id VARCHAR(32),
    consultant_name VARCHAR(64),
    comment_type VARCHAR(32),
    content TEXT,
    risk_level VARCHAR(16),
    follow_up_plan VARCHAR(64),
    follow_up_time DATETIME,
    status VARCHAR(16),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_no (student_no),
    INDEX idx_consultant_id (consultant_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 提醒规则表
CREATE TABLE IF NOT EXISTS reminder_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(64) NOT NULL,
    rule_type VARCHAR(32),
    rule_condition TEXT,
    rule_action TEXT,
    trigger_days_before INT,
    progress_threshold DECIMAL(5,2),
    score_threshold DECIMAL(5,2),
    reminder_level VARCHAR(16),
    status VARCHAR(16),
    sort_order INT,
    version VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    operator_id VARCHAR(32),
    operator_name VARCHAR(64),
    change_reason VARCHAR(512),
    INDEX idx_rule_type (rule_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入初始用户数据
INSERT INTO sys_user (username, password, real_name, role, department, phone, status) VALUES
('admin', 'admin123', '系统管理员', 'MANAGER', '管理部', '13800000000', 'ACTIVE'),
('manager1', '123456', '李总监', 'MANAGER', '教学部', '13800000001', 'ACTIVE'),
('teacher1', '123456', '张老师', 'CONSULTANT', '教学部', '13800000002', 'ACTIVE'),
('teacher2', '123456', '李老师', 'CONSULTANT', '教学部', '13800000003', 'ACTIVE'),
('teacher3', '123456', '王老师', 'CONSULTANT', '教学部', '13800000004', 'ACTIVE');

-- 插入初始提醒规则
INSERT INTO reminder_rule (rule_name, rule_type, rule_condition, rule_action, trigger_days_before, progress_threshold, score_threshold, reminder_level, status, sort_order, version, operator_id, operator_name, change_reason) VALUES
('到期前30天提醒', 'RENEWAL', '距离课程到期30天', '发送续费提醒短信和微信通知', 30, NULL, NULL, 'MEDIUM', 'ACTIVE', 10, 'v1.0.0', 'admin', '系统管理员', '初始规则'),
('到期前7天加急提醒', 'RENEWAL', '距离课程到期7天', '电话跟进 + 班主任沟通', 7, NULL, NULL, 'HIGH', 'ACTIVE', 5, 'v1.0.0', 'admin', '系统管理员', '初始规则'),
('进度低于60%预警', 'PROGRESS', '学生完成率低于60%', '自动通知咨询师跟进', NULL, 60.00, NULL, 'MEDIUM', 'ACTIVE', 20, 'v1.0.0', 'admin', '系统管理员', '初始规则'),
('成绩下滑提醒', 'SCORE', '连续两次考试成绩下降超过10分', '安排学习分析会', NULL, NULL, 70.00, 'MEDIUM', 'ACTIVE', 15, 'v1.0.0', 'admin', '系统管理员', '初始规则'),
('家长负面反馈跟进', 'FEEDBACK', '家长反馈情绪为负面', '自动创建跟进工单，24小时内响应', NULL, NULL, NULL, 'HIGH', 'ACTIVE', 8, 'v1.0.0', 'admin', '系统管理员', '初始规则');
