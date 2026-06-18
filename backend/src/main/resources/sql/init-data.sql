-- ============================================================
-- 二手车门店车源上架趋势看板 - 示例数据初始化脚本
-- 生成日期基准：2026-06-19
-- ============================================================

USE usedcar_dashboard;

-- ============================================================
-- 步骤 1：门店数据（10 个，覆盖品牌丰富度）
-- ============================================================
INSERT INTO `t_store` (`store_id`, `store_name`, `region`, `manager`, `phone`, `status`) VALUES
('ST001', '北京朝阳旗舰店', '华北-北京', '张伟', '13801010001', 1),
('ST002', '上海浦东旗舰店', '华东-上海', '李娜', '13802020002', 1),
('ST003', '广州天河旗舰店', '华南-广州', '王强', '13803030003', 1),
('ST004', '深圳南山旗舰店', '华南-深圳', '刘洋', '13804040004', 1),
('ST005', '杭州西湖旗舰店', '华东-杭州', '陈静', '13805050005', 1),
('ST006', '成都高新旗舰店', '西南-成都', '周杰', '13806060006', 1),
('ST007', '武汉江汉旗舰店', '华中-武汉', '吴敏', '13807070007', 1),
('ST008', '西安雁塔旗舰店', '西北-西安', '郑磊', '13808080008', 1),
('ST009', '南京鼓楼旗舰店', '华东-南京', '孙丽', '13809090009', 1),
('ST010', '重庆渝北旗舰店', '西南-重庆', '马超', '13810100010', 1);

