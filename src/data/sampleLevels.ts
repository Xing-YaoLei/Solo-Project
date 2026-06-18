import { Level, VehicleArchive, QuoteHistory, FinanceDocuments, Task, MaterialType, ActionType } from '../models';

const sampleVehicle1: VehicleArchive = {
  id: 'v_001',
  basicInfo: {
    brand: '大众',
    model: '帕萨特 330TSI DSG豪华版',
    year: 2020,
    plateNumber: '京A12345',
    vin: 'LSVNV2182L2123456',
    color: '黑色',
    mileage: 58000,
    engineNumber: 'EA888-12345',
    displacement: '2.0T',
    fuelType: '汽油'
  },
  condition: {
    accidentHistory: true,
    accidentDescription: '2022年前保险杠轻微剐蹭，已修复',
    waterDamage: false,
    fireDamage: false,
    modificationStatus: '原厂配置，无改装',
    tireWear: '正常',
    brakeStatus: '良好',
    overallAssessment: '良好'
  },
  ownership: {
    ownerName: '张三',
    ownerIdType: '身份证',
    ownerIdNumber: '110101199001011234',
    ownershipTransferCount: 0,
    registrationDate: '2020-03-15',
    currentMileage: 58000,
    annualInspectionValid: true,
    annualInspectionExpiryDate: '2026-03-14'
  },
  hasEncumbrance: false,
  isSeized: false,
  notes: '个人一手车，保养记录齐全'
};

const sampleQuote1: QuoteHistory = {
  vehicleId: 'v_001',
  initialQuoteDate: '2024-06-01',
  quoteRecords: [
    {
      id: 'q_001',
      timestamp: '2024-06-01 10:30:00',
      appraiser: '李评估师',
      appraisedValue: 185000,
      marketReferenceValue: 190000,
      mileageAdjustment: -3000,
      conditionAdjustment: -2000,
      colorAdjustment: 0,
      marketTrendAdjustment: 0,
      finalQuote: 180000,
      valuationMethod: '综合评估法',
      remarks: '车况良好，里程正常，有轻微事故记录'
    },
    {
      id: 'q_002',
      timestamp: '2024-06-05 14:20:00',
      appraiser: '王评估师',
      appraisedValue: 182000,
      marketReferenceValue: 188000,
      mileageAdjustment: -2500,
      conditionAdjustment: -1500,
      colorAdjustment: -500,
      marketTrendAdjustment: 500,
      finalQuote: 178000,
      valuationMethod: '现行市价法'
    }
  ],
  priceTrend: '稳定',
  averageQuote: 179000,
  highestQuote: 180000,
  lowestQuote: 178000,
  finalNegotiatedPrice: 176000,
  buyerOfferHistory: [170000, 172000, 174000, 176000],
  sellerAskHistory: [185000, 182000, 180000, 176000]
};

const sampleFinance1: FinanceDocuments = {
  id: 'f_001',
  finance: {
    hasLoan: false,
    loanPaidOff: true,
    releaseOfMortgageAvailable: true
  },
  insurance: {
    hasInsurance: true,
    insuranceType: '全险',
    insuranceCompany: '平安保险',
    policyNumber: 'PA2024010100123456',
    policyStartDate: '2024-01-01',
    policyEndDate: '2025-01-01',
    coverageAmount: 200000,
    claimHistory: [
      { date: '2023-05-10', amount: 1200, description: '前保险杠喷漆修复' }
    ]
  },
  tax: {
    vehiclePurchaseTaxPaid: true,
    vehiclePurchaseTaxAmount: 16500,
    annualVehicleTaxPaid: true,
    annualVehicleTaxAmount: 480,
    taxArrears: false
  },
  paymentMethod: '全款',
  financingApprovalStatus: '未申请'
};

