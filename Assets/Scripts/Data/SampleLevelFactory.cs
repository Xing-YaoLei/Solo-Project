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

            config.questionPool = new List<QuestionData>
            {
                CreateQuestion_002_01(),
                CreateQuestion_002_02(),
                CreateQuestion_002_03(),
                CreateQuestion_002_04(),
                CreateQuestion_002_05(),
                CreateQuestion_002_06()
            };
            return config;
        }

        private static QuestionData CreateQuestion_002_01()
        {
            return new QuestionData
            {
                questionId = "q_002_01",
                type = QuestionType.FinancialDocument,
                timeLimit = 35f,
                vehicle = new VehicleInfo
                {
                    brand = "本田",
                    model = "雅阁 2018款 260TURBO 豪华版",
                    year = 2018,
                    mileage = 58000,
                    color = "黑色",
                    plateNumber = "粤C·A1B23",
                    vin = "LHGMC2630JA123456"
                },
                askedPrice = 138000f,
                estimatedMarketPrice = 148000f,
                minAcceptableMargin = 5000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 155000f, source = "平台均价", region = "深圳" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "王八",
                    hasLoan = true,
                    loanBalance = 45000f,
                    hasAccidentRecord = true,
                    accidentCount = 2,
                    isMortgaged = true,
                    flags = new List<string> { "2次出险记录", "抵押贷款中" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 2,
                    transferCount = 1,
                    firstRegisterDate = System.DateTime.Now.AddYears(-5),
                    lastTransferDate = System.DateTime.Now.AddYears(-2),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(1),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "赵师傅",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 70f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "底盘", itemName = "前防撞梁", condition = "变形", description = "轻度变形，未更换", estimatedRepairCost = 2000f },
                        new InspectionItem { category = "外观", itemName = "前保险杠", condition = "更换", description = "非原厂", estimatedRepairCost = 1500f }
                    },
                    majorIssues = new List<string> { "前防撞梁变形", "前杠更换" },
                    summary = "前方有追尾历史，防撞梁变形但未更换，属于一般事故车。"
                },
                correctDecision = DecisionAction.NeedMoreInfo,
                explanation = "报价13.8万，市场价14.8万，利润空间看似1万。但有2次出险+抵押贷款4.5万+前防撞梁变形，存在重大不确定性。需确认：1)卖方能否自行结清贷款；2)事故是否伤及纵梁；3)保险记录详细情况。建议补充信息后再决策。"
            };
        }

        private static QuestionData CreateQuestion_002_02()
        {
            return new QuestionData
            {
                questionId = "q_002_02",
                type = QuestionType.VehicleRecord,
                timeLimit = 40f,
                vehicle = new VehicleInfo
                {
                    brand = "奥迪",
                    model = "A4L 2019款 40 TFSI 时尚型",
                    year = 2019,
                    mileage = 52000,
                    color = "白色",
                    plateNumber = "浙D·98765",
                    vin = "LFV3A28W0K3987654"
                },
                askedPrice = 205000f,
                estimatedMarketPrice = 215000f,
                minAcceptableMargin = 6000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 220000f, source = "平台均价", region = "杭州" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-10), price = 216000f, source = "同区域成交", region = "杭州" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "周九",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "全程4S店保养" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 1,
                    transferCount = 0,
                    firstRegisterDate = System.DateTime.Now.AddYears(-4),
                    lastTransferDate = System.DateTime.Now.AddYears(-4),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(6),
                    violationRecords = new List<string> { "超速一次", "违停两次" }
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "钱师傅",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 88f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "外观", itemName = "后保险杠", condition = "喷漆", description = "后杠局部喷漆", estimatedRepairCost = 0f },
                        new InspectionItem { category = "轮胎", itemName = "前轮胎", condition = "更换", description = "非原厂，品牌一致", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string>(),
                    summary = "车况优秀，全程4S保养，仅后杠轻微喷漆。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "报价20.5万，市场价21.5万，利润1万。一手车无事故无贷款，全程4S保养，车况评分88。违停记录不影响车辆价值，奥迪品牌保值率高库存周转快，建议收购。"
            };
        }

        private static QuestionData CreateQuestion_002_03()
        {
            return new QuestionData
            {
                questionId = "q_002_03",
                type = QuestionType.InspectionReport,
                timeLimit = 50f,
                vehicle = new VehicleInfo
                {
                    brand = "日产",
                    model = "天籁 2020款 2.0L XL 舒适版",
                    year = 2020,
                    mileage = 42000,
                    color = "银色",
                    plateNumber = "苏E·45678",
                    vin = "LGBF5DE05LY123456"
                },
                askedPrice = 132000f,
                estimatedMarketPrice = 140000f,
                minAcceptableMargin = 4000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 148000f, source = "平台均价", region = "南京" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "吴十",
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
                    insuranceExpiry = System.DateTime.Now.AddMonths(5),
                    violationRecords = new List<string>()
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "孙师傅",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 55f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "发动机", itemName = "气缸", condition = "烧机油", description = "排气管明显蓝烟，2000公里烧1升", estimatedRepairCost = 20000f },
                        new InspectionItem { category = "变速箱", itemName = "CVT变速箱", condition = "顿挫", description = "低速换挡顿挫明显", estimatedRepairCost = 8000f },
                        new InspectionItem { category = "底盘", itemName = "减震器", condition = "渗油", description = "后减震器严重渗油", estimatedRepairCost = 3000f }
                    },
                    majorIssues = new List<string> { "发动机烧机油", "CVT变速箱顿挫", "后减震器渗油" },
                    summary = "发动机和变速箱都有问题，维修成本高，不建议收购。"
                },
                correctDecision = DecisionAction.Reject,
                explanation = "检测评分仅55分。发动机烧机油（维修约2万）+CVT变速箱顿挫（维修约8千）+减震器渗油，三大件有两项重大问题。即使报价低于市场8千，维修成本远超利润空间，且烧机油车辆后续维权风险高，坚决拒绝。"
            };
        }

        private static QuestionData CreateQuestion_002_04()
        {
            return new QuestionData
            {
                questionId = "q_002_04",
                type = QuestionType.PriceHistory,
                timeLimit = 35f,
                vehicle = new VehicleInfo
                {
                    brand = "别克",
                    model = "君威 2021款 552T 精英型",
                    year = 2021,
                    mileage = 28000,
                    color = "灰色",
                    plateNumber = "鲁F·12321",
                    vin = "LSGGA53H0MF123456"
                },
                askedPrice = 128000f,
                estimatedMarketPrice = 135000f,
                minAcceptableMargin = 4000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-6), price = 158000f, source = "平台均价", region = "青岛" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-3), price = 145000f, source = "平台均价", region = "青岛" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 138000f, source = "平台均价", region = "青岛" },
                    new PriceHistoryEntry { date = System.DateTime.Now.AddDays(-5), price = 132000f, source = "同区域成交", region = "青岛" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证+保险单",
                    ownerName = "郑十一",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "一手车" }
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
                    inspectionDate = System.DateTime.Now,
                    overallScore = 82f,
                    items = new List<InspectionItem>(),
                    majorIssues = new List<string>(),
                    summary = "车况良好，无事故无维修，正常使用痕迹。"
                },
                correctDecision = DecisionAction.NeedMoreInfo,
                explanation = "报价12.8万，当前市场价13.5万，利润空间7千。但近6个月价格从15.8万暴跌至13.2万，月均跌幅超过4%，车型贬值速度异常。需要确认：1)是否存在改款换代消息；2)同车型新车终端优惠幅度；3)该车型近期销量走势。否则可能出现收车后继续贬值的风险。"
            };
        }

        private static QuestionData CreateQuestion_002_05()
        {
            return new QuestionData
            {
                questionId = "q_002_05",
                type = QuestionType.InspectionReport,
                timeLimit = 45f,
                vehicle = new VehicleInfo
                {
                    brand = "马自达",
                    model = "阿特兹 2020款 2.5L 蓝天运动版",
                    year = 2020,
                    mileage = 35000,
                    color = "红色",
                    plateNumber = "闽G·54321",
                    vin = "LFPM5ACP8M1987654"
                },
                askedPrice = 145000f,
                estimatedMarketPrice = 158000f,
                minAcceptableMargin = 5000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-2), price = 165000f, source = "平台均价", region = "厦门" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "陈十二",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = true,
                    accidentCount = 1,
                    isMortgaged = false,
                    flags = new List<string> { "一次出险记录" }
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
                    inspectorName = "褚师傅",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 78f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "外观", itemName = "右后门", condition = "钣金修复", description = "明显钣金痕迹，漆面厚度超标", estimatedRepairCost = 2000f },
                        new InspectionItem { category = "外观", itemName = "右后翼子板", condition = "喷漆", description = "整喷修复", estimatedRepairCost = 1500f },
                        new InspectionItem { category = "内饰", itemName = "A柱内饰板", condition = "拆装痕迹", description = "卡扣有撬动痕迹", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string> { "右后门钣金修复", "右后翼子板喷漆" },
                    summary = "右侧有碰撞修复痕迹，B柱和纵梁正常，属于一般剐蹭事故。"
                },
                correctDecision = DecisionAction.Approve,
                explanation = "报价14.5万，市场价15.8万，利润1.3万。检测评分78，右后门钣金+右后翼子板喷漆属于普通事故，不影响结构安全。马自达创驰蓝天发动机口碑好，红色是阿特兹畅销色。只要收购价合理、利润空间足够，可以收购。"
            };
        }

        private static QuestionData CreateQuestion_002_06()
        {
            return new QuestionData
            {
                questionId = "q_002_06",
                type = QuestionType.VehicleRecord,
                timeLimit = 30f,
                vehicle = new VehicleInfo
                {
                    brand = "雪佛兰",
                    model = "迈锐宝XL 2019款 535T CVT锐动版",
                    year = 2019,
                    mileage = 85000,
                    color = "黑色",
                    plateNumber = "冀H·13579",
                    vin = "LSGZR53H2KU123456"
                },
                askedPrice = 78000f,
                estimatedMarketPrice = 85000f,
                minAcceptableMargin = 3000f,
                priceHistory = new List<PriceHistoryEntry>
                {
                    new PriceHistoryEntry { date = System.DateTime.Now.AddMonths(-1), price = 88000f, source = "平台均价", region = "石家庄" }
                },
                financialDoc = new FinancialDocument
                {
                    documentType = "登记证+行驶证",
                    ownerName = "韩十三",
                    hasLoan = false,
                    loanBalance = 0f,
                    hasAccidentRecord = false,
                    accidentCount = 0,
                    isMortgaged = false,
                    flags = new List<string> { "营转非" }
                },
                vehicleRecord = new VehicleRecord
                {
                    ownershipCount = 3,
                    transferCount = 2,
                    firstRegisterDate = System.DateTime.Now.AddYears(-5),
                    lastTransferDate = System.DateTime.Now.AddMonths(-6),
                    hasInsurance = true,
                    insuranceExpiry = System.DateTime.Now.AddMonths(2),
                    violationRecords = new List<string> { "超速2次", "闯红灯1次" },
                    isCommercialVehicle = true,
                    commercialRetirementDate = System.DateTime.Now.AddYears(2)
                },
                inspectionReport = new InspectionReport
                {
                    inspectorName = "杨师傅",
                    inspectionDate = System.DateTime.Now,
                    overallScore = 70f,
                    items = new List<InspectionItem>
                    {
                        new InspectionItem { category = "发动机", itemName = "正时链条", condition = "正常", description = "无异常", estimatedRepairCost = 0f }
                    },
                    majorIssues = new List<string>(),
                    summary = "公里数较高但车况尚可，需注意营转非车辆强制报废年限。"
                },
                correctDecision = DecisionAction.Reject,
                explanation = "报价7.8万看似低于市场7千，但这是营转非车辆，还有2年强制报废。3次过户+8.5万公里高里程+强制报废，残值风险极高。美系车贬值快，2年后报废几乎不值钱，坚决拒绝收购。"
            };
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