-- ============================================================
-- 步骤 2：车辆车源明细（500 辆，最近 60 天内上架）
-- 采用存储过程生成，确保分布合理
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_vehicle_sources //
CREATE PROCEDURE generate_vehicle_sources()
BEGIN
    DECLARE v INT DEFAULT 1;
    DECLARE v_vehicle_id VARCHAR(64);
    DECLARE v_store_id VARCHAR(64);
    DECLARE v_store_idx INT;
    DECLARE v_brand VARCHAR(64);
    DECLARE v_brand_idx INT;
    DECLARE v_model VARCHAR(128);
    DECLARE v_condition VARCHAR(16);
    DECLARE v_source_type VARCHAR(32);
    DECLARE v_purchase_price DECIMAL(12,2);
    DECLARE v_listing_price DECIMAL(12,2);
    DECLARE v_mileage INT;
    DECLARE v_register_date DATE;
    DECLARE v_listed_date DATETIME;
    DECLARE v_delisted_date DATETIME;
    DECLARE v_sold_date DATETIME;
    DECLARE v_turnover_days INT;
    DECLARE v_inspection_status TINYINT;
    DECLARE v_inspection_report_id VARCHAR(64);
    DECLARE v_prep_status TINYINT;
    DECLARE v_finance_status VARCHAR(16);
    DECLARE v_test_drive_count INT;
    DECLARE v_abnormal_count INT;
    DECLARE v_days_offset INT;
    DECLARE v_rand INT;

    -- 品牌与车型映射
    DECLARE brands_arr VARCHAR(255) DEFAULT '宝马,奔驰,奥迪,大众,丰田,本田,特斯拉,蔚来,理想,小鹏';
    DECLARE models_arr VARCHAR(512) DEFAULT '3系|5系|X3|X5,C级|E级|GLC|GLE,A4L|A6L|Q5L|Q7,迈腾|帕萨特|途观L|探岳,凯美瑞|汉兰达|RAV4|亚洲龙,雅阁|CR-V|思域|冠道,Model 3|Model Y|Model S|Model X,ES6|ES8|EC6|ET7,L7|L8|L9|ONE,P7|G9|P5|G3i';

    WHILE v <= 500 DO
        SET v_vehicle_id = CONCAT('VH', LPAD(v, 6, '0'));

        -- 门店：均匀分布到10个店（每店50辆）
        SET v_store_idx = ((v - 1) MOD 10) + 1;
        SET v_store_id = CONCAT('ST', LPAD(v_store_idx, 3, '0'));

        -- 品牌：均匀分布（每品牌50辆）
        SET v_brand_idx = ((v - 1) MOD 10) + 1;
        SET v_brand = SUBSTRING_INDEX(SUBSTRING_INDEX(brands_arr, ',', v_brand_idx), ',', -1);
        SET v_model = SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(models_arr, ',', v_brand_idx), ',', -1), '|', ((v - 1) MOD 4) + 1);

        -- 车况分布：优秀20%/良好50%/一般20%/较差10%
        SET v_rand = (v MOD 100) + 1;
        IF v_rand <= 20 THEN
            SET v_condition = '优秀';
        ELSEIF v_rand <= 70 THEN
            SET v_condition = '良好';
        ELSEIF v_rand <= 90 THEN
            SET v_condition = '一般';
        ELSE
            SET v_condition = '较差';
        END IF;

        -- 来源类型：inspection 40% / finance 35% / inventory 25%
        SET v_rand = (v MOD 100) + 1;
        IF v_rand <= 40 THEN
            SET v_source_type = 'inspection';
        ELSEIF v_rand <= 75 THEN
            SET v_source_type = 'finance';
        ELSE
            SET v_source_type = 'inventory';
        END IF;

        -- 价格：基于品牌粗略定价
        CASE v_brand
            WHEN '宝马' THEN SET v_purchase_price = 180000 + (v MOD 30) * 10000;
            WHEN '奔驰' THEN SET v_purchase_price = 200000 + (v MOD 30) * 10000;
            WHEN '奥迪' THEN SET v_purchase_price = 160000 + (v MOD 28) * 10000;
            WHEN '大众' THEN SET v_purchase_price = 80000 + (v MOD 20) * 8000;
            WHEN '丰田' THEN SET v_purchase_price = 90000 + (v MOD 25) * 8000;
            WHEN '本田' THEN SET v_purchase_price = 85000 + (v MOD 22) * 8000;
            WHEN '特斯拉' THEN SET v_purchase_price = 220000 + (v MOD 25) * 15000;
            WHEN '蔚来' THEN SET v_purchase_price = 250000 + (v MOD 25) * 15000;
            WHEN '理想' THEN SET v_purchase_price = 240000 + (v MOD 20) * 15000;
            WHEN '小鹏' THEN SET v_purchase_price = 160000 + (v MOD 20) * 12000;
            ELSE SET v_purchase_price = 120000;
        END CASE;
        SET v_listing_price = v_purchase_price * (1.08 + (v MOD 10) * 0.01);

        -- 里程：3000 ~ 120000 公里
        SET v_mileage = 3000 + ((v * 733) MOD 117000);

        -- 初次登记日期：2018-01 ~ 2025-06
        SET v_register_date = DATE_ADD('2018-01-01', INTERVAL ((v * 37) MOD 2700) DAY);

        -- listed_date：最近 60 天均匀分布
        SET v_days_offset = ((v - 1) * 60 DIV 500) + ((v MOD 5) * 12 DIV 50);
        IF v_days_offset > 59 THEN SET v_days_offset = 59; END IF;
        SET v_listed_date = DATE_ADD('2026-06-19 09:00:00', INTERVAL -v_days_offset DAY);
        SET v_listed_date = DATE_ADD(v_listed_date, INTERVAL ((v * 17) MOD 720) MINUTE);

        -- turnover_days：中心约38天，范围15~90，伪正态分布
        SET v_rand = ((v * 131) MOD 100) + 1;
        IF v_rand <= 10 THEN
            SET v_turnover_days = 15 + ((v * 7) MOD 13);
        ELSEIF v_rand <= 30 THEN
            SET v_turnover_days = 28 + ((v * 11) MOD 12);
        ELSEIF v_rand <= 70 THEN
            SET v_turnover_days = 32 + ((v * 5) MOD 14);
        ELSEIF v_rand <= 90 THEN
            SET v_turnover_days = 46 + ((v * 9) MOD 14);
        ELSE
            SET v_turnover_days = 60 + ((v * 3) MOD 31);
        END IF;

        -- sold_date：约60%有成交日期
        IF (v MOD 100) + 1 <= 60 THEN
            SET v_sold_date = DATE_ADD(v_listed_date, INTERVAL v_turnover_days DAY);
            SET v_delisted_date = v_sold_date;
        ELSE
            SET v_sold_date = NULL;
            -- 10%超期下架
            IF (v MOD 100) + 1 <= 10 THEN
                SET v_delisted_date = DATE_ADD(v_listed_date, INTERVAL 90 + ((v MOD 15) * 2) DAY);
            ELSE
                SET v_delisted_date = NULL;
            END IF;
        END IF;

        -- inspection_status：1合格78%/2不合格12%/0未检测10%
        SET v_rand = (v MOD 100) + 1;
        IF v_rand <= 78 THEN
            SET v_inspection_status = 1;
            SET v_inspection_report_id = CONCAT('RPT', LPAD(v, 6, '0'));
        ELSEIF v_rand <= 90 THEN
            SET v_inspection_status = 2;
            SET v_inspection_report_id = CONCAT('RPT', LPAD(v, 6, '0'));
        ELSE
            SET v_inspection_status = 0;
            SET v_inspection_report_id = NULL;
        END IF;

        -- prep_status：notStarted 23/247≈9%, inProgress 45/247≈18%, completed 167/247≈68%, overdue 12/247≈5%
        SET v_rand = (v MOD 100) + 1;
        IF v_rand <= 9 THEN
            SET v_prep_status = 0;
        ELSEIF v_rand <= 27 THEN
            SET v_prep_status = 1;
        ELSEIF v_rand <= 95 THEN
            SET v_prep_status = 2;
        ELSE
            SET v_prep_status = 3;
        END IF;

        -- finance_status：未提交 25%/审批中 20%/已审批 45%/已拒绝 10%
        SET v_rand = (v MOD 100) + 1;
        IF v_rand <= 25 THEN
            SET v_finance_status = '未提交';
        ELSEIF v_rand <= 45 THEN
            SET v_finance_status = '审批中';
        ELSEIF v_rand <= 90 THEN
            SET v_finance_status = '已审批';
        ELSE
            SET v_finance_status = '已拒绝';
        END IF;

        -- test_drive_count：0~8 辆
        SET v_test_drive_count = (v * 7) MOD 9;
        -- abnormal_count：约 3% 异常率
        IF (v MOD 33) = 0 AND v_test_drive_count > 0 THEN
            SET v_abnormal_count = 1 + ((v MOD 2));
        ELSE
            SET v_abnormal_count = 0;
        END IF;

        INSERT INTO `t_vehicle_source` (
            `vehicle_id`, `store_id`, `brand`, `model`, `vehicle_condition`,
            `source_type`, `purchase_price`, `listing_price`, `mileage`,
            `register_date`, `listed_date`, `delisted_date`, `sold_date`,
            `turnover_days`, `inspection_status`, `inspection_report_id`,
            `prep_status`, `finance_status`, `test_drive_count`, `abnormal_count`
        ) VALUES (
            v_vehicle_id, v_store_id, v_brand, v_model, v_condition,
            v_source_type, v_purchase_price, v_listing_price, v_mileage,
            v_register_date, v_listed_date, v_delisted_date, v_sold_date,
            v_turnover_days, v_inspection_status, v_inspection_report_id,
            v_prep_status, v_finance_status, v_test_drive_count, v_abnormal_count
        );

        SET v = v + 1;
    END WHILE;
END //
DELIMITER ;

CALL generate_vehicle_sources();
DROP PROCEDURE IF EXISTS generate_vehicle_sources;

