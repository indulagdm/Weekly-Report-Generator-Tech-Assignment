CREATE DATABASE IF NOT EXISTS weekly_reports_db;

USE weekly_reports_db;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('team_member','manager') DEFAULT 'team_member',
    title VARCHAR(100),
    password TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    week_start_date DATE,
    week_end_date DATE,
    status ENUM('draft','submitted','needs_correction','approved') DEFAULT 'draft',
    current_version_number INT DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_week_dates
        CHECK (week_start_date <= week_end_date),

    CONSTRAINT chk_status_valid
        CHECK (status IN ('draft','submitted','needs_correction','approved')),

    CONSTRAINT chk_current_version_number_positive
        CHECK (current_version_number > 0),

    INDEX idx_reports (user_id,week_start_date)
);

CREATE TABLE IF NOT EXISTS report_versions (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    version_number INT,
    tasks_planned_next_week TEXT NOT NULL,
    notes TEXT NOT NULL,
    links TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_report
        FOREIGN KEY (report_id)
        REFERENCES reports(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_version_number_positive
        CHECK (version_number > 0)  ,

    INDEX idx_report_version (report_id,version_number)

);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) NOT NULL,
    report_version_id VARCHAR(36) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    planned_percent DECIMAL(5, 2) NOT NULL,
    actual_percent DECIMAL(5, 2) NOT NULL,
    status ENUM('not_started','in_progress','completed','blocked') DEFAULT 'not_started',
    time_planned_hours DECIMAL(5,2) NOT NULL,
    time_spent_hours DECIMAL(5,2) NOT NULL,
    output_deliverable TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    report_version_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    is_key_achievement BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_version
        FOREIGN KEY (report_version_id)
        REFERENCES report_versions(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blockers(
    id VARCHAR(36) PRIMARY KEY,
    report_version_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    is_key_issue BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_version
        FOREIGN KEY (report_version_id)
        REFERENCES report_versions(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hours_breakdown (
    id VARCHAR(36) PRIMARY KEY,
    report_version_id VARCHAR(36) NOT NULL,
    task_type ENUM('Development', 'Testing', 'Documentation', 'Meetings', 'Other'),
    hours DECIMAL(5, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_version
        FOREIGN KEY (report_version_id)
        REFERENCES report_versions(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_hours_non_negative
        CHECK (hours >= 0),

    CONSTRAINT chk_task_type_valid
        CHECK (task_type IN ('Development', 'Testing', 'Documentation', 'Meetings', 'Other')),  

    CONSTRAINT chk_hours_decimal_places
        CHECK (hours * 100 = FLOOR(hours * 100)),

    CONSTRAINT chk_hours_max_value
        CHECK (hours <= 999.99),

    CONSTRAINT chk_hours_total
        CHECK (hours <= 24.00),

    INDEX idx_hours_breakdown (report_version_id,task_type)
);

CREATE TABLE IF NOT EXISTS review_comments (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    report_version_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    action ENUM('approve','request_changes') NOT NULL,
    comment TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS user_projects (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    INDEX idx_user_project (user_id, project_id)
);