const sampleVehicle2: VehicleArchive = {
  id: 'v_002',
  basicInfo: {
    brand: '丰田',
    model: '凯美瑞 2.5G 豪华版',
    year: 2021,
    plateNumber: '京B67890',
    vin: 'LVGBH51K0MG123456',
    color: '白色',
    mileage: 32000,
    engineNumber: 'A25A-12345',
    displacement: '2.5L',
    fuelType: '汽油'
  },
  condition: {
    accidentHistory: false,
    waterDamage: false,
    fireDamage: false,
    modificationStatus: '加装了行车记录仪',
    tireWear: '正常',
    brakeStatus: '良好',
    overallAssessment: '优秀'
  },
  ownership: {
    ownerName: '李四',
    ownerIdType: '身份证',
    ownerIdNumber: '110101198805055678',
    ownershipTransferCount: 1,
    registrationDate: '2021-06-20',
    currentMileage: 32000,
    annualInspectionValid: true,
    annualInspectionExpiryDate: '2025-06-19'
  },
  hasEncumbrance: true,
  encumbranceDescription: '2023年8月办理的银行贷款，尚未解除抵押',
  isSeized: false,
  notes: '车主表示贷款余额约8万元，需先还清贷款解除抵押'
};

const sampleQuote2: QuoteHistory = {
  vehicleId: 'v_002',
  initialQuoteDate: '2024-05-20',
  quoteRecords: [
    {
      id: 'q_003',
      timestamp: '2024-05-20 09:15:00',
      appraiser: '张评估师',
      appraisedValue: 210000,
      marketReferenceValue: 215000,
      mileageAdjustment: -2000,
      conditionAdjustment: 1000,
      colorAdjustment: 0,
      marketTrendAdjustment: 500,
      finalQuote: 209500,
      valuationMethod: '综合评估法',
      remarks: '车况优秀，里程低，无事故'
    }
  ],
  priceTrend: '稳定',
  averageQuote: 209500,
  highestQuote: 209500,
  lowestQuote: 209500,
  finalNegotiatedPrice: 205000,
  buyerOfferHistory: [200000, 202000, 205000],
  sellerAskHistory: [215000, 210000, 205000]
};

const sampleFinance2: FinanceDocuments = {
  id: 'f_002',
  finance: {
    hasLoan: true,
    loanOutstandingBalance: 80000,
    loanBank: '中国工商银行',
    loanStartDate: '2023-08-15',
    loanTermMonths: 36,
    loanMonthlyPayment: 2500,
    loanPaidOff: false,
    releaseOfMortgageAvailable: false
  },
  insurance: {
    hasInsurance: true,
    insuranceType: '商业险',
    insuranceCompany: '中国人保',
    policyNumber: 'PICC2023081500789012',
    policyStartDate: '2023-08-15',
    policyEndDate: '2024-08-14',
    coverageAmount: 150000,
    claimHistory: []
  },
  tax: {
    vehiclePurchaseTaxPaid: true,
    vehiclePurchaseTaxAmount: 18800,
    annualVehicleTaxPaid: true,
    annualVehicleTaxAmount: 480,
    taxArrears: false
  },
  paymentMethod: '贷款',
  downPaymentAmount: 61500,
  financingApprovalStatus: '审批中'
};