-- ============================================================
-- 步骤 3：检测报告（对应 inspection_status=1 或 2 的 450 辆）
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_inspection_reports //
CREATE PROCEDURE generate_inspection_reports()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_vehicle_id VARCHAR(64);
    DECLARE v_store_id VARCHAR(64);
    DECLARE v_inspection_status TINYINT;
    DECLARE v_listed_date DATETIME;
    DECLARE v_condition VARCHAR(16);
    DECLARE cur CURSOR FOR
        SELECT vehicle_id, store_id, inspection_status, listed_date, vehicle_condition
        FROM t_vehicle_source
        WHERE inspection_status IN (1, 2)
        ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    DECLARE v_report_id VARCHAR(64);
    DECLARE v_category VARCHAR(32);
    DECLARE v_score DECIMAL(5,2);
    DECLARE v_defect_count INT;
    DECLARE v_has_accident TINYINT;
    DECLARE v_has_flood TINYINT;
    DECLARE v_has_fire TINYINT;
    DECLARE v_inspection_date DATETIME;
    DECLARE v_inspector VARCHAR(64);
    DECLARE v_desc TEXT;
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_rand INT;
    DECLARE v_day_offset INT;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_vehicle_id, v_store_id, v_inspection_status, v_listed_date, v_condition;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_counter = v_counter + 1;
        SET v_report_id = CONCAT('RPT', LPAD(SUBSTRING(v_vehicle_id, 3), 6, '0'));

        -- 检测员：轮换6人
        SET v_inspector = ELT(((v_counter - 1) MOD 6) + 1, '王检测', '李检测', '张检测', '刘检测', '陈检测', '赵检测');

        -- inspection_date：listed_date 前后3天内
        SET v_day_offset = ((v_counter * 7) MOD 7) - 3;
        SET v_inspection_date = DATE_ADD(v_listed_date, INTERVAL v_day_offset DAY);
        IF v_inspection_date < '2026-04-20 00:00:00' THEN
            SET v_inspection_date = DATE_ADD(v_listed_date, INTERVAL 1 DAY);
        END IF;

        -- category & score 分布：
        -- excellent 20% / good 40% / normal 18% / poor 8% / accident 4% / flood 5% / fire 5%
        SET v_rand = (v_counter MOD 100) + 1;
        IF v_rand <= 20 THEN
            SET v_category = 'excellent';
            SET v_score = 90 + ((v_counter * 11) MOD 11) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 0 + ((v_counter * 3) MOD 2);
            SET v_has_accident = 0;
            SET v_has_flood = 0;
            SET v_has_fire = 0;
            SET v_desc = '车况优秀，各项检测指标正常，无重大问题。';
        ELSEIF v_rand <= 60 THEN
            SET v_category = 'good';
            SET v_score = 80 + ((v_counter * 13) MOD 10) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 1 + ((v_counter * 5) MOD 3);
            SET v_has_accident = 0;
            SET v_has_flood = 0;
            SET v_has_fire = 0;
            SET v_desc = '车况良好，少量轻微瑕疵，不影响正常使用。';
        ELSEIF v_rand <= 78 THEN
            SET v_category = 'normal';
            SET v_score = 70 + ((v_counter * 7) MOD 10) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 3 + ((v_counter * 3) MOD 4);
            SET v_has_accident = 0;
            SET v_has_flood = 0;
            SET v_has_fire = 0;
            SET v_desc = '车况一般，存在多处磨损和小问题，建议整备后上架。';
        ELSEIF v_rand <= 86 THEN
            SET v_category = 'poor';
            SET v_score = 60 + ((v_counter * 5) MOD 10) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 6 + ((v_counter * 2) MOD 5);
            SET v_has_accident = 0;
            SET v_has_flood = 0;
            SET v_has_fire = 0;
            SET v_desc = '车况较差，存在多个需要维修的项目，建议低价处理或深度整备。';
        ELSEIF v_rand <= 90 THEN
            SET v_category = 'accident';
            SET v_score = 40 + ((v_counter * 11) MOD 20) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 8 + ((v_counter * 3) MOD 8);
            SET v_has_accident = 1;
            SET v_has_flood = 0;
            SET v_has_fire = 0;
            SET v_desc = '检测发现事故车痕迹，结构件有修复迹象，需详细评估。';
        ELSEIF v_rand <= 95 THEN
            SET v_category = 'flood';
            SET v_score = 35 + ((v_counter * 7) MOD 20) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 10 + ((v_counter * 2) MOD 6);
            SET v_has_accident = 0;
            SET v_has_flood = 1;
            SET v_has_fire = 0;
            SET v_desc = '检测发现泡水车痕迹，座椅下方、电器模块有锈蚀迹象，建议谨慎收购。';
        ELSE
            SET v_category = 'fire';
            SET v_score = 30 + ((v_counter * 5) MOD 25) + ((v_counter MOD 100) / 100);
            SET v_defect_count = 9 + ((v_counter * 4) MOD 7);
            SET v_has_accident = 0;
            SET v_has_flood = 0;
            SET v_has_fire = 1;
            SET v_desc = '检测发现火烧车痕迹，发动机舱内线束有更换，防火墙有烟熏痕迹。';
        END IF;

        -- 如果inspection_status=2（不合格），强制降档到不合格分类
        IF v_inspection_status = 2 THEN
            SET v_rand = (v_counter MOD 3);
            IF v_rand = 0 THEN
                SET v_category = 'accident';
                SET v_has_accident = 1;
                SET v_has_flood = 0;
                SET v_has_fire = 0;
                SET v_score = 35 + ((v_counter * 3) MOD 20);
                SET v_desc = '事故车检测不合格，结构件修复不符合标准。';
            ELSEIF v_rand = 1 THEN
                SET v_category = 'flood';
                SET v_has_accident = 0;
                SET v_has_flood = 1;
                SET v_has_fire = 0;
                SET v_score = 32 + ((v_counter * 5) MOD 20);
                SET v_desc = '泡水车检测不合格，存在重大安全隐患。';
            ELSE
                SET v_category = 'fire';
                SET v_has_accident = 0;
                SET v_has_flood = 0;
                SET v_has_fire = 1;
                SET v_score = 28 + ((v_counter * 7) MOD 20);
                SET v_desc = '火烧车检测不合格，严禁上架销售。';
            END IF;
            SET v_defect_count = 10 + ((v_counter MOD 6));
        END IF;

        INSERT INTO `t_inspection_report` (
            `report_id`, `vehicle_id`, `store_id`, `inspector`,
            `inspection_date`, `overall_score`, `category`, `description`,
            `defect_count`, `has_accident`, `has_flood`, `has_fire`, `defect_details`
        ) VALUES (
            v_report_id, v_vehicle_id, v_store_id, v_inspector,
            v_inspection_date, v_score, v_category, v_desc,
            v_defect_count, v_has_accident, v_has_flood, v_has_fire,
            JSON_OBJECT(
                'exterior', JSON_ARRAY('前保险杠划痕', '左前门凹陷'),
                'interior', JSON_ARRAY('座椅磨损', '中控划痕'),
                'mechanical', JSON_ARRAY('刹车片需更换', '机油需更换')
            )
        );
    END LOOP;
    CLOSE cur;
