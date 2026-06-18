using System.Collections.Generic;
using UnityEngine;
using UsedCarGame.Data;

namespace UsedCarGame.Data
{
    public static class SampleLevelFactory
    {
        public static LevelConfig CreateLevel_001()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = "level_001";
            config.levelName = "新手训练：入门收车";
            config.description = "学习识别基础的报价历史和金融资料，适合初入行的收购专员练习。";
            config.difficulty = 1;
            config.totalTimeSeconds = 180f;
            config.warningThresholdSeconds = 30f;
            config.questionsPerSession = 5;
            config.randomizeOrder = true;
            config.minCorrectForPass = 3;
            config.maxErrorRateForPass = 0.4f;
            config.baseCorrectScore = 100;
            config.timeBonusPerSecond = 2;
            config.consecutiveCorrectBonus = 50;
            config.errorPenalty = 30;
            config.targetInventoryDays = 14f;
            config.maxInventoryDaysForRating = 45f;

            config.questionPool = new List<QuestionData>
            {
                CreateQuestion_001(),
                CreateQuestion_002(),
                CreateQuestion_003(),
                CreateQuestion_004(),
                CreateQuestion_005(),
                CreateQuestion_006(),
                CreateQuestion_007()
            };

            return config;
        }

        private static QuestionData CreateQuestion_001()
        {
            return new QuestionData
            {
                questionId = "q_001",
                type = QuestionType.PriceHistory,
                timeLimit = 30f,
                vehicle = new VehicleInfo
                {
                    brand = "大众",
                    model = "朗逸 2019款 1.5L 自动舒适版",
                    year = 2019,
                    mileage = 45000,
                    color = "白色",
                    plateNumber = "京A·12345",
                    vin = "LFV2A21K1K3001234"
                },
                askedPrice = 85000f,
                estimatedMarketPrice = 82000f,
                minAcceptableMargin = 3000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-6), price = 95000f, source = "平台均价", region = "北京" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-3), price = 88000f, source = "平台均价", region = "北京" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 83000f, source = "平台均价", region = "北京" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-7), price = 81000f, source = "同区域成交", region = "北京" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "张三",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string>()
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-4),
                    lastTransferDate = System.DateTime.Now.AddYears(-4),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(2),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "李师傅",
                    inspectionDate = System.DateTime.Now.AddDays(-1),
                    overallScore = 85f,
                    items = new List<InspectionItem>(),
                    majorIssues = new List<string>(),
                    summary = "车况良好，无重大事故，外观少量划痕。"
                },
                correctDecision = DecisionAction.Reject,
                explanation = "卖家报价8.5万，近期同区域成交价8.1万，市场价8.2万。报价高于市场价3000元，扣除正常利润空间后不满足最低利润要求，建议拒绝。"
            };
        }

        private static QuestionData CreateQuestion_002()
        {
            return new QuestionData
            {
                questionId = "q_002",
                type = QuestionType.FinancialDocument,
                timeLimit = 30f,
                vehicle = new VehicleInfo
                {
                    brand = "丰田",
                    model = "卡罗拉 2020款 1.2T S-CVT GL",
                    year = 2020,
                    mileage = 32000,
                    color = "银色",
                    plateNumber = "沪B·67890",
                    vin = "LFMAP86C1L0123456"
                },
                askedPrice = 98000f,
                estimatedMarketPrice = 102000f,
                minAcceptableMargin = 4000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-3), price = 108000f, source = "平台均价", region = "上海" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-14), price = 103000f, source = "同区域成交", region = "上海" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证+购置税",
                    ownerName = "李四",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "4S店全程保养记录" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-3),
                    lastTransferDate = System.DateTime.Now.AddYears(-3),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(8),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "王师傅",
                    inspectionDate = System.DateTime.Now.AddDays(-2),
                    overallScore = 92f,
                    items = new List<InspectionItem>(),
                    majorIssues = new List<string>(),
                    summary = "准新车状态，全程4S保养，无任何事故记录。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "卖家报价9.8万，市场价10.2万，利润空间约4000元。无贷款无抵押无事故，车况优秀，可立即收购。"
            };
        }

        private static QuestionData CreateQuestion_003()
        {
            return new QuestionData
            {
                questionId = "q_003",
                type = QuestionType.VehicleRecord,
                timeLimit = 30f,
                vehicle = new VehicleInfo
                {
                    brand = "本田",
                    model = "雅阁 2018款 260TURBO 豪华版",
                    year = 2018,
                    mileage = 78000,
                    color = "黑色",
                    plateNumber = "粤C·55555",
                    vin = "LHGCR2639JA098765"
                },
                askedPrice = 125000f,
                estimatedMarketPrice = 130000f,
                minAcceptableMargin = 4000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 135000f, source = "平台均价", region = "广州" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-10), price = 129000f, source = "同区域成交", region = "广州" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "王五",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string>()
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 3,
                    transferCount = 2,
                    firstRegisterDate = System.DateTime.Now.AddYears(-5),
                    lastTransferDate = System.DateTime.Now.AddMonths(-1),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(1),
                    violationRecords = new List<string> { "超速(未处理)", "违停(未处理)" }
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "赵师傅",
                    inspectionDate = System.DateTime.Now.AddDays(-1),
                    overallScore = 78f,
                    items = new List<InspectionItem>(),
                    majorIssues = new List<string>(),
                    summary = "车况一般，内饰磨损较大，需处理违章后过户。"
                },
                correctDecision = DecisionAction.NeedMoreInfo,
                explanation = "车辆5年过户3次，刚过户一个月又要出售，存在风险。另有未处理违章需要核实，建议补充调查过户原因和完整保养记录。"
            };
        }

        private static QuestionData CreateQuestion_004()
        {
            return new QuestionData
            {
                questionId = "q_004",
                type = QuestionType.InspectionReport,
                timeLimit = 40f,
                vehicle = new VehicleInfo
                {
                    brand = "宝马",
                    model = "3系 2021款 325Li M运动套装",
                    year = 2021,
                    mileage = 15000,
                    color = "蓝色",
                    plateNumber = "浙A·88888",
                    vin = "WBA8B3109MK876543"
                },
                askedPrice = 265000f,
                estimatedMarketPrice = 280000f,
                minAcceptableMargin = 8000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 285000f, source = "平台均价", region = "杭州" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-5), price = 278000f, source = "同区域成交", region = "杭州" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "陈六",
                    hasLoan = true,
                    loanBalance = 80000f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = true,
                    flags = new List<string> { "4S店贷款中" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-2),
                    lastTransferDate = System.DateTime.Now.AddYears(-2),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(10),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "孙师傅",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 72f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "底盘", itemName = "前防撞梁", condition = "严重变形", description = "需更换", estimatedRepairCost = 15000f },
                        new InspectionItem { category = "底盘", itemName = "纵梁", condition = "轻微变形", description = "建议修复", estimatedRepairCost = 8000f },
                        new InspectionItem { category = "外观", itemName = "前引擎盖", condition = "更换", description = "已更换非原厂件", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string> { "重大结构性损伤", "纵梁变形", "安全气囊更换记录待核实" },
                    summary = "疑似发生正面重大碰撞事故，底盘结构件受损严重。"
                },
                correctDecision = DecisionAction.Reject,
                explanation = "检测报告显示前防撞梁严重变形、纵梁轻微变形，属于重大事故车。虽然报价低于市场价，但事故车处置难度大、风险高，建议拒绝。"
            };
        }

        private static QuestionData CreateQuestion_005()
        {
            return new QuestionData
            {
                questionId = "q_005",
                type = QuestionType.InspectionReport,
                timeLimit = 40f,
                vehicle = new VehicleInfo
                {
                    brand = "奔驰",
                    model = "C级 2020款 C 260 L 运动版",
                    year = 2020,
                    mileage = 28000,
                    color = "红色",
                    plateNumber = "苏A·33333",
                    vin = "LE4ZG8DB9LL567890"
                },
                askedPrice = 255000f,
                estimatedMarketPrice = 268000f,
                minAcceptableMargin = 6000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 275000f, source = "平台均价", region = "南京" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证+保险单",
                    ownerName = "周七",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "4S店延保服务剩余1年" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-3),
                    lastTransferDate = System.DateTime.Now.AddYears(-3),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(6),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "吴师傅",
                    inspectionDate = System.DateTime.Now.AddDays(-3),
                    overallScore = 88f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "外观", itemName = "后保险杠", condition = "喷漆", description = "局部喷漆修复，色差不明显", estimatedRepairCost = 0f },
                        new InspectionItem { category = "轮胎", itemName = "右前轮胎", condition = "更换", description = "同品牌轮胎更换", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string>(),
                    summary = "车况优秀，仅小范围外观修复，女士代步车。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "报价25.5万，市场价26.8万，利润空间充足。检测报告仅显示小范围外观修复，无结构损伤。一手车无贷款，建议立即收购。"
            };
        }

        private static QuestionData CreateQuestion_006()
        {
            return new QuestionData
            {
                questionId = "q_006",
                type = QuestionType.FinancialDocument,
                timeLimit = 35f,
                vehicle = new VehicleInfo
                {
                    brand = "奥迪",
                    model = "A4L 2019款 40 TFSI 时尚型",
                    year = 2019,
                    mileage = 56000,
                    color = "灰色",
                    plateNumber = "川A·77777",
                    vin = "LFV3A28W9K3012345"
                },
                askedPrice = 195000f,
                estimatedMarketPrice = 210000f,
                minAcceptableMargin = 5000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 215000f, source = "平台均价", region = "成都" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "吴八",
                    hasLoan = true,
                    loanBalance = 120000f,
                    hasAccidentRecord = true,
                    accidentCount = 1,
                    isMortgaged = true,
                    flags = new List<string> { "出险记录：8万（2022年）", "贷款剩余24期" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 2,
                    transferCount = 1,
                    firstRegisterDate = System.DateTime.Now.AddYears(-4),
                    lastTransferDate = System.DateTime.Now.AddYears(-2),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(3),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "郑师傅",
                    inspectionDate = System.DateTime.Now.AddDays(-2),
                    overallScore = 75f,
                    items = new List<InspectionItem>(),
                    majorIssues = new List<string>(),
                    summary = "车况尚可，漆面修复较多。"
                },
                correctDecision = DecisionAction.NeedMoreInfo,
                explanation = "存在贷款余额12万，需要确认卖方能否自行结清。出险记录8万需核实具体事故类型和受损部位。建议补充信息后再做决策。"
            };
        }

        private static QuestionData CreateQuestion_007()
        {
            return new QuestionData
            {
                questionId = "q_007",
                type = QuestionType.PriceHistory,
                timeLimit = 30f,
                vehicle = new VehicleInfo
                {
                    brand = "日产",
                    model = "轩逸 2021款 1.6L XL CVT悦享版",
                    year = 2021,
                    mileage = 22000,
                    color = "珍珠白",
                    plateNumber = "鲁B·22222",
                    vin = "LGBH72E08M4567890"
                },
                askedPrice = 102000f,
                estimatedMarketPrice = 110000f,
                minAcceptableMargin = 4000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-3), price = 118000f, source = "平台均价", region = "青岛" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-7), price = 109000f, source = "同区域成交", region = "青岛" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证+购置税",
                    ownerName = "郑九",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "4S店全程保养" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-2),
                    lastTransferDate = System.DateTime.Now.AddYears(-2),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(9),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "冯师傅",
                    inspectionDate = System.DateTime.Now.AddDays(-1),
                    overallScore = 90f,
                    items = new List<InspectionItem>(),
                    majorIssues = new List<string>(),
                    summary = "准新车，车况极佳，个人一手。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "报价10.2万，市场价约11万，利润空间充足。车况好、无贷款无事故、保养记录齐全，属于优质车源，建议立即收购。"
            };
        }

        public static LevelConfig CreateLevel_002()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = "level_002";
            config.levelName = "进阶考核：事故车鉴别";
            config.description = "重点训练检测报告阅读和重大事故车识别，面向有经验的收购专员。";
            config.difficulty = 2;
            config.totalTimeSeconds = 240f;
            config.warningThresholdSeconds = 45f;
            config.questionsPerSession = 6;
            config.randomizeOrder = true;
            config.minCorrectForPass = 4;
            config.maxErrorRateForPass = 0.35f;
            config.baseCorrectScore = 150;
            config.timeBonusPerSecond = 3;
            config.consecutiveCorrectBonus = 80;
            config.errorPenalty = 60;
            config.targetInventoryDays = 21f;
            config.maxInventoryDaysForRating = 60f;

            config.questionPool = new List<QuestionData>();
            return config;
        }

        public static LevelConfig CreateLevel_003()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = "level_003";
            config.levelName = "检测报告专项：深度评估";
            config.description = "围绕检测报告的专项训练，练习从检测项中提取关键信息、判断事故风险与修复成本。";
            config.difficulty = 3;
            config.totalTimeSeconds = 300f;
            config.warningThresholdSeconds = 60f;
            config.questionsPerSession = 5;
            config.randomizeOrder = false;
            config.minCorrectForPass = 4;
            config.maxErrorRateForPass = 0.25f;
            config.baseCorrectScore = 200;
            config.timeBonusPerSecond = 4;
            config.consecutiveCorrectBonus = 100;
            config.errorPenalty = 80;
            config.targetInventoryDays = 10f;
            config.maxInventoryDaysForRating = 35f;

            config.questionPool = new List<QuestionData>
            {
                CreateQuestion_003_01(),
                CreateQuestion_003_02(),
                CreateQuestion_003_03(),
                CreateQuestion_003_04(),
                CreateQuestion_003_05()
            };

            return config;
        }

        private static QuestionData CreateQuestion_003_01()
        {
            return new QuestionData
            {
                questionId = "q_003_01",
                type = QuestionType.InspectionReport,
                timeLimit = 60f,
                vehicle = new VehicleInfo
                {
                    brand = "宝马",
                    model = "5系 2020款 530Li 尊享型 M运动",
                    year = 2020,
                    mileage = 38000,
                    color = "黑色",
                    plateNumber = "京C·11111",
                    vin = "WBAJB1105LCZ12345"
                },
                askedPrice = 335000f,
                estimatedMarketPrice = 350000f,
                minAcceptableMargin = 10000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 362000f, source = "平台均价", region = "北京" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-10), price = 355000f, source = "同区域成交", region = "北京" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "钱一",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string>()
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-3),
                    lastTransferDate = System.DateTime.Now.AddYears(-3),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(4),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "张检",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 65f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "底盘", itemName = "左后纵梁", condition = "变形修复", description = "纵梁修复痕迹明显，焊点不规整", estimatedRepairCost = 12000f },
                        new InspectionItem { category = "底盘", itemName = "后防撞梁", condition = "更换", description = "非原厂件，螺丝有拧动痕迹", estimatedRepairCost = 3000f },
                        new InspectionItem { category = "外观", itemName = "左后翼子板", condition = "切割更换", description = "翼子板切割焊接，密封胶不均匀", estimatedRepairCost = 5000f },
                        new InspectionItem { category = "电气", itemName = "左后门车窗", condition = "异响", description = "升降异响，导轨变形", estimatedRepairCost = 1500f }
                    },
                    majorIssues = new List<string> { "左后纵梁变形修复", "后防撞梁非原厂更换", "左后翼子板切割焊接" },
                    summary = "左后方曾发生严重碰撞，纵梁修复不规整，属于重大事故车。"
                },
                correctDecision = DecisionAction.Reject,
                explanation = "纵梁变形修复+后防撞梁更换+翼子板切割，三重证据指向左后重大碰撞事故。纵梁修复不规整存在安全隐患，重大事故车无论报价多低都应拒绝收购。"
            };
        }

        private static QuestionData CreateQuestion_003_02()
        {
            return new QuestionData
            {
                questionId = "q_003_02",
                type = QuestionType.InspectionReport,
                timeLimit = 50f,
                vehicle = new VehicleInfo
                {
                    brand = "特斯拉",
                    model = "Model 3 2022款 标准续航升级版",
                    year = 2022,
                    mileage = 18000,
                    color = "白色",
                    plateNumber = "沪D·22222",
                    vin = "5YJ3E1EA9LF654321"
                },
                askedPrice = 208000f,
                estimatedMarketPrice = 225000f,
                minAcceptableMargin = 8000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 232000f, source = "平台均价", region = "上海" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-5), price = 226000f, source = "同区域成交", region = "上海" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "孙二",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "无贷款", "首任车主" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-2),
                    lastTransferDate = System.DateTime.Now.AddYears(-2),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(6),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "李检",
                    inspectionDate = System.DateTime.Now.AddDays(-1),
                    overallScore = 91f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "外观", itemName = "前保险杠", condition = "喷漆", description = "前杠局部喷漆，色差轻微", estimatedRepairCost = 0f },
                        new InspectionItem { category = "电池", itemName = "电池健康度", condition = "良好", description = "SOH 96%，衰减正常范围", estimatedRepairCost = 0f },
                        new InspectionItem { category = "轮胎", itemName = "四轮胎", condition = "磨损正常", description = "原厂胎，花纹深度5mm以上", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string>(),
                    summary = "准新车状态，仅前杠小范围喷漆，电池健康度优秀。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "报价20.8万，市场价22.5万，利润空间1.7万。电池SOH 96%优秀，仅前杠轻微喷漆不影响价值，一手无贷款无事故，应立即收购。"
            };
        }

        private static QuestionData CreateQuestion_003_03()
        {
            return new QuestionData
            {
                questionId = "q_003_03",
                type = QuestionType.InspectionReport,
                timeLimit = 55f,
                vehicle = new VehicleInfo
                {
                    brand = "奔驰",
                    model = "GLC 2021款 GLC 300 L 4MATIC 动感型",
                    year = 2021,
                    mileage = 42000,
                    color = "银色",
                    plateNumber = "粤E·33333",
                    vin = "LE4BG3DB5ML987654"
                },
                askedPrice = 308000f,
                estimatedMarketPrice = 320000f,
                minAcceptableMargin = 8000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 332000f, source = "平台均价", region = "深圳" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证+保险单",
                    ownerName = "周三",
                    hasLoan = true,
                    loanBalance = 95000f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = true,
                    flags = new List<string> { "银行贷款剩余9.5万" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-3),
                    lastTransferDate = System.DateTime.Now.AddYears(-3),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(2),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "王检",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 82f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "发动机", itemName = "正时链轮", condition = "异响", description = "冷启动异响，疑似正时链轮磨损", estimatedRepairCost = 8000f },
                        new InspectionItem { category = "外观", itemName = "右前门", condition = "喷漆", description = "右前门喷漆修复，色差正常", estimatedRepairCost = 0f },
                        new InspectionItem { category = "底盘", itemName = "右前减震器", condition = "渗油", description = "减震器轻微渗油，暂不影响使用", estimatedRepairCost = 3500f }
                    },
                    majorIssues = new List<string> { "正时链轮异响需确认" },
                    summary = "车况中等偏上，正时链轮异响需关注，减震器渗油轻微。"
                },
                correctDecision = DecisionAction.NeedMoreInfo,
                explanation = "正时链轮异响是奔驰M264发动机已知通病，维修费用约8000元，但需确认是否在厂家延保范围内。贷款9.5万需确认卖方能否结清。建议补充发动机检测报告和贷款结清方案后再决策。"
            };
        }

        private static QuestionData CreateQuestion_003_04()
        {
            return new QuestionData
            {
                questionId = "q_003_04",
                type = QuestionType.InspectionReport,
                timeLimit = 60f,
                vehicle = new VehicleInfo
                {
                    brand = "保时捷",
                    model = "Macan 2020款 Macan 2.0T",
                    year = 2020,
                    mileage = 25000,
                    color = "红色",
                    plateNumber = "浙F·44444",
                    vin = "WP1AB2A59LLB12345"
                },
                askedPrice = 458000f,
                estimatedMarketPrice = 480000f,
                minAcceptableMargin = 15000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 495000f, source = "平台均价", region = "杭州" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "吴四",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string>()
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 2,
                    transferCount = 1,
                    firstRegisterDate = System.DateTime.Now.AddYears(-4),
                    lastTransferDate = System.DateTime.Now.AddYears(-1),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(5),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "赵检",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 55f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "发动机", itemName = "气缸壁", condition = "拉缸", description = "3号缸壁有明显拉痕", estimatedRepairCost = 45000f },
                        new InspectionItem { category = "发动机", itemName = "涡轮增压器", condition = "异响", description = "急加速涡轮异响，轴承磨损", estimatedRepairCost = 18000f },
                        new InspectionItem { category = "变速箱", itemName = "PDK离合器", condition = "打滑", description = "高转速离合器打滑，需更换", estimatedRepairCost = 32000f },
                        new InspectionItem { category = "底盘", itemName = "前悬挂塔顶", condition = "变形", description = "左右塔顶高度差3mm", estimatedRepairCost = 6000f }
                    },
                    majorIssues = new List<string> { "发动机拉缸", "涡轮增压器异响", "PDK离合器打滑", "前悬挂塔顶变形" },
                    summary = "发动机、变速箱、底盘三重问题，综合维修成本超10万，疑似激烈驾驶导致。"
                },
                correctDecision = DecisionAction.Reject,
                explanation = "3号缸拉缸+涡轮异响+PDK离合器打滑+塔顶变形，四大项维修预估超10万。即使报价低于市场2.2万，维修成本远超利润空间，且激烈驾驶车辆后续故障风险高，坚决拒绝。"
            };
        }

        private static QuestionData CreateQuestion_003_05()
        {
            return new QuestionData
            {
                questionId = "q_003_05",
                type = QuestionType.InspectionReport,
                timeLimit = 55f,
                vehicle = new VehicleInfo
                {
                    brand = "沃尔沃",
                    model = "S90 2021款 B5 智逸豪华版",
                    year = 2021,
                    mileage = 35000,
                    color = "灰色",
                    plateNumber = "川G·55555",
                    vin = "LVSHDFAL5MN654321"
                },
                askedPrice = 245000f,
                estimatedMarketPrice = 260000f,
                minAcceptableMargin = 6000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 268000f, source = "平台均价", region = "成都" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-8), price = 262000f, source = "同区域成交", region = "成都" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "郑五",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "全程4S保养" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-3),
                    lastTransferDate = System.DateTime.Now.AddYears(-3),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(7),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "钱检",
                    inspectionDate = System.DateTime.Now.AddDays(-1),
                    overallScore = 86f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "外观", itemName = "后保险杠", condition = "喷漆", description = "后杠局部喷漆，色差极轻微", estimatedRepairCost = 0f },
                        new InspectionItem { category = "内饰", itemName = "座椅", condition = "磨损正常", description = "真皮座椅轻微褶皱，正常使用痕迹", estimatedRepairCost = 0f },
                        new InspectionItem { category = "电子", itemName = "Sensus系统", condition = "正常", description = "车机系统运行正常，无故障码", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string>(),
                    summary = "车况优秀，仅后杠小范围喷漆，全程4S保养，安全配置齐全。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "报价24.5万，市场价26万，利润空间1.5万。检测评分86，仅后杠轻微喷漆，全程4S保养一手车无事故无贷款。沃尔沃安全口碑好，库存周转预期快，建议收购。"
            };
        }
    }
}
