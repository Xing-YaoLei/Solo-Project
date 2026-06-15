-- 学期表
CREATE TABLE IF NOT EXISTS academic_term (
    term_id VARCHAR(50) PRIMARY KEY,
    term_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

-- 院系表
CREATE TABLE IF NOT EXISTS department (
    dept_id VARCHAR(50) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    dept_code VARCHAR(50) NOT NULL,
    parent_dept_id VARCHAR(50)
);

-- 课程表
CREATE TABLE IF NOT EXISTS course (
    course_id VARCHAR(50) PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    dept_id VARCHAR(50) NOT NULL,
    grade VARCHAR(20),
    major VARCHAR(100),
    student_count INTEGER DEFAULT 0,
    course_type VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_course_dept ON course(dept_id);
CREATE INDEX IF NOT EXISTS idx_course_grade ON course(grade);

-- 教材订购表
CREATE TABLE IF NOT EXISTS textbook_order (
    order_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    term_id VARCHAR(50) NOT NULL,
    textbook_isbn VARCHAR(20),
    textbook_name VARCHAR(200) NOT NULL,
    publisher VARCHAR(100),
    price DECIMAL(10, 2),
    quantity INTEGER NOT NULL DEFAULT 0,
    order_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(50) NOT NULL,
    version_id INTEGER,
    PRIMARY KEY (order_id, data_source)
);

CREATE INDEX IF NOT EXISTS idx_order_course ON textbook_order(course_id);
CREATE INDEX IF NOT EXISTS idx_order_term ON textbook_order(term_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON textbook_order(order_status);

-- 学生表
CREATE TABLE IF NOT EXISTS student (
    student_id VARCHAR(50) PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    dept_id VARCHAR(50) NOT NULL,
    grade VARCHAR(20),
    major VARCHAR(100),
    class_name VARCHAR(50)
);

-- 一卡通消费记录
CREATE TABLE IF NOT EXISTS campus_card_record (
    record_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50),
    trans_time TIMESTAMP NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    trans_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_student ON campus_card_record(student_id);
CREATE INDEX IF NOT EXISTS idx_card_time ON campus_card_record(trans_time);

-- 学生申请表
CREATE TABLE IF NOT EXISTS student_application (
    application_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50),
    application_type VARCHAR(50) NOT NULL,
    submit_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    approval_opinion TEXT
);

-- 审批记录表
CREATE TABLE IF NOT EXISTS approval_record (
    approval_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    approval_step INTEGER NOT NULL,
    approver VARCHAR(100) NOT NULL,
    approval_time TIMESTAMP,
    approval_result VARCHAR(20),
    opinion TEXT
);

CREATE INDEX IF NOT EXISTS idx_approval_order ON approval_record(order_id);

-- 数据版本表
CREATE TABLE IF NOT EXISTS data_version (
    version_id INTEGER PRIMARY KEY,
    data_source VARCHAR(50) NOT NULL,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    record_count INTEGER NOT NULL DEFAULT 0
);

-- 数据差异表
CREATE TABLE IF NOT EXISTS data_diff (
    diff_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    source_a VARCHAR(50) NOT NULL,
    source_b VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    value_a TEXT,
    value_b TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_diff_order ON data_diff(order_id);

-- 数据缺口表
CREATE TABLE IF NOT EXISTS data_gap (
    gap_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    gap_type VARCHAR(50) NOT NULL,
    missing_field VARCHAR(100),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    suggested_action TEXT,
    responsible_person VARCHAR(100),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'open'
);

CREATE INDEX IF NOT EXISTS idx_gap_order ON data_gap(order_id);
CREATE INDEX IF NOT EXISTS idx_gap_severity ON data_gap(severity);

-- 教室资源表
CREATE TABLE IF NOT EXISTS classroom (
    classroom_id VARCHAR(50) PRIMARY KEY,
    building VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    equipment TEXT,
    building_type VARCHAR(50)
);

-- 课程排课表
CREATE TABLE IF NOT EXISTS course_schedule (
    schedule_id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    classroom_id VARCHAR(50) NOT NULL,
    day_of_week INTEGER NOT NULL,
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,
    weeks VARCHAR(100)
);

-- 评教表
CREATE TABLE IF NOT EXISTS teaching_evaluation (
    eval_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    score DECIMAL(5, 2),
    comment TEXT,
    eval_time TIMESTAMP,
    is_submitted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_eval_course ON teaching_evaluation(course_id);
CREATE INDEX IF NOT EXISTS idx_eval_student ON teaching_evaluation(student_id);

-- 数据源表
CREATE TABLE IF NOT EXISTS data_source (
    source_id VARCHAR(50) PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    connection_info TEXT,
    is_active BOOLEAN DEFAULT TRUE
);