END //
DELIMITER ;

CALL generate_inspection_reports();
DROP PROCEDURE IF EXISTS generate_inspection_reports;

-- ============================================================
-- 步骤 4：整备清单（1000+ 条，每辆车 1-3 项）
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_prep_items //
CREATE PROCEDURE generate_prep_items()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_vehicle_id VARCHAR(64);
    DECLARE v_store_id VARCHAR(64);
    DECLARE v_brand VARCHAR(64);
    DECLARE v_listed_date DATETIME;
    DECLARE v_prep_status TINYINT;
    DECLARE cur CURSOR FOR
        SELECT vehicle_id, store_id, brand, listed_date, prep_status
        FROM t_vehicle_source
        ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    DECLARE v_items_per_vehicle INT;
    DECLARE v_item_idx INT;
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_item_name VARCHAR(256);
    DECLARE v_item_category VARCHAR(64);
    DECLARE v_cost DECIMAL(10,2);
    DECLARE v_expected_days INT;
    DECLARE v_actual_days INT;
    DECLARE v_status VARCHAR(16);
    DECLARE v_is_overdue TINYINT;
    DECLARE v_start_date DATETIME;
    DECLARE v_end_date DATETIME;
    DECLARE v_remark VARCHAR(512);
    DECLARE v_rand INT;
    DECLARE v_category_rand INT;

    -- 整备项目模板
    DECLARE prep_names VARCHAR(1024) DEFAULT '前保险杠喷漆,左前翼子板钣金,机油更换+机滤,变速箱油更换,刹车片更换(前),刹车片更换(后),轮胎更换(4条),四轮定位+动平衡,空调清洗+消毒,内饰深度清洁,座椅真皮修复,中控台翻新,前挡风玻璃修复,大灯翻新抛光,底盘装甲喷涂,轮毂修复翻新,电瓶更换,火花塞更换(4支),发动机积碳清洗,门把手喷漆修复';

    OPEN cur;
    vehicle_loop: LOOP
        FETCH cur INTO v_vehicle_id, v_store_id, v_brand, v_listed_date, v_prep_status;
        IF done = 1 THEN
            LEAVE vehicle_loop;
        END IF;

        -- 每辆车1~3项整备
        SET v_counter = v_counter + 1;
        SET v_items_per_vehicle = 1 + ((v_counter * 17) MOD 3);
        SET v_item_idx = 0;

        WHILE v_item_idx < v_items_per_vehicle DO
            SET v_counter = v_counter + 1;
            SET v_rand = ((v_counter * 13) MOD 20) + 1;
            SET v_item_name = SUBSTRING_INDEX(SUBSTRING_INDEX(prep_names, ',', v_rand), ',', -1);

            -- 项目类别：根据名称推断
            SET v_category_rand = (v_counter MOD 100) + 1;
            IF v_category_rand <= 20 THEN
                SET v_item_category = '钣金';
            ELSEIF v_category_rand <= 50 THEN
                SET v_item_category = '喷漆';
            ELSEIF v_category_rand <= 80 THEN
                SET v_item_category = '机电';
            ELSEIF v_category_rand <= 95 THEN
                SET v_item_category = '美容';
            ELSE
                SET v_item_category = '其他';
            END IF;

            -- 费用：钣金/喷漆较贵，机电中等，美容便宜
            CASE v_item_category
                WHEN '钣金' THEN SET v_cost = 800 + ((v_counter * 37) MOD 2500);
                WHEN '喷漆' THEN SET v_cost = 600 + ((v_counter * 29) MOD 2000);
                WHEN '机电' THEN SET v_cost = 300 + ((v_counter * 23) MOD 3500);
                WHEN '美容' THEN SET v_cost = 100 + ((v_counter * 11) MOD 900);
                ELSE SET v_cost = 200 + ((v_counter * 19) MOD 1500);
            END CASE;

            SET v_expected_days = 5;

            -- actual_days：正态分布 2~12
            SET v_rand = (v_counter MOD 100) + 1;
            IF v_rand <= 15 THEN
                SET v_actual_days = 2 + ((v_counter * 3) MOD 2);
            ELSEIF v_rand <= 45 THEN
                SET v_actual_days = 4 + ((v_counter * 5) MOD 2);
            ELSEIF v_rand <= 80 THEN
                SET v_actual_days = 5 + ((v_counter * 7) MOD 3);
            ELSE
                SET v_actual_days = 8 + ((v_counter * 11) MOD 5);
            END IF;

            -- 状态基于 prep_status 和 actual_days 推导
            IF v_prep_status = 0 THEN
                SET v_status = 'not_started';
                SET v_actual_days = NULL;
                SET v_start_date = NULL;
                SET v_end_date = NULL;
                SET v_is_overdue = 0;
            ELSEIF v_prep_status = 1 THEN
                SET v_status = 'in_progress';
                SET v_start_date = DATE_ADD(v_listed_date, INTERVAL 1 DAY);
                SET v_end_date = NULL;
                SET v_actual_days = NULL;
                SET v_is_overdue = 0;
            ELSEIF v_prep_status = 2 THEN
                SET v_status = 'completed';
                SET v_start_date = DATE_ADD(v_listed_date, INTERVAL 1 DAY);
                SET v_end_date = DATE_ADD(v_start_date, INTERVAL v_actual_days DAY);
                SET v_is_overdue = IF(v_actual_days > v_expected_days, 1, 0);
            ELSE
                SET v_status = 'overdue';
                SET v_start_date = DATE_ADD(v_listed_date, INTERVAL 1 DAY);
                SET v_actual_days = v_expected_days + 2 + ((v_counter * 5) MOD 10);
                SET v_end_date = NULL;
                SET v_is_overdue = 1;
            END IF;

            SET v_remark = CASE v_status
                WHEN 'not_started' THEN '等待安排整备'
                WHEN 'in_progress' THEN '正在施工中'
                WHEN 'completed' THEN IF(v_is_overdue = 1, '已完成（有延期）', '整备完成，质检合格')
                WHEN 'overdue' THEN CONCAT('超期未完成，预期', v_expected_days, '天，已超', v_actual_days - v_expected_days, '天')
                ELSE NULL
            END;

            INSERT INTO `t_prep_item` (
                `vehicle_id`, `store_id`, `item_name`, `item_category`, `cost`,
                `start_date`, `end_date`, `expected_days`, `actual_days`,
                `status`, `is_overdue`, `remark`
            ) VALUES (
                v_vehicle_id, v_store_id, v_item_name, v_item_category, v_cost,
                v_start_date, v_end_date, v_expected_days, v_actual_days,
                v_status, v_is_overdue, v_remark
            );

            SET v_item_idx = v_item_idx + 1;
        END WHILE;
    END LOOP;
    CLOSE cur;
