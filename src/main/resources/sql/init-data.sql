-- 二手车门店试驾预约排程系统 数据库初始化脚本
-- 创建时间: 2026-06-18

CREATE DATABASE IF NOT EXISTS testdrive_scheduler
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE testdrive_scheduler;

-- 系统用户
INSERT INTO sys_user (username, password, real_name, phone, role, enabled) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', '13800000000', 'ADMIN', TRUE),
('sales1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张三', '13800000001', 'SALES_CONSULTANT', TRUE),
('sales2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李四', '13800000002', 'SALES_CONSULTANT', TRUE),
('manager1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王经理', '13800000003', 'SALES_MANAGER', TRUE),
('store1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '刘店长', '13800000004', 'STORE_MANAGER', TRUE);

-- 客户线索
INSERT INTO customer_lead (customer_name, phone, wechat_id, intended_vehicle, requirements, status, source, owner_id, remark) VALUES
('陈先生', '13900000001', 'chen_wechat_001', '宝马3系 2023款', '预算30万以内，代步用', 'NEW', 'ONLINE', 2, '对操控性要求较高'),
('王女士', '13900000002', 'wang_wechat_002', '奔驰C级 2023款', '家用，安全第一', 'CONTACTED', 'WALK_IN', 2, '有个4岁小孩'),
('李先生', '13900000003', 'li_wechat_003', '奥迪A4L', '商务用途', 'FOLLOWING', 'REFERRAL', 3, '朋友推荐来的'),
('赵先生', '13900000004', 'zhao_wechat_004', '丰田凯美瑞', '家用省油', 'APPOINTED', 'PHONE', 2, '已预约下周六试驾'),
('孙女士', '13900000005', 'sun_wechat_005', '本田雅阁', '上下班通勤', 'TEST_DRIVEN', 'ONLINE', 3, '试驾后意向较高'),
('周先生', '13900000006', 'zhou_wechat_006', '大众帕萨特', '公司采购', 'CONVERTED', 'OTHER', 2, '已签合同，等待交车'),
('吴女士', '13900000007', 'wu_wechat_007', '特斯拉Model 3', '预算有限，考虑二手', 'LOST', 'ONLINE', 3, '最终选择了新车');

-- 试驾预约
INSERT INTO test_drive_appointment (lead_id, customer_name, customer_phone, vehicle_id, vehicle_name, appointment_date, appointment_time, appointment_remark, sales_id, status) VALUES
(4, '赵先生', '13900000004', 'CAR001', '丰田凯美瑞 2.5G 豪华版', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '客户希望重点体验后排空间', 2, 'SCHEDULED'),
(5, '孙女士', '13900000005', 'CAR002', '本田雅阁 锐·T动', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '14:00:00', '重点测试加速性能', 3, 'COMPLETED'),
(6, '周先生', '13900000006', 'CAR003', '大众帕萨特 380TSI', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:30:00', '商务接待用途', 2, 'COMPLETED'),
(1, '陈先生', '13900000001', 'CAR004', '宝马3系 325Li M运动套装', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', '体验操控', 2, 'CONFIRMED'),
(3, '李先生', '13900000003', 'CAR005', '奥迪A4L 45TFSI', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '11:00:00', NULL, 3, 'NO_SHOW');

-- 试驾记录
INSERT INTO test_drive_record (appointment_id, lead_id, start_time, end_time, vehicle_id, vehicle_name, start_mileage, end_mileage, driver_id, route_description, remark) VALUES
(2, 5, DATE_SUB(NOW(), INTERVAL 1 DAY) - INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) - INTERVAL 9 HOUR, 'CAR002', '本田雅阁 锐·T动', '15,200 km', '15,268 km', 3, '门店-主干道-环城路-门店', '客户对加速表现满意'),
(3, 6, DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 8 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 7 HOUR, 'CAR003', '大众帕萨特 380TSI', '8,500 km', '8,565 km', 2, '门店-商务大道-门店', '后排空间客户非常满意');

-- 试驾反馈
INSERT INTO test_drive_feedback (appointment_id, lead_id, overall_rating, vehicle_comfort_rating, vehicle_performance_rating, sales_service_rating, likes, dislikes, purchase_intent, customer_comment, sales_comment, sales_id) VALUES
(2, 5, 4, 5, 4, 5, '空间大、油耗低', '内饰塑料感强', 'HIGH', '整体满意，回家跟家人再商量下', '客户意向较高，建议3天内跟进', 3),
(3, 6, 5, 5, 4, 5, '后排空间大、隔音好', '优惠力度不够', 'VERY_HIGH', '商务用非常合适', '已转化，进入签约流程', 2);

-- 爽约记录
INSERT INTO no_show_record (appointment_id, lead_id, status, reason, action_taken, handler_id, close_time) VALUES
(5, 3, 'PENDING', NULL, NULL, NULL, NULL);

-- 通知
INSERT INTO notification (type, title, content, target_role, related_id, read_flag) VALUES
('NO_SHOW', '试驾爽约提醒', '客户【李先生】预约试驾【奥迪A4L 45TFSI】出现爽约，请及时处理。', 'SALES_MANAGER', 5, FALSE),
('NO_SHOW', '试驾爽约提醒', '客户【李先生】预约试驾【奥迪A4L 45TFSI】出现爽约，请及时处理。', 'STORE_MANAGER', 5, FALSE);