export const sampleLevels: Level[] = [
  {
    id: 'level_001',
    name: '新手入门 - 基础过户流程',
    description: '学习完整的全款车辆过户基础流程，认识必备材料',
    position: '过户专员',
    difficulty: 1,
    hasMissingMaterials: false,
    missingMaterialsCount: 0,
    estimatedTimeMinutes: 8,
    vehicleArchive: sampleVehicle1,
    quoteHistory: sampleQuote1,
    financeDocuments: sampleFinance1,
    task: {
      id: 'task_001',
      title: '大众帕萨特过户任务',
      description: '为客户张三的大众帕萨特办理过户手续，买方为个人买家',
      vehicleId: 'v_001',
      expectedDurationSeconds: 480,
      maxErrorTolerance: 3,
      steps: [
        {
          id: 'step_001',
          stepNumber: 1,
          prompt: '客户已到店，要求办理车辆过户。作为过户专员，首先应该做什么？',
          description: '过户流程第一步',
          availableActions: [
            {
              id: 'act_001_1',
              type: ActionType.COLLECT_MATERIAL,
              targetMaterial: MaterialType.VEHICLE_REGISTRATION_CERTIFICATE,
              label: '收集机动车登记证书',
              description: '向车主索要机动车登记证书（大绿本）',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '过户流程第一步应先进行车辆档案核验，确认车辆状态是否正常',
              penaltyPoints: 5
            },
            {
              id: 'act_001_2',
              type: ActionType.REVIEW_VEHICLE_CONDITION,
              label: '核验车辆档案',
              description: '先查阅车辆档案，确认车辆状态是否正常',
              isCorrect: true,
              feedbackCorrect: '正确！办理过户前必须先确认车辆档案状态正常，包括是否有抵押、查封等情况',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_001_3',
              type: ActionType.SIGN_CONTRACT,
              label: '直接签署过户合同',
              description: '跳过核验直接签署过户合同',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '在未确认车辆状态前不能签署合同，存在重大风险',
              penaltyPoints: 10
            },
            {
              id: 'act_001_4',
              type: ActionType.COLLECT_MATERIAL,
              targetMaterial: MaterialType.ID_CARD_OWNER,
              label: '收取车主身份证',
              description: '先收取车主身份证',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '应先确认车辆档案状态，再收集材料',
              penaltyPoints: 5
            }
          ],
          correctActionId: 'act_001_2',
          hint: '过户前应先确认车辆是否符合过户条件',
          difficulty: 1
        },
        {
          id: 'step_002',
          stepNumber: 2,
          prompt: '车辆档案状态正常（无抵押、无查封），下一步应该收集哪些核心材料？',
          description: '材料收集阶段',
          availableActions: [
            {
              id: 'act_002_1',
              type: ActionType.COLLECT_MATERIAL,
              targetMaterial: MaterialType.VEHICLE_REGISTRATION_CERTIFICATE,
              label: '机动车登记证书',
              description: '收集机动车登记证书',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '只收集单一材料不完整',
              penaltyPoints: 3
            },
            {
              id: 'act_002_2',
              type: ActionType.COLLECT_MATERIAL,
              label: '收集买卖双方身份证+登记证书',
              description: '收集买卖双方身份证和机动车登记证书',
              isCorrect: true,
              feedbackCorrect: '正确！需要买卖双方身份证明和机动车登记证书是过户的核心材料',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_002_3',
              type: ActionType.VERIFY_MATERIAL,
              label: '核验车辆照片',
              description: '先核验车辆照片',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '车辆照片不是当前阶段的核心材料',
              penaltyPoints: 5
            }
          ],
          correctActionId: 'act_002_2',
          hint: '需要收集能证明车辆归属和双方身份的材料',
          difficulty: 1
        },
        {
          id: 'step_003',
          stepNumber: 3,
          prompt: '材料已收集齐全，接下来应该做什么？',
          description: '材料核验阶段',
          availableActions: [
            {
              id: 'act_003_1',
              type: ActionType.VERIFY_MATERIAL,
              label: '核验材料真实性和完整性',
              description: '核验所有材料的真实性和完整性',
              isCorrect: true,
              feedbackCorrect: '正确！必须仔细核验材料，确保身份证信息一致、材料完整有效',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_003_2',
              type: ActionType.SUBMIT_TRANSFER,
              label: '直接提交过户',
              description: '跳过核验直接提交过户申请',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '未核验材料存在材料有误或造假的风险',
              penaltyPoints: 10
            }
          ],
          correctActionId: 'act_003_1',
          hint: '材料收集后必须核验真伪',
          difficulty: 1
        },
        {
          id: 'step_004',
          stepNumber: 4,
          prompt: '材料核验通过，买卖双方对交易价格无异议，此时应该？',
          description: '合同签署阶段',
          availableActions: [
            {
              id: 'act_004_1',
              type: ActionType.CONFIRM_PAYMENT,
              label: '确认款项到账',
              description: '确认购车款项已到账',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '应先签署购车合同，再进行款项确认',
              penaltyPoints: 5
            },
            {
              id: 'act_004_2',
              type: ActionType.SIGN_CONTRACT,
              label: '签署购车合同',
              description: '买卖双方签署正式的二手车买卖合同',
              isCorrect: true,
              feedbackCorrect: '正确！合同是交易的法律凭证，必须先签合同后付款',
              feedbackWrong: '',
              penaltyPoints: 0
            }
          ],
          correctActionId: 'act_004_2',
          hint: '法律程序的先后顺序很重要',
          difficulty: 1
        },
        {
          id: 'step_005',
          stepNumber: 5,
          prompt: '合同已签署，款项已确认到账，最后一步是？',
          description: '过户提交阶段',
          availableActions: [
            {
              id: 'act_005_1',
              type: ActionType.SUBMIT_TRANSFER,
              label: '提交过户申请',
              description: '向车管所提交过户申请材料',
              isCorrect: true,
              feedbackCorrect: '正确！所有材料准备完毕，可以提交过户申请',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_005_2',
              type: ActionType.COMPLETE_TRANSFER,
              label: '直接完成过户',
              description: '不经过车管所直接完成过户',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '过户必须经过车管所审核，不能自行完成',
              penaltyPoints: 15
            }
          ],
          correctActionId: 'act_005_1',
          hint: '过户需要官方流程',
          difficulty: 1
        }
      ]
    }
  },
  {
    id: 'level_002',
    name: '有抵押车辆过户',
    description: '处理有银行贷款抵押的车辆过户',
    position: '金融专员',
    difficulty: 3,
    hasMissingMaterials: true,
    missingMaterialsCount: 2,
    estimatedTimeMinutes: 15,
    vehicleArchive: sampleVehicle2,
    quoteHistory: sampleQuote2,
    financeDocuments: sampleFinance2,
    task: {
      id: 'task_002',
      title: '丰田凯美瑞抵押车辆过户',
      description: '处理有银行贷款抵押的丰田凯美瑞过户，贷款尚未还清',
      vehicleId: 'v_002',
      expectedDurationSeconds: 900,
      maxErrorTolerance: 3,
      steps: [
        {
          id: 'step_006',
          stepNumber: 1,
          prompt: '客户要求办理过户，查阅档案发现车辆有8万元银行贷款抵押未还清。作为金融专员应该如何处理？',
          description: '抵押车辆处理第一步',
          availableActions: [
            {
              id: 'act_006_1',
              type: ActionType.SIGN_CONTRACT,
              label: '继续正常办理过户',
              description: '忽略抵押继续办理',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '有抵押的车辆无法直接过户，必须先解除抵押',
              penaltyPoints: 20
            },
            {
              id: 'act_006_2',
              type: ActionType.CHECK_ENCUMBRANCE,
              label: '告知客户需先还清贷款解除抵押',
              description: '告知客户必须先还清银行贷款并办理解除抵押手续',
              isCorrect: true,
              feedbackCorrect: '正确！有抵押的车辆必须先解除抵押才能过户',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_006_3',
              type: ActionType.COLLECT_MATERIAL,
              label: '收取材料再说',
              description: '先收取材料再说',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '抵押不解除，后续流程无法进行',
              penaltyPoints: 10
            }
          ],
          correctActionId: 'act_006_2',
          hint: '抵押车辆不能直接过户',
          difficulty: 3
        },
        {
          id: 'step_007',
          stepNumber: 2,
          prompt: '车主表示愿意还清了贷款并取得了银行的结清证明，下一步应该？',
          description: '解押流程',
          availableActions: [
            {
              id: 'act_007_1',
              type: ActionType.COLLECT_MATERIAL,
              targetMaterial: MaterialType.LOAN_AGREEMENT,
              label: '收集贷款结清证明并办理解押',
              description: '收集贷款结清证明，到车管所办理解除抵押登记',
              isCorrect: true,
              feedbackCorrect: '正确！贷款结清后需要到车管所办理解除抵押登记',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_007_2',
              type: ActionType.COLLECT_MATERIAL,
              label: '直接开始收集过户材料',
              description: '贷款还清了可以直接过户了',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '贷款还清不等于抵押已解除，需要到车管所解除抵押登记',
              penaltyPoints: 10
            }
          ],
          correctActionId: 'act_007_1',
          hint: '还清贷款后还需要官方解除抵押登记',
          difficulty: 2
        },
        {
          id: 'step_008',
          stepNumber: 3,
          prompt: '抵押已解除，但车主说机动车登记证书找不到了，怎么办？',
          description: '材料缺失处理',
          availableActions: [
            {
              id: 'act_008_1',
              type: ActionType.REQUEST_MISSING,
              label: '要求补办登记证书',
              description: '要求车主先到车管所补办机动车登记证书',
              isCorrect: true,
              feedbackCorrect: '正确！机动车登记证书是过户必备材料，必须先补办',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_008_2',
              type: ActionType.SUBMIT_TRANSFER,
              label: '用其他材料代替',
              description: '没有登记证书用行驶证也行',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '机动车登记证书是过户必备，不可替代',
              penaltyPoints: 15
            },
            {
              id: 'act_008_3',
              type: ActionType.SIGN_CONTRACT,
              label: '先签合同后补材料',
              description: '先签合同再说',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '缺少核心材料会导致合同无法履行',
              penaltyPoints: 10
            }
          ],
          correctActionId: 'act_008_1',
          hint: '登记证书是核心材料',
          difficulty: 2
        },
        {
          id: 'step_009',
          stepNumber: 4,
          prompt: '登记证书已补办，买方选择贷款购车，金融专员应该先做什么？',
          description: '买方贷款流程',
          availableActions: [
            {
              id: 'act_009_1',
              type: ActionType.REVIEW_FINANCE,
              label: '审核买方贷款资质',
              description: '审核买方贷款资质并提交贷款申请',
              isCorrect: true,
              feedbackCorrect: '正确！买方贷款购车需先审核贷款资质',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_009_2',
              type: ActionType.SIGN_CONTRACT,
              label: '直接签署过户合同',
              description: '先签合同再办贷款',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '买方贷款未审批通过前签合同存在风险',
              penaltyPoints: 10
            },
            {
              id: 'act_009_3',
              type: ActionType.CONFIRM_PAYMENT,
              label: '收取首付款',
              description: '先收首付款',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '应先确认贷款审批通过',
              penaltyPoints: 8
            }
          ],
          correctActionId: 'act_009_1',
          hint: '先确认贷款能批',
          difficulty: 3
        },
        {
          id: 'step_010',
          stepNumber: 5,
          prompt: '买方贷款审批通过，首付款已付，现在应该？',
          description: '贷款过户流程',
          availableActions: [
            {
              id: 'act_010_1',
              type: ActionType.SIGN_CONTRACT,
              label: '签署购车合同和贷款合同',
              description: '签署购车合同和贷款相关合同',
              isCorrect: true,
              feedbackCorrect: '正确！贷款审批通过后可以签署合同',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_010_2',
              type: ActionType.SUBMIT_TRANSFER,
              label: '直接提交过户',
              description: '跳过合同直接过户',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '必须先签署合同',
              penaltyPoints: 10
            }
          ],
          correctActionId: 'act_010_1',
          hint: '合同是必须的',
          difficulty: 2
        },
        {
          id: 'step_011',
          stepNumber: 6,
          prompt: '合同已签，银行贷款已放款到账，发现买方保险即将在2天后到期，应该？',
          description: '保险核查',
          availableActions: [
            {
              id: 'act_011_1',
              type: ActionType.CHECK_INSURANCE,
              label: '提醒买方及时续保或过户保险',
              description: '提醒买方及时办理保险过户或重新投保',
              isCorrect: true,
              feedbackCorrect: '正确！保险即将到期，应提醒买方及时处理保险事宜',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_011_2',
              type: ActionType.SUBMIT_TRANSFER,
              label: '保险不影响过户',
              description: '保险没事，直接过户',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '虽然保险不影响车管所过户，但买方风险很大，应该提醒',
              penaltyPoints: 8
            }
          ],
          correctActionId: 'act_011_1',
          hint: '为客户着想',
          difficulty: 2
        },
        {
          id: 'step_012',
          stepNumber: 7,
          prompt: '所有事项处理完毕，最后一步是？',
          description: '最终提交',
          availableActions: [
            {
              id: 'act_012_1',
              type: ActionType.SUBMIT_TRANSFER,
              label: '提交过户申请',
              description: '向车管所提交完整过户材料',
              isCorrect: true,
              feedbackCorrect: '正确！所有准备工作完成，可以提交过户申请',
              feedbackWrong: '',
              penaltyPoints: 0
            }
          ],
          correctActionId: 'act_012_1',
          hint: '最终一步',
          difficulty: 1
        }
      ]
    }
  },
  {
    id: 'level_003',
    name: '高难度 - 综合过户专员考核',
    description: '综合考核过户专员的全面能力',
    position: '综合岗位',
    difficulty: 5,
    hasMissingMaterials: true,
    missingMaterialsCount: 3,
    estimatedTimeMinutes: 20,
    vehicleArchive: sampleVehicle1,
    quoteHistory: sampleQuote1,
    financeDocuments: sampleFinance1,
    task: {
      id: 'task_003',
      title: '综合考核任务',
      description: '综合考核过户流程中的各种问题处理',
      vehicleId: 'v_001',
      expectedDurationSeconds: 1200,
      maxErrorTolerance: 2,
      steps: [
        {
          id: 'step_013',
          stepNumber: 1,
          prompt: '客户来店过户，卖方本人不在现场，委托他人代办，应该？',
          description: '委托代办处理',
          availableActions: [
            {
              id: 'act_013_1',
              type: ActionType.COLLECT_MATERIAL,
              label: '要求提供授权委托书和双方身份证',
              description: '要求提供经公证的授权委托书及双方身份证明',
              isCorrect: true,
              feedbackCorrect: '正确！委托代办需要授权委托书及双方身份证明',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_013_2',
              type: ActionType.SIGN_CONTRACT,
              label: '让代办人直接签字',
              description: '代办人可以直接代签',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '没有授权委托书代办人无权签字',
              penaltyPoints: 20
            }
          ],
          correctActionId: 'act_013_1',
          hint: '委托代办需要授权',
          difficulty: 4
        },
        {
          id: 'step_014',
          stepNumber: 2,
          prompt: '提供了授权委托书，发现卖方身份证过期了，怎么办？',
          description: '材料有效性核验',
          availableActions: [
            {
              id: 'act_014_1',
              type: ActionType.REJECT_MATERIAL,
              label: '要求提供有效身份证',
              description: '身份证过期无效，要求提供新的有效身份证',
              isCorrect: true,
              feedbackCorrect: '正确！过期的身份证是无效证件',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_014_2',
              type: ActionType.VERIFY_MATERIAL,
              label: '将就使用',
              description: '身份证号码对就行',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '过期身份证是无效证件，不能使用',
              penaltyPoints: 15
            }
          ],
          correctActionId: 'act_014_1',
          hint: '证件有效性很重要',
          difficulty: 3
        },
        {
          id: 'step_015',
          stepNumber: 3,
          prompt: '查验车辆时发现车辆实际里程表显示3万公里，但档案显示上次年检时已经5万公里了，应该？',
          description: '调表车处理',
          availableActions: [
            {
              id: 'act_015_1',
              type: ActionType.REVIEW_VEHICLE_CONDITION,
              label: '告知买方实际情况并记录',
              description: '如实告知买方里程差异，并在合同中注明',
              isCorrect: true,
              feedbackCorrect: '正确！必须如实告知车辆真实情况',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_015_2',
              type: ActionType.SIGN_CONTRACT,
              label: '不影响交易',
              description: '里程不影响过户',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '隐瞒车辆真实情况属于欺诈行为',
              penaltyPoints: 25
            }
          ],
          correctActionId: 'act_015_1',
          hint: '诚信经营',
          difficulty: 4
        },
        {
          id: 'step_016',
          stepNumber: 4,
          prompt: '买方已知情并同意继续交易，买方是外地户口，没有本地居住证，应该？',
          description: '外地户口过户',
          availableActions: [
            {
              id: 'act_016_1',
              type: ActionType.REQUEST_MISSING,
              label: '告知需要居住证或办理暂住证',
              description: '告知买方需要提供本地居住证或办理暂住登记凭证',
              isCorrect: true,
              feedbackCorrect: '正确！部分地区外地户口过户需要居住证',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_016_2',
              type: ActionType.SUBMIT_TRANSFER,
              label: '用身份证就行',
              description: '有身份证就能过户',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '外地户口在本地过户通常需要居住证',
              penaltyPoints: 10
            }
          ],
          correctActionId: 'act_016_1',
          hint: '各地政策不同',
          difficulty: 3
        },
        {
          id: 'step_017',
          stepNumber: 5,
          prompt: '买方提供了居住证，发现车辆购置税完税证明丢失了，应该？',
          description: '购置税证明处理',
          availableActions: [
            {
              id: 'act_017_1',
              type: ActionType.REQUEST_MISSING,
              label: '可以到税务局补办',
              description: '告知车主到税务局申请补办购置税完税证明',
              isCorrect: true,
              feedbackCorrect: '正确！购置税完税证明可以补办',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_017_2',
              type: ActionType.REJECT_MATERIAL,
              label: '无法过户',
              description: '没有购置税证明不能过户',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '购置税证明丢失可以补办，不应该直接拒绝',
              penaltyPoints: 8
            }
          ],
          correctActionId: 'act_017_1',
          hint: '材料缺失多数可以补办',
          difficulty: 3
        },
        {
          id: 'step_018',
          stepNumber: 6,
          prompt: '所有材料齐备，车辆过户前还需要做什么？',
          description: '违章核查',
          availableActions: [
            {
              id: 'act_018_1',
              type: ActionType.CONFIRM_OWNERSHIP,
              label: '核查车辆违章',
              description: '核查并确认车辆违章是否已处理完毕',
              isCorrect: true,
              feedbackCorrect: '正确！有违章未处理的车辆不能过户',
              feedbackWrong: '',
              penaltyPoints: 0
            },
            {
              id: 'act_018_2',
              type: ActionType.SUBMIT_TRANSFER,
              label: '直接过户',
              description: '过户后再处理违章',
              isCorrect: false,
              feedbackCorrect: '',
              feedbackWrong: '有违章未处理的车辆无法通过车管所审核',
              penaltyPoints: 15
            }
          ],
          correctActionId: 'act_018_1',
          hint: '违章先处理',
          difficulty: 2
        },
        {
          id: 'step_019',
          stepNumber: 7,
          prompt: '违章已处理完毕，最后？',
          description: '最终完成',
          availableActions: [
            {
              id: 'act_019_1',
              type: ActionType.SUBMIT_TRANSFER,
              label: '提交过户申请',
              description: '提交完整材料完成过户',
              isCorrect: true,
              feedbackCorrect: '恭喜完成高难度考核通过！',
              feedbackWrong: '',
              penaltyPoints: 0
            }
          ],
          correctActionId: 'act_019_1',
          hint: '完成',
          difficulty: 1
        }
      ]
    }
  }
];