END //
DELIMITER ;

CALL generate_prep_items();
DROP PROCEDURE IF EXISTS generate_prep_items;

-- ============================================================
-- 步骤 5：试驾记录（1000 条，最近 30 天）
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_test_drives //
CREATE PROCEDURE generate_test_drives()
BEGIN
    DECLARE t INT DEFAULT 1;
    DECLARE v_drive_id VARCHAR(64);
    DECLARE v_vehicle_id VARCHAR(64);
    DECLARE v_vehicle_idx INT;
    DECLARE v_store_id VARCHAR(64);
    DECLARE v_store_idx INT;
    DECLARE v_driver_name VARCHAR(64);
    DECLARE v_driver_phone VARCHAR(32);
    DECLARE v_start_time DATETIME;
    DECLARE v_end_time DATETIME;
    DECLARE v_duration_min INT;
    DECLARE v_route_planned VARCHAR(256);
    DECLARE v_route_actual VARCHAR(256);
    DECLARE v_max_speed INT;
    DECLARE v_speed_limit INT;
    DECLARE v_is_abnormal TINYINT;
    DECLARE v_anomaly_type VARCHAR(32);
    DECLARE v_anomaly_severity VARCHAR(16);
    DECLARE v_anomaly_desc VARCHAR(512);
    DECLARE v_report_status VARCHAR(16);
    DECLARE v_rand INT;
    DECLARE v_day_offset INT;
    DECLARE v_name_idx INT;

    DECLARE driver_names VARCHAR(512) DEFAULT '客户王先生,客户李女士,客户张先生,客户刘女士,客户陈先生,客户杨女士,客户黄先生,客户周女士,客户吴先生,客户赵女士,客户徐先生,客户孙女士,客户马先生,客户朱女士,客户胡先生,客户郭女士,客户何先生,客户林女士,客户罗先生,客户高女士';

    WHILE t <= 1000 DO
        SET v_drive_id = CONCAT('TD', LPAD(t, 7, '0'));

        -- 车辆：从500辆车中选取有试驾次数的
        SET v_vehicle_idx = ((t - 1) * 500 DIV 1000) + 1;
        IF v_vehicle_idx > 500 THEN SET v_vehicle_idx = 500; END IF;
        SET v_vehicle_id = CONCAT('VH', LPAD(v_vehicle_idx, 6, '0'));

        -- 门店：对应车辆所在门店
        SET v_store_idx = ((v_vehicle_idx - 1) MOD 10) + 1;
        SET v_store_id = CONCAT('ST', LPAD(v_store_idx, 3, '0'));

        -- 试驾人
        SET v_name_idx = ((t - 1) MOD 20) + 1;
        SET v_driver_name = SUBSTRING_INDEX(SUBSTRING_INDEX(driver_names, ',', v_name_idx), ',', -1);
        SET v_driver_phone = CONCAT('139', LPAD(10000000 + ((t * 131) MOD 89999999), 8, '0'));

        -- 最近30天均匀分布
        SET v_day_offset = ((t - 1) * 30 DIV 1000);
        IF v_day_offset > 29 THEN SET v_day_offset = 29; END IF;
        SET v_start_time = DATE_ADD('2026-06-19 10:00:00', INTERVAL -v_day_offset DAY);
        SET v_start_time = DATE_ADD(v_start_time, INTERVAL ((t * 23) MOD 600) MINUTE);

        -- duration_min：15~120 分钟
        SET v_duration_min = 15 + ((t * 31) MOD 106);
        SET v_end_time = DATE_ADD(v_start_time, INTERVAL v_duration_min MINUTE);

        -- 路线
        SET v_route_planned = ELT(((t - 1) MOD 4) + 1,
            '门店→朝阳路→东三环→返回门店',
            '门店→世纪大道→陆家嘴→返回门店',
            '门店→天河路→珠江新城→返回门店',
            '门店→深南大道→科技园→返回门店'
        );
        SET v_route_actual = v_route_planned;

        -- max_speed：60~120
        SET v_max_speed = 60 + ((t * 19) MOD 61);
        SET v_speed_limit = 80;

        -- is_abnormal：约 3%
        IF (t MOD 33) = 0 THEN
            SET v_is_abnormal = 1;

            -- anomaly_type 分布：overspeed 40% / unauthorized_route 25% / long_duration 20% / accident_test 15%
            SET v_rand = (t MOD 100) + 1;
            IF v_rand <= 40 THEN
                SET v_anomaly_type = 'overspeed';
                SET v_max_speed = 95 + ((t * 3) MOD 30);
                SET v_anomaly_severity = IF(v_max_speed >= 115, 'high', IF(v_max_speed >= 100, 'medium', 'low'));
                SET v_anomaly_desc = CONCAT('试驾过程中超速，最高时速达', v_max_speed, 'km/h，路段限速80km/h');
            ELSEIF v_rand <= 65 THEN
                SET v_anomaly_type = 'unauthorized_route';
                SET v_route_actual = CONCAT(v_route_planned, '→绕经郊区路段');
                SET v_anomaly_severity = IF(t MOD 3 = 0, 'high', 'medium');
                SET v_anomaly_desc = '偏离规定试驾路线，未经允许进入非规划区域';
            ELSEIF v_rand <= 85 THEN
                SET v_anomaly_type = 'long_duration';
                SET v_duration_min = 150 + ((t * 5) MOD 90);
                SET v_end_time = DATE_ADD(v_start_time, INTERVAL v_duration_min MINUTE);
                SET v_anomaly_severity = IF(v_duration_min >= 200, 'high', 'medium');
                SET v_anomaly_desc = CONCAT('试驾时长异常偏长，实际用时', v_duration_min, '分钟，标准时长30-60分钟');
            ELSE
                SET v_anomaly_type = 'accident_test';
                SET v_anomaly_severity = 'high';
                SET v_anomaly_desc = '事故车辆被安排试驾，存在重大安全隐患';
            END IF;

            SET v_report_status = IF(v_anomaly_severity = 'high', 'reported', 'reported');
        ELSE
            SET v_is_abnormal = 0;
            SET v_anomaly_type = NULL;
            SET v_anomaly_severity = NULL;
            SET v_anomaly_desc = NULL;
            SET v_report_status = 'normal';
        END IF;

        INSERT INTO `t_test_drive` (
            `drive_id`, `vehicle_id`, `store_id`, `driver_name`, `driver_phone`,
            `start_time`, `end_time`, `duration_min`, `route_planned`, `route_actual`,
            `max_speed`, `speed_limit`, `is_abnormal`, `anomaly_type`,
            `anomaly_severity`, `anomaly_desc`, `report_status`
        ) VALUES (
            v_drive_id, v_vehicle_id, v_store_id, v_driver_name, v_driver_phone,
            v_start_time, v_end_time, v_duration_min, v_route_planned, v_route_actual,
            v_max_speed, v_speed_limit, v_is_abnormal, v_anomaly_type,
            v_anomaly_severity, v_anomaly_desc, v_report_status
        );

        SET t = t + 1;
    END WHILE;
