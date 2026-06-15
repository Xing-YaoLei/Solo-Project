CREATE DATABASE IF NOT EXISTS renewal_funnel
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE renewal_funnel;

CREATE TABLE student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(64) NOT NULL,
    phone VARCHAR(20),
    parent_name VARCHAR(64),
    parent_phone VARCHAR(20),
    grade VARCHAR(20),
    school VARCHAR(128),
    source ENUM('edu_system', 'registration', 'parent_group') NOT NULL,
    source_id VARCHAR(64),
    status ENUM('active', 'graduated', 'withdrawn') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_source_ref (source, source_id)
) ENGINE=InnoDB;

CREATE TABLE course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(128) NOT NULL,
    course_type VARCHAR(64),
    total_chapters INT NOT NULL DEFAULT 0,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE enrollment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enroll_date DATE NOT NULL,
    expire_date DATE NOT NULL,
    current_chapter INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('ongoing', 'expired', 'renewed') DEFAULT 'ongoing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(id),
    FOREIGN KEY (course_id) REFERENCES course(id),
    INDEX idx_student_course (student_id, course_id)
) ENGINE=InnoDB;

CREATE TABLE renewal_funnel_stage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL,
    stage ENUM('in_course', 'near_expire', 'reminded', 'negotiating', 'renewed', 'lost') NOT NULL,
    stage_entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stage_exited_at DATETIME,
    operator VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollment(id),
    INDEX idx_enrollment_stage (enrollment_id, stage)
) ENGINE=InnoDB;

CREATE TABLE score_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL,
    score_type ENUM('exam', 'quiz', 'homework', 'overall') NOT NULL,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100.00,
    feedback_text TEXT,
    recorded_at DATE NOT NULL,
    source ENUM('edu_system', 'teacher_input', 'parent_group') NOT NULL DEFAULT 'edu_system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollment(id),
    INDEX idx_enrollment_date (enrollment_id, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE reminder_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(128) NOT NULL,
    rule_type ENUM('expire_days', 'completion_rate', 'score_drop', 'attendance') NOT NULL,
    threshold_value DECIMAL(10,2) NOT NULL,
    comparison ENUM('lt', 'gt', 'eq', 'lte', 'gte') NOT NULL DEFAULT 'lt',
    priority INT DEFAULT 5,
    is_active TINYINT(1) DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reminder_trigger_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL,
    rule_id BIGINT NOT NULL,
    triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actual_value DECIMAL(10,2),
    is_anomaly TINYINT(1) DEFAULT 0,
    remark TEXT,
    operator VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollment(id),
    FOREIGN KEY (rule_id) REFERENCES reminder_rule(id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_rule (rule_id)
) ENGINE=InnoDB;

CREATE TABLE threshold_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(128) NOT NULL,
    config_name VARCHAR(128) NOT NULL,
    config_value DECIMAL(10,2) NOT NULL,
    config_unit VARCHAR(32),
    config_group VARCHAR(64) NOT NULL DEFAULT 'default',
    description TEXT,
    updated_by VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB;

CREATE TABLE review_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_enrollments INT DEFAULT 0,
    renewed_count INT DEFAULT 0,
    lost_count INT DEFAULT 0,
    overall_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    funnel_summary JSON,
    anomaly_summary JSON,
    key_findings TEXT,
    action_items TEXT,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_by VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB;

CREATE TABLE data_import_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source ENUM('edu_system', 'registration', 'parent_group') NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    raw_count INT DEFAULT 0,
    cleaned_count INT DEFAULT 0,
    duplicate_count INT DEFAULT 0,
    mismatch_count INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    operator VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_source_batch (source, batch_id)
) ENGINE=InnoDB;

INSERT INTO threshold_config (config_key, config_name, config_value, config_unit, config_group, description) VALUES
('expire_remind_days', '到期提醒天数', 30, '天', 'reminder', '课程到期前多少天开始提醒续费'),
('near_expire_days', '即将到期天数', 14, '天', 'reminder', '课程到期前多少天标记为即将到期'),
('completion_rate_warning', '完成率预警阈值', 60.00, '%', 'progress', '完成率低于此值触发预警'),
('score_drop_threshold', '成绩下降阈值', 15.00, '%', 'score', '成绩下降超过此比例触发预警'),
('attendance_warning', '出勤率预警阈值', 70.00, '%', 'attendance', '出勤率低于此值触发预警'),
('funnel_conversion_warning', '漏斗转化率预警', 50.00, '%', 'funnel', '漏斗阶段转化率低于此值触发预警');

INSERT INTO reminder_rule (rule_name, rule_type, threshold_value, comparison, priority, is_active, description) VALUES
('到期前30天提醒', 'expire_days', 30, 'lte', 5, 1, '课程到期前30天触发首次续费提醒'),
('到期前14天加急', 'expire_days', 14, 'lte', 8, 1, '课程到期前14天触发加急续费提醒'),
('完成率过低', 'completion_rate', 60, 'lt', 7, 1, '课程完成率低于60%触发预警'),
('成绩明显下滑', 'score_drop', 15, 'gte', 6, 1, '成绩下降幅度超过15%触发预警'),
('出勤率不足', 'attendance', 70, 'lt', 6, 1, '出勤率低于70%触发预警');
