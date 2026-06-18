CREATE DATABASE IF NOT EXISTS test_drive_dispatch
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE test_drive_dispatch;

CREATE TABLE vehicle_archive (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year VARCHAR(4),
    color VARCHAR(50),
    price DECIMAL(10,2),
    status VARCHAR(20),
    mileage INT,
    registration_date DATE,
    remark VARCHAR(500)
) ENGINE=InnoDB;

CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    display_name VARCHAR(50),
    role VARCHAR(20),
    phone VARCHAR(20)
) ENGINE=InnoDB;

CREATE TABLE appointment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    customer_name VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(20),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_to VARCHAR(50) NOT NULL,
    actual_date DATE,
    cancel_reason VARCHAR(500),
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE sales_follow_up (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    appointment_id BIGINT NOT NULL,
    customer_name VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(20),
    lead_source VARCHAR(20),
    lead_status VARCHAR(20),
    sales_person VARCHAR(50) NOT NULL,
    last_contact_time DATETIME,
    follow_up_note VARCHAR(500),
    next_follow_up_time DATETIME
) ENGINE=InnoDB;

CREATE TABLE test_drive_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    satisfaction VARCHAR(20),
    customer_opinion VARCHAR(500),
    purchase_intention VARCHAR(20),
    internal_note VARCHAR(500),
    filled_by VARCHAR(50),
    filled_at DATETIME,
    updated_by VARCHAR(50),
    updated_at DATETIME,
    version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE feedback_change_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feedback_id BIGINT NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(50) NOT NULL,
    changed_at DATETIME NOT NULL,
    INDEX idx_feedback_id (feedback_id)
) ENGINE=InnoDB;

CREATE TABLE no_show_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    responsible_person VARCHAR(50) NOT NULL,
    reason VARCHAR(500),
    handle_action VARCHAR(500),
    status VARCHAR(20) DEFAULT 'OPEN',
    closed_at DATETIME,
    closed_by VARCHAR(50),
    created_at DATETIME,
    INDEX idx_responsible (responsible_person),
    INDEX idx_status (status)
) ENGINE=InnoDB;