END //
DELIMITER ;

CALL generate_test_drives();
DROP PROCEDURE IF EXISTS generate_test_drives;

-- ============================================================
-- 步骤 6：金融审批（200 条）
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_finance_approvals //
CREATE PROCEDURE generate_finance_approvals()
BEGIN
    DECLARE f INT DEFAULT 1;
    DECLARE v_approval_id VARCHAR(64);
    DECLARE v_vehicle_id VARCHAR(64);
    DECLARE v_vehicle_idx INT;
    DECLARE v_store_id VARCHAR(64);
    DECLARE v_store_idx INT;
    DECLARE v_customer_name VARCHAR(64);
    DECLARE v_loan_amount DECIMAL(12,2);
    DECLARE v_loan_term INT;
    DECLARE v_approver VARCHAR(64);
    DECLARE v_submit_time DATETIME;
    DECLARE v_approve_time DATETIME;
    DECLARE v_status VARCHAR(16);
    DECLARE v_reject_reason VARCHAR(512);
    DECLARE v_rand INT;
    DECLARE v_listed_date DATETIME;
    DECLARE v_name_idx INT;

    DECLARE customer_names VARCHAR(512) DEFAULT '张小明,李小红,王大伟,刘美丽,陈志强,杨丽娜,黄晓明,周雅婷,吴晓东,赵思琪,徐子豪,孙梦瑶,马俊峰,朱婉清,胡建国,郭美玲,何志强,林清霞,罗俊杰,高秀兰';

    WHILE f <= 200 DO
        SET v_approval_id = CONCAT('FA', LPAD(f, 7, '0'));

        -- 车辆：从500辆车中选取 source_type=finance 或 finance_status非未提交的
        SET v_vehicle_idx = ((f - 1) * 500 DIV 200) + 1;
        IF v_vehicle_idx > 500 THEN SET v_vehicle_idx = 500; END IF;
        SET v_vehicle_id = CONCAT('VH', LPAD(v_vehicle_idx, 6, '0'));

        -- 门店
        SET v_store_idx = ((v_vehicle_idx - 1) MOD 10) + 1;
        SET v_store_id = CONCAT('ST', LPAD(v_store_idx, 3, '0'));

        -- 客户
        SET v_name_idx = ((f - 1) MOD 20) + 1;
        SET v_customer_name = SUBSTRING_INDEX(SUBSTRING_INDEX(customer_names, ',', v_name_idx), ',', -1);

        -- loan_amount：50000~500000
        SET v_loan_amount = 50000 + ((f * 4723) MOD 450001);

        -- loan_term：12/24/36/48/60
        SET v_loan_term = ELT(((f - 1) MOD 5) + 1, 12, 24, 36, 48, 60);

        -- 审批人
        SET v_approver = ELT(((f - 1) MOD 5) + 1, '审批员-王芳', '审批员-李明', '审批员-张华', '审批员-刘洋', '审批员-陈静');

        -- 基于车辆的 listed_date
        SET v_rand = ((f * 7) MOD 60);
        SET v_submit_time = DATE_ADD('2026-06-19', INTERVAL -v_rand DAY);
        SET v_submit_time = DATE_ADD(v_submit_time, INTERVAL ((f * 31) MOD 600) MINUTE);

        -- 状态分布：未提交 10%/审批中 20%/已审批 55%/已拒绝 15%
        SET v_rand = (f MOD 100) + 1;
        IF v_rand <= 10 THEN
            SET v_status = '未提交';
            SET v_submit_time = NULL;
            SET v_approve_time = NULL;
            SET v_reject_reason = NULL;
            SET v_approver = NULL;
        ELSEIF v_rand <= 30 THEN
            SET v_status = '审批中';
            SET v_approve_time = NULL;
            SET v_reject_reason = NULL;
        ELSEIF v_rand <= 85 THEN
            SET v_status = '已审批';
            SET v_approve_time = DATE_ADD(v_submit_time, INTERVAL (1 + ((f MOD 4))) DAY);
            SET v_reject_reason = NULL;
        ELSE
            SET v_status = '已拒绝';
            SET v_approve_time = DATE_ADD(v_submit_time, INTERVAL (1 + ((f MOD 3))) DAY);
            SET v_reject_reason = ELT(((f - 1) MOD 4) + 1,
                '客户征信记录不良，存在多次逾期记录',
                '收入证明材料不足，还款能力存疑',
                '车辆评估价与贷款金额比例超标',
                '客户资料真实性存疑，电话核实未通过'
            );
        END IF;

        INSERT INTO `t_finance_approval` (
            `approval_id`, `vehicle_id`, `store_id`, `customer_name`,
            `loan_amount`, `loan_term`, `approver`, `submit_time`,
            `approve_time`, `status`, `reject_reason`
        ) VALUES (
            v_approval_id, v_vehicle_id, v_store_id, v_customer_name,
            v_loan_amount, v_loan_term, v_approver, v_submit_time,
            v_approve_time, v_status, v_reject_reason
        );

        SET f = f + 1;
    END WHILE;
