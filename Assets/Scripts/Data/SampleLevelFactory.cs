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
    }
}
