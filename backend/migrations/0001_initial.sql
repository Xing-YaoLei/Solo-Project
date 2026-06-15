BEGIN;

CREATE TABLE course (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chapter (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    "order" INTEGER NOT NULL,
    course_id INTEGER REFERENCES course(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#1B3A5C'
);

CREATE TABLE material (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    course_id INTEGER REFERENCES course(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_tags (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES material(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tag(id) ON DELETE CASCADE,
    UNIQUE(material_id, tag_id)
);

CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100),
    contact VARCHAR(50),
    guardian_contact VARCHAR(50)
);

CREATE TABLE distribution (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES material(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES student(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    risk_level VARCHAR(10)
);

CREATE TABLE distribution_tags (
    id SERIAL PRIMARY KEY,
    distribution_id INTEGER REFERENCES distribution(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tag(id) ON DELETE CASCADE,
    UNIQUE(distribution_id, tag_id)
);

CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    distribution_id INTEGER REFERENCES distribution(id) ON DELETE CASCADE UNIQUE,
    percentage INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chapter_completion (
    id SERIAL PRIMARY KEY,
    progress_id INTEGER REFERENCES progress(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapter(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(progress_id, chapter_id)
);

CREATE TABLE grade (
    id SERIAL PRIMARY KEY,
    progress_id INTEGER REFERENCES progress(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapter(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    feedback TEXT,
    graded_by INTEGER,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE risk_record (
    id SERIAL PRIMARY KEY,
    distribution_id INTEGER REFERENCES distribution(id) ON DELETE CASCADE,
    risk_level VARCHAR(10) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE communication (
    id SERIAL PRIMARY KEY,
    risk_id INTEGER REFERENCES risk_record(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comm_type VARCHAR(20) NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_conclusion (
    id SERIAL PRIMARY KEY,
    risk_id INTEGER REFERENCES risk_record(id) ON DELETE CASCADE,
    conclusion TEXT NOT NULL,
    reviewer_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reminder_rule (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    threshold INTEGER NOT NULL,
    remind_method VARCHAR(20) NOT NULL DEFAULT 'in_app',
    frequency_days INTEGER NOT NULL DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reminder_log (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES reminder_rule(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES student(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_distribution_status ON distribution(status);
CREATE INDEX idx_distribution_risk ON distribution(risk_level);
CREATE INDEX idx_progress_last_updated ON progress(last_updated);
CREATE INDEX idx_risk_record_level ON risk_record(risk_level);
CREATE INDEX idx_reminder_log_student ON reminder_log(student_id);
CREATE INDEX idx_reminder_log_read ON reminder_log(is_read);

INSERT INTO course (name, description) VALUES
    ('Python编程基础', '面向青少年的Python入门课程，涵盖基础语法、数据类型、控制流程等'),
    ('数学思维训练', '培养青少年逻辑思维与数学建模能力的专项训练课程'),
    ('英语阅读与写作', '提升青少年英语阅读理解和写作表达能力的综合课程');

INSERT INTO chapter (name, "order", course_id) VALUES
    ('Python环境搭建', 1, 1),
    ('变量与数据类型', 2, 1),
    ('条件判断与循环', 3, 1),
    ('函数与模块', 4, 1),
    ('文件操作与异常处理', 5, 1),
    ('数列与规律', 1, 2),
    ('逻辑推理入门', 2, 2),
    ('几何图形认知', 3, 2),
    ('概率与统计基础', 4, 2),
    ('数学建模初探', 5, 2),
    ('阅读技巧与方法', 1, 3),
    ('词汇拓展与记忆', 2, 3),
    ('段落理解与归纳', 3, 3),
    ('短文写作入门', 4, 3),
    ('创意写作实践', 5, 3);

INSERT INTO tag (name, color) VALUES
    ('重点教材', '#E74C3C'),
    ('新上架', '#3498DB'),
    ('配套练习', '#2ECC71'),
    ('考前冲刺', '#F39C12'),
    ('基础必学', '#9B59B6');

INSERT INTO material (title, description, file_url, course_id) VALUES
    ('Python编程基础教程', 'Python入门完整教程，包含代码示例和课后练习', '/materials/python-basic.pdf', 1),
    ('Python项目实战手册', '10个实战项目从零到一，锻炼编程能力', '/materials/python-projects.pdf', 1),
    ('数学思维训练题集', '精选200道思维训练题，含详细解析', '/materials/math-thinking.pdf', 2),
    ('数学建模案例集', '15个建模案例，从问题分析到求解全流程', '/materials/math-modeling.pdf', 2),
    ('英语阅读精选50篇', '50篇精选英语阅读文章，分级训练', '/materials/english-reading.pdf', 3),
    ('英语写作模板与范文', '常见写作题型模板20套及高分范文', '/materials/english-writing.pdf', 3);

INSERT INTO material_tags (material_id, tag_id) VALUES
    (1, 1), (1, 5),
    (2, 3), (2, 4),
    (3, 1), (3, 3),
    (4, 4),
    (5, 2), (5, 5),
    (6, 3), (6, 4);

INSERT INTO student (name, class_name, contact, guardian_contact) VALUES
    ('张小明', '2024级A班', '13800001001', '13800002001'),
    ('李思涵', '2024级A班', '13800001002', '13800002002'),
    ('王浩然', '2024级B班', '13800001003', '13800002003'),
    ('赵雨萱', '2024级B班', '13800001004', '13800002004'),
    ('陈子轩', '2024级A班', '13800001005', '13800002005'),
    ('刘诗琪', '2024级C班', '13800001006', '13800002006'),
    ('杨一诺', '2024级C班', '13800001007', '13800002007'),
    ('黄思远', '2024级B班', '13800001008', '13800002008'),
    ('周欣怡', '2024级A班', '13800001009', '13800002009'),
    ('吴天宇', '2024级C班', '13800001010', '13800002010');

INSERT INTO distribution (material_id, student_id, status, distributed_at, risk_level) VALUES
    (1, 1, 'completed', '2025-09-01 09:00:00+08', NULL),
    (1, 2, 'following', '2025-09-01 09:00:00+08', 'medium'),
    (1, 3, 'reviewing', '2025-09-01 09:00:00+08', NULL),
    (1, 4, 'pending', '2025-09-02 10:00:00+08', NULL),
    (2, 1, 'completed', '2025-09-05 09:00:00+08', NULL),
    (2, 5, 'following', '2025-09-05 09:00:00+08', 'high'),
    (2, 6, 'following', '2025-09-05 09:00:00+08', 'low'),
    (3, 3, 'completed', '2025-09-10 09:00:00+08', NULL),
    (3, 7, 'reviewing', '2025-09-10 09:00:00+08', NULL),
    (3, 8, 'following', '2025-09-10 09:00:00+08', 'medium'),
    (4, 9, 'pending', '2025-09-12 09:00:00+08', NULL),
    (4, 10, 'following', '2025-09-12 09:00:00+08', 'high'),
    (5, 1, 'completed', '2025-09-15 09:00:00+08', NULL),
    (5, 2, 'following', '2025-09-15 09:00:00+08', 'low'),
    (5, 4, 'pending', '2025-09-15 09:00:00+08', NULL),
    (6, 5, 'reviewing', '2025-09-18 09:00:00+08', NULL),
    (6, 6, 'following', '2025-09-18 09:00:00+08', 'high'),
    (1, 7, 'pending', '2025-09-20 09:00:00+08', NULL),
    (3, 9, 'completed', '2025-09-22 09:00:00+08', NULL),
    (2, 8, 'following', '2025-09-22 09:00:00+08', 'medium');

INSERT INTO distribution_tags (distribution_id, tag_id) VALUES
    (1, 1), (1, 5),
    (2, 1), (2, 5),
    (3, 5),
    (5, 3),
    (6, 3), (6, 4),
    (7, 3),
    (8, 1), (8, 3),
    (10, 3),
    (12, 4),
    (13, 2), (13, 5),
    (16, 3), (16, 4),
    (19, 1), (19, 3);

INSERT INTO progress (distribution_id, percentage, last_updated) VALUES
    (1, 100, '2025-10-15 14:30:00+08'),
    (2, 45, '2025-10-10 09:20:00+08'),
    (3, 80, '2025-10-12 16:00:00+08'),
    (4, 0, '2025-09-02 10:00:00+08'),
    (5, 100, '2025-10-20 11:00:00+08'),
    (6, 30, '2025-10-08 08:45:00+08'),
    (7, 60, '2025-10-11 15:30:00+08'),
    (8, 100, '2025-10-25 10:00:00+08'),
    (9, 75, '2025-10-18 14:00:00+08'),
    (10, 40, '2025-10-09 11:30:00+08'),
    (11, 0, '2025-09-12 09:00:00+08'),
    (12, 20, '2025-10-05 09:00:00+08'),
    (13, 100, '2025-10-28 13:00:00+08'),
    (14, 55, '2025-10-15 10:00:00+08'),
    (15, 0, '2025-09-15 09:00:00+08'),
    (16, 85, '2025-10-22 16:30:00+08'),
    (17, 35, '2025-10-07 09:00:00+08'),
    (18, 0, '2025-09-20 09:00:00+08'),
    (19, 100, '2025-10-30 11:00:00+08'),
    (20, 50, '2025-10-13 14:00:00+08');

INSERT INTO chapter_completion (progress_id, chapter_id, completed, completed_at) VALUES
    (1, 1, TRUE, '2025-09-15 10:00:00+08'),
    (1, 2, TRUE, '2025-09-22 10:00:00+08'),
    (1, 3, TRUE, '2025-09-29 10:00:00+08'),
    (1, 4, TRUE, '2025-10-06 10:00:00+08'),
    (1, 5, TRUE, '2025-10-13 10:00:00+08'),
    (2, 1, TRUE, '2025-09-16 10:00:00+08'),
    (2, 2, TRUE, '2025-09-25 10:00:00+08'),
    (2, 3, FALSE, NULL),
    (3, 1, TRUE, '2025-09-17 10:00:00+08'),
    (3, 2, TRUE, '2025-09-26 10:00:00+08'),
    (3, 3, TRUE, '2025-10-03 10:00:00+08'),
    (3, 4, TRUE, '2025-10-10 10:00:00+08'),
    (6, 1, TRUE, '2025-09-20 10:00:00+08'),
    (6, 2, FALSE, NULL),
    (8, 6, TRUE, '2025-09-25 10:00:00+08'),
    (8, 7, TRUE, '2025-10-02 10:00:00+08'),
    (8, 8, TRUE, '2025-10-09 10:00:00+08'),
    (8, 9, TRUE, '2025-10-16 10:00:00+08'),
    (8, 10, TRUE, '2025-10-23 10:00:00+08'),
    (13, 11, TRUE, '2025-09-25 10:00:00+08'),
    (13, 12, TRUE, '2025-10-02 10:00:00+08'),
    (13, 13, TRUE, '2025-10-09 10:00:00+08'),
    (13, 14, TRUE, '2025-10-16 10:00:00+08'),
    (13, 15, TRUE, '2025-10-23 10:00:00+08');

INSERT INTO grade (progress_id, chapter_id, score, feedback, graded_by, graded_at) VALUES
    (1, 1, 92, '掌握良好，代码规范', 1, '2025-09-20 10:00:00+08'),
    (1, 2, 88, '数据类型理解到位', 1, '2025-09-27 10:00:00+08'),
    (1, 3, 95, '循环嵌套运用熟练', 1, '2025-10-04 10:00:00+08'),
    (1, 4, 90, '函数定义清晰，模块化意识强', 1, '2025-10-11 10:00:00+08'),
    (1, 5, 85, '异常处理需要加强', 1, '2025-10-18 10:00:00+08'),
    (2, 1, 78, '基础掌握，需要多练习', 1, '2025-09-22 10:00:00+08'),
    (2, 2, 65, '数据类型容易混淆，需复习', 1, '2025-10-01 10:00:00+08'),
    (8, 6, 88, '数列规律识别能力较强', 2, '2025-10-01 10:00:00+08'),
    (8, 7, 92, '逻辑推理清晰', 2, '2025-10-08 10:00:00+08'),
    (8, 8, 85, '空间想象力不错', 2, '2025-10-15 10:00:00+08'),
    (13, 11, 90, '阅读方法掌握良好', 3, '2025-10-01 10:00:00+08'),
    (13, 12, 87, '词汇量有提升空间', 3, '2025-10-08 10:00:00+08');

INSERT INTO risk_record (distribution_id, risk_level, reason, created_at, updated_at) VALUES
    (2, 'medium', '学习进度落后于计划进度，第二章成绩偏低', '2025-10-10 10:00:00+08', '2025-10-10 10:00:00+08'),
    (6, 'high', '学习进度严重滞后，一个月仅完成第一章', '2025-10-08 10:00:00+08', '2025-10-08 10:00:00+08'),
    (7, 'low', '进度略低于预期，需要关注', '2025-10-11 10:00:00+08', '2025-10-11 10:00:00+08'),
    (10, 'medium', '数学思维训练进度缓慢，需要辅导', '2025-10-09 10:00:00+08', '2025-10-09 10:00:00+08'),
    (12, 'high', '进度极低，且已超过两周未更新', '2025-10-05 10:00:00+08', '2025-10-05 10:00:00+08'),
    (14, 'low', '英语阅读进度略落后，自主性不足', '2025-10-15 10:00:00+08', '2025-10-15 10:00:00+08'),
    (17, 'high', '写作课程进度严重滞后，未参与练习', '2025-10-07 10:00:00+08', '2025-10-07 10:00:00+08'),
    (20, 'medium', 'Python项目实战进度一般，需加强实践', '2025-10-13 10:00:00+08', '2025-10-13 10:00:00+08');

INSERT INTO communication (risk_id, content, comm_type, created_by, created_at) VALUES
    (1, '电话联系家长，了解学员近期学习情况，家长反映课后时间安排较满', 'phone', 1, '2025-10-10 14:00:00+08'),
    (1, '发送邮件提醒学员登录系统完成练习，附上学习建议', 'email', 1, '2025-10-11 09:00:00+08'),
    (2, '与学员面谈，了解学习困难点，学员反馈函数部分理解困难', 'in_person', 1, '2025-10-09 15:00:00+08'),
    (2, '线上辅导一次，重点讲解函数概念和参数传递', 'online', 1, '2025-10-12 10:00:00+08'),
    (2, '再次电话联系家长，建议增加课后练习时间', 'phone', 1, '2025-10-15 11:00:00+08'),
    (4, '线上沟通，了解数学思维训练中的困难', 'online', 2, '2025-10-10 10:00:00+08'),
    (5, '电话联系监护人，讨论学习计划调整方案', 'phone', 1, '2025-10-06 14:00:00+08'),
    (5, '邮件发送补充学习资料和练习题', 'email', 1, '2025-10-08 09:00:00+08'),
    (7, '面谈了解写作课程参与度低的原因', 'in_person', 3, '2025-10-08 14:00:00+08'),
    (7, '线上辅导写作技巧，激发学员兴趣', 'online', 3, '2025-10-10 16:00:00+08');

INSERT INTO review_conclusion (risk_id, conclusion, reviewer_id, created_at) VALUES
    (1, '建议安排额外辅导时间，同时调整学习节奏，从每周一次改为每周两次', 2, '2025-10-12 10:00:00+08'),
    (2, '学员基础薄弱，建议从更简单的内容开始，降低难度逐步过渡', 2, '2025-10-13 10:00:00+08'),
    (5, '建议与家长协商制定每日学习计划，系统定期推送提醒', 1, '2025-10-09 10:00:00+08'),
    (7, '学员对写作缺乏自信，建议从仿写开始，逐步过渡到独立创作', 3, '2025-10-11 10:00:00+08');

INSERT INTO reminder_rule (name, condition_type, threshold, remind_method, frequency_days, is_active) VALUES
    ('进度低于30%提醒', 'progress_below', 30, 'both', 7, TRUE),
    ('进度低于50%提醒', 'progress_below', 50, 'in_app', 5, TRUE),
    ('7天未更新提醒', 'no_update_days', 7, 'email', 3, TRUE),
    ('14天未更新提醒', 'no_update_days', 14, 'both', 2, TRUE),
    ('成绩低于70分提醒', 'grade_below', 70, 'in_app', 7, TRUE);

INSERT INTO reminder_log (rule_id, student_id, message, sent_at, is_read) VALUES
    (1, 2, '学员李思涵Python编程进度为45%，低于50%阈值，请及时跟进', '2025-10-10 09:00:00+08', TRUE),
    (1, 6, '学员刘诗琪Python项目实战进度为30%，低于30%阈值，请及时跟进', '2025-10-08 09:00:00+08', TRUE),
    (2, 7, '学员杨一诺Python项目实战进度为60%，低于50%阈值，请关注', '2025-10-11 09:00:00+08', FALSE),
    (3, 4, '学员赵雨萱已超过7天未更新学习进度', '2025-10-09 09:00:00+08', TRUE),
    (4, 12, '学员吴天宇已超过14天未更新学习进度，请紧急跟进', '2025-10-12 09:00:00+08', TRUE),
    (5, 2, '学员李思涵第二章成绩为65分，低于70分阈值', '2025-10-01 10:00:00+08', FALSE),
    (1, 17, '学员杨一诺英语写作进度为35%，低于30%阈值，请及时跟进', '2025-10-07 09:00:00+08', TRUE),
    (2, 10, '学员黄思远数学思维训练进度为40%，低于50%阈值，请关注', '2025-10-09 09:00:00+08', FALSE);

COMMIT;