END //
DELIMITER ;

CALL generate_finance_approvals();
DROP PROCEDURE IF EXISTS generate_finance_approvals;

-- ============================================================
-- 步骤 7：筛选视图（至少 3 个，包含「早会默认口径」）
-- ============================================================

INSERT INTO `t_filter_view` (`view_id`, `name`, `is_default`, `filters_json`, `creator`) VALUES
(
    'VIEW_DEFAULT_001',
    '早会默认口径',
    1,
    JSON_OBJECT(
        'storeIds', JSON_ARRAY('ST001','ST002','ST003','ST004','ST005','ST006','ST007','ST008','ST009','ST010'),
        'startDate', '2026-05-21',
        'endDate', '2026-06-19',
        'brands', JSON_ARRAY(),
        'sourceTypes', JSON_ARRAY(),
        'vehicleCondition', JSON_ARRAY()
    ),
    'system'
),
(
    'VIEW_SHANGHAI_LUXURY_002',
    '上海热销品牌',
    0,
    JSON_OBJECT(
        'storeIds', JSON_ARRAY('ST002'),
        'startDate', '2026-04-20',
        'endDate', '2026-06-19',
        'brands', JSON_ARRAY('宝马','奔驰','奥迪'),
        'sourceTypes', JSON_ARRAY(),
        'vehicleCondition', JSON_ARRAY()
    ),
    '运营-李明'
),
(
    'VIEW_SLOW_MOVING_003',
    '滞销车源清查',
    0,
    JSON_OBJECT(
        'storeIds', JSON_ARRAY(),
        'startDate', '2026-04-20',
        'endDate', '2026-06-19',
        'brands', JSON_ARRAY(),
        'sourceTypes', JSON_ARRAY(),
        'vehicleCondition', JSON_ARRAY('一般','较差')
    ),
    '运营-王芳'
);

-- ============================================================
-- 步骤 8：分享链接（至少 1 条，对应前端 mock 的 token）
-- ============================================================

INSERT INTO `t_share_link` (
    `token`, `view_id`, `filters_json`, `permissions_json`,
    `includes_turnover_metrics`, `creator`, `expires_at`, `is_valid`
) VALUES (
    'share_abc123def456',
    'VIEW_DEFAULT_001',
    JSON_OBJECT(
        'storeIds', JSON_ARRAY('ST001','ST002','ST003','ST004','ST005','ST006','ST007','ST008','ST009','ST010'),
        'startDate', '2026-05-21',
        'endDate', '2026-06-19',
        'brands', JSON_ARRAY(),
        'sourceTypes', JSON_ARRAY(),
        'vehicleCondition', JSON_ARRAY()
    ),
    JSON_ARRAY('view', 'export'),
    1,
    '运营-张总',
    DATE_ADD('2026-06-19 08:00:00', INTERVAL 30 DAY),
    1
);

-- ============================================================
-- 步骤 9：库存周转日统计（最近 60 天每天，每店）
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_daily_snapshots //
CREATE PROCEDURE generate_daily_snapshots()
BEGIN
    DECLARE d INT DEFAULT 0;
    DECLARE s INT DEFAULT 1;
    DECLARE v_snapshot_date DATE;
    DECLARE v_store_id VARCHAR(64);
    DECLARE v_opening INT;
    DECLARE v_new_listed INT;
    DECLARE v_delisted INT;
    DECLARE v_sold INT;
    DECLARE v_closing INT;
    DECLARE v_avg_turnover DECIMAL(8,2);
    DECLARE v_fast INT;
    DECLARE v_slow INT;
    DECLARE v_rand INT;
    DECLARE v_base INT;

    -- 为每店初始化 opening 基准
    CREATE TEMPORARY TABLE IF NOT EXISTS store_opening (
        store_idx INT PRIMARY KEY,
        opening_count INT DEFAULT 0
    );
    SET s = 1;
    WHILE s <= 10 DO
        INSERT INTO store_opening (store_idx, opening_count) VALUES (s, 80 + s * 3)
        ON DUPLICATE KEY UPDATE opening_count = 80 + s * 3;
        SET s = s + 1;
    END WHILE;

    -- 从最早的日期开始，向前生成60天
    SET d = 59;
    WHILE d >= 0 DO
        SET v_snapshot_date = DATE_ADD('2026-06-19', INTERVAL -d DAY);

        SET s = 1;
        WHILE s <= 10 DO
            SET v_store_id = CONCAT('ST', LPAD(s, 3, '0'));

            -- 从临时表获取期初
            SELECT opening_count INTO v_opening FROM store_opening WHERE store_idx = s;

            -- 基于车辆实际上架聚合（每天每店大约 0~2 辆上架，500辆/60天/10店≈0.83）
            SET v_rand = ((d + s * 7) MOD 10);
            IF v_rand < 2 THEN
                SET v_new_listed = 0;
            ELSEIF v_rand < 8 THEN
                SET v_new_listed = 1;
            ELSE
                SET v_new_listed = 2;
            END IF;

            -- 下架/成交
            SET v_rand = ((d * 3 + s * 5) MOD 10);
            IF v_rand < 3 THEN
                SET v_delisted = 0;
            ELSEIF v_rand < 8 THEN
                SET v_delisted = 1;
            ELSE
                SET v_delisted = 2;
            END IF;

            -- sold_count 约为 delisted 的 70%
            SET v_sold = FLOOR(v_delisted * 0.7);
            IF v_sold > v_delisted THEN SET v_sold = v_delisted; END IF;

            -- 期末
            SET v_closing = v_opening + v_new_listed - v_delisted;
            IF v_closing < 0 THEN SET v_closing = 0; END IF;

            -- avg_turnover_days：中心约38，每店有±8的差异
            SET v_base = 38 + s - 5;
            SET v_avg_turnover = v_base - 2 + ((d * 13 + s * 7) MOD 5) * 0.5;
            IF v_avg_turnover < 25 THEN SET v_avg_turnover = 25.00; END IF;
            IF v_avg_turnover > 55 THEN SET v_avg_turnover = 55.00; END IF;

            -- 快消/滞销：按期末库存比例
            SET v_fast = FLOOR(v_closing * (0.30 + ((d * 3 + s) MOD 10) / 50));
            SET v_slow = FLOOR(v_closing * (0.12 + ((d * 5 + s * 2) MOD 10) / 60));
            IF v_fast + v_slow > v_closing THEN
                SET v_slow = v_closing - v_fast - 5;
                IF v_slow < 0 THEN SET v_slow = 0; END IF;
            END IF;

            INSERT INTO `t_inventory_daily_snapshot` (
                `snapshot_date`, `store_id`, `opening_count`, `new_listed`,
                `delisted`, `sold_count`, `closing_count`, `avg_turnover_days`,
                `fast_moving_count`, `slow_moving_count`
            ) VALUES (
                v_snapshot_date, v_store_id, v_opening, v_new_listed,
                v_delisted, v_sold, v_closing, v_avg_turnover,
                v_fast, v_slow
            );

            -- 更新下一期初
            UPDATE store_opening SET opening_count = v_closing WHERE store_idx = s;

            SET s = s + 1;
        END WHILE;

        SET d = d - 1;
    END WHILE;

    DROP TEMPORARY TABLE IF EXISTS store_opening;
END //
DELIMITER ;

CALL generate_daily_snapshots();
DROP PROCEDURE IF EXISTS generate_daily_snapshots;

-- ============================================================
-- 步骤 10：数据源同步日志（各数据源最近 1 条）
-- ============================================================

INSERT INTO `t_datasource_sync_log` (`source_name`, `sync_time`, `status`, `record_count`, `error_message`) VALUES
('inspection', '2026-06-19 08:58:00', 'online', 450, NULL),
('finance',    '2026-06-19 08:55:00', 'online', 200, NULL),
('inventory',  '2026-06-19 08:45:00', 'delayed', 500, '上游车源库同步延迟，较预期晚12分钟');

-- ============================================================
-- 数据生成完成 - 验证统计
-- ============================================================
SELECT '数据初始化完成' AS status;
SELECT
    (SELECT COUNT(*) FROM t_store) AS store_count,
    (SELECT COUNT(*) FROM t_vehicle_source) AS vehicle_count,
    (SELECT COUNT(*) FROM t_inspection_report) AS inspection_report_count,
    (SELECT COUNT(*) FROM t_prep_item) AS prep_item_count,
    (SELECT COUNT(*) FROM t_test_drive) AS test_drive_count,
    (SELECT COUNT(*) FROM t_finance_approval) AS finance_approval_count,
    (SELECT COUNT(*) FROM t_filter_view) AS filter_view_count,
    (SELECT COUNT(*) FROM t_share_link) AS share_link_count,
    (SELECT COUNT(*) FROM t_inventory_daily_snapshot) AS snapshot_count,
    (SELECT COUNT(*) FROM t_datasource_sync_log) AS sync_log_count;
