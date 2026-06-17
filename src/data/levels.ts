import { Level } from '../game/types';

export const levels: Level[] = [
  {
    id: 'level-001',
    name: '新手入门：正常退租',
    description: '租客按时退租，房屋状况良好，练习基础验房流程',
    difficulty: 'easy',
    complaintTags: [],
    estimatedTime: 180,
    timeLimit: 300,
    roomInfo: {
      roomNumber: 'A栋1203',
      tenantName: '张三',
      moveInDate: '2024-03-15',
      moveOutDate: '2025-03-15',
      deposit: 5000,
      monthlyRent: 2500
    },
    utilityData: {
      electricityStart: 1200,
      electricityEnd: 1580,
      electricityRate: 0.6,
      waterStart: 80,
      waterEnd: 105,
      waterRate: 5.0,
      hasAbnormality: false
    },
    inspectionItems: [
      { id: 'wall-01', name: '主卧墙面', category: '墙面', status: 'normal', severity: 'minor', description: '墙面干净无污渍', deductionAmount: 0 },
      { id: 'wall-02', name: '客厅墙面', category: '墙面', status: 'normal', severity: 'minor', description: '墙面完好', deductionAmount: 0 },
      { id: 'floor-01', name: '地板', category: '地面', status: 'normal', severity: 'minor', description: '地板无明显磨损', deductionAmount: 0 },
      { id: 'door-01', name: '入户门', category: '门窗', status: 'normal', severity: 'minor', description: '门锁正常', deductionAmount: 0 },
      { id: 'window-01', name: '主卧窗户', category: '门窗', status: 'normal', severity: 'minor', description: '窗户完好', deductionAmount: 0 },
      { id: 'appliance-01', name: '空调', category: '家电', status: 'normal', severity: 'minor', description: '制冷正常', deductionAmount: 0 },
      { id: 'appliance-02', name: '冰箱', category: '家电', status: 'normal', severity: 'minor', description: '运行正常', deductionAmount: 0 },
      { id: 'furniture-01', name: '床架', category: '家具', status: 'normal', severity: 'minor', description: '床架稳固', deductionAmount: 0 },
      { id: 'furniture-02', name: '衣柜', category: '家具', status: 'normal', severity: 'minor', description: '柜门完好', deductionAmount: 0 },
      { id: 'key-01', name: '钥匙门禁', category: '物品', status: 'normal', severity: 'minor', description: '钥匙门禁卡齐全', deductionAmount: 0 }
    ],
    paymentRecords: [
      { id: 'pay-01', date: '2024-03-15', amount: 7500, type: 'deposit', status: 'paid', description: '押金+首月租金' },
      { id: 'pay-02', date: '2024-04-10', amount: 2500, type: 'rent', status: 'paid', description: '4月租金' },
      { id: 'pay-03', date: '2024-05-08', amount: 2500, type: 'rent', status: 'paid', description: '5月租金' },
      { id: 'pay-04', date: '2024-06-12', amount: 2500, type: 'rent', status: 'paid', description: '6月租金' },
      { id: 'pay-05', date: '2024-07-09', amount: 2500, type: 'rent', status: 'paid', description: '7月租金' },
      { id: 'pay-06', date: '2024-08-11', amount: 2500, type: 'rent', status: 'paid', description: '8月租金' },
      { id: 'pay-07', date: '2024-09-07', amount: 2500, type: 'rent', status: 'paid', description: '9月租金' },
      { id: 'pay-08', date: '2024-10-10', amount: 2500, type: 'rent', status: 'paid', description: '10月租金' },
      { id: 'pay-09', date: '2024-11-08', amount: 2500, type: 'rent', status: 'paid', description: '11月租金' },
      { id: 'pay-10', date: '2024-12-12', amount: 2500, type: 'rent', status: 'paid', description: '12月租金' },
      { id: 'pay-11', date: '2025-01-09', amount: 2500, type: 'rent', status: 'paid', description: '1月租金' },
      { id: 'pay-12', date: '2025-02-10', amount: 2500, type: 'rent', status: 'paid', description: '2月租金' },
      { id: 'pay-13', date: '2025-03-10', amount: 2500, type: 'rent', status: 'paid', description: '3月租金' }
    ],
    correctAction: 'full_refund',
    correctDeductions: []
  },
  {
    id: 'level-002',
    name: '轻微损坏：墙面污渍',
    description: '租客退租时墙面有轻微污渍，需判断是否扣押金',
    difficulty: 'easy',
    complaintTags: ['wall_damage'],
    estimatedTime: 240,
    timeLimit: 360,
    roomInfo: {
      roomNumber: 'B栋0805',
      tenantName: '李四',
      moveInDate: '2024-06-01',
      moveOutDate: '2025-06-01',
      deposit: 4800,
      monthlyRent: 2400
    },
    utilityData: {
      electricityStart: 850,
      electricityEnd: 1280,
      electricityRate: 0.6,
      waterStart: 45,
      waterEnd: 72,
      waterRate: 5.0,
      hasAbnormality: false
    },
    inspectionItems: [
      { id: 'wall-01', name: '主卧墙面', category: '墙面', status: 'dirty', severity: 'minor', description: '床头位置有轻微污渍，约30cm×20cm', deductionAmount: 200 },
      { id: 'wall-02', name: '客厅墙面', category: '墙面', status: 'normal', severity: 'minor', description: '墙面完好', deductionAmount: 0 },
      { id: 'wall-03', name: '厨房墙面', category: '墙面', status: 'normal', severity: 'minor', description: '有少量油烟，属正常使用', deductionAmount: 0 },
      { id: 'floor-01', name: '地板', category: '地面', status: 'normal', severity: 'minor', description: '地板正常磨损', deductionAmount: 0 },
      { id: 'door-01', name: '入户门', category: '门窗', status: 'normal', severity: 'minor', description: '门锁正常', deductionAmount: 0 },
      { id: 'window-01', name: '阳台窗户', category: '门窗', status: 'normal', severity: 'minor', description: '窗户完好', deductionAmount: 0 },
      { id: 'appliance-01', name: '洗衣机', category: '家电', status: 'normal', severity: 'minor', description: '运行正常', deductionAmount: 0 },
      { id: 'appliance-02', name: '热水器', category: '家电', status: 'normal', severity: 'minor', description: '加热正常', deductionAmount: 0 },
      { id: 'furniture-01', name: '沙发', category: '家具', status: 'normal', severity: 'minor', description: '正常使用痕迹', deductionAmount: 0 },
      { id: 'key-01', name: '钥匙门禁', category: '物品', status: 'normal', severity: 'minor', description: '钥匙门禁卡齐全', deductionAmount: 0 }
    ],
    paymentRecords: [
      { id: 'pay-01', date: '2024-06-01', amount: 7200, type: 'deposit', status: 'paid', description: '押金+首月租金' },
      { id: 'pay-02', date: '2024-07-02', amount: 2400, type: 'rent', status: 'paid', description: '7月租金' },
      { id: 'pay-03', date: '2024-08-01', amount: 2400, type: 'rent', status: 'paid', description: '8月租金' },
      { id: 'pay-04', date: '2024-09-03', amount: 2400, type: 'rent', status: 'paid', description: '9月租金' },
      { id: 'pay-05', date: '2024-10-02', amount: 2400, type: 'rent', status: 'paid', description: '10月租金' },
      { id: 'pay-06', date: '2024-11-01', amount: 2400, type: 'rent', status: 'paid', description: '11月租金' },
      { id: 'pay-07', date: '2024-12-02', amount: 2400, type: 'rent', status: 'paid', description: '12月租金' },
      { id: 'pay-08', date: '2025-01-02', amount: 2400, type: 'rent', status: 'paid', description: '1月租金' },
      { id: 'pay-09', date: '2025-02-01', amount: 2400, type: 'rent', status: 'paid', description: '2月租金' },
      { id: 'pay-10', date: '2025-03-03', amount: 2400, type: 'rent', status: 'paid', description: '3月租金' },
      { id: 'pay-11', date: '2025-04-02', amount: 2400, type: 'rent', status: 'paid', description: '4月租金' },
      { id: 'pay-12', date: '2025-05-02', amount: 2400, type: 'rent', status: 'paid', description: '5月租金' }
    ],
    correctAction: 'partial_deduction',
    correctDeductions: [
      { itemId: 'wall-01', reason: '主卧墙面污渍清理费', amount: 200 }
    ]
  },
  {
    id: 'level-003',
    name: '中等难度：家具损坏+钥匙缺失',
    description: '家具损坏较严重，且钥匙门禁卡未全部归还',
    difficulty: 'medium',
    complaintTags: ['furniture_damage', 'missing_keys'],
    estimatedTime: 300,
    timeLimit: 480,
    roomInfo: {
      roomNumber: 'C栋1502',
      tenantName: '王五',
      moveInDate: '2024-01-10',
      moveOutDate: '2025-01-10',
      deposit: 6000,
      monthlyRent: 3000
    },
    utilityData: {
      electricityStart: 1500,
      electricityEnd: 2100,
      electricityRate: 0.6,
      waterStart: 100,
      waterEnd: 145,
      waterRate: 5.0,
      hasAbnormality: false
    },
    inspectionItems: [
      { id: 'wall-01', name: '主卧墙面', category: '墙面', status: 'normal', severity: 'minor', description: '墙面完好', deductionAmount: 0 },
      { id: 'wall-02', name: '客厅墙面', category: '墙面', status: 'normal', severity: 'minor', description: '墙面完好', deductionAmount: 0 },
      { id: 'floor-01', name: '地板', category: '地面', status: 'damaged', severity: 'major', description: '客厅地板有两处明显划痕，约50cm长', deductionAmount: 800 },
      { id: 'door-01', name: '入户门', category: '门窗', status: 'normal', severity: 'minor', description: '门锁正常', deductionAmount: 0 },
      { id: 'window-01', name: '卧室窗户', category: '门窗', status: 'damaged', severity: 'minor', description: '一扇窗户把手松动', deductionAmount: 100 },
      { id: 'appliance-01', name: '空调', category: '家电', status: 'normal', severity: 'minor', description: '制冷正常', deductionAmount: 0 },
      { id: 'appliance-02', name: '电视', category: '家电', status: 'normal', severity: 'minor', description: '画面正常', deductionAmount: 0 },
      { id: 'furniture-01', name: '餐桌', category: '家具', status: 'damaged', severity: 'major', description: '桌面有大面积烫痕和划痕', deductionAmount: 600 },
      { id: 'furniture-02', name: '餐椅', category: '家具', status: 'missing', severity: 'minor', description: '餐椅缺失一把', deductionAmount: 300 },
      { id: 'furniture-03', name: '书桌', category: '家具', status: 'normal', severity: 'minor', description: '桌面完好', deductionAmount: 0 },
      { id: 'key-01', name: '钥匙门禁', category: '物品', status: 'missing', severity: 'minor', description: '缺少一张门禁卡和一把卧室钥匙', deductionAmount: 200 }
    ],
    paymentRecords: [
      { id: 'pay-01', date: '2024-01-10', amount: 9000, type: 'deposit', status: 'paid', description: '押金+首月租金' },
      { id: 'pay-02', date: '2024-02-08', amount: 3000, type: 'rent', status: 'paid', description: '2月租金' },
      { id: 'pay-03', date: '2024-03-10', amount: 3000, type: 'rent', status: 'paid', description: '3月租金' },
      { id: 'pay-04', date: '2024-04-09', amount: 3000, type: 'rent', status: 'paid', description: '4月租金' },
      { id: 'pay-05', date: '2024-05-11', amount: 3000, type: 'rent', status: 'paid', description: '5月租金' },
      { id: 'pay-06', date: '2024-06-08', amount: 3000, type: 'rent', status: 'paid', description: '6月租金' },
      { id: 'pay-07', date: '2024-07-10', amount: 3000, type: 'rent', status: 'paid', description: '7月租金' },
      { id: 'pay-08', date: '2024-08-09', amount: 3000, type: 'rent', status: 'paid', description: '8月租金' },
      { id: 'pay-09', date: '2024-09-10', amount: 3000, type: 'rent', status: 'paid', description: '9月租金' },
      { id: 'pay-10', date: '2024-10-08', amount: 3000, type: 'rent', status: 'paid', description: '10月租金' },
      { id: 'pay-11', date: '2024-11-10', amount: 3000, type: 'rent', status: 'paid', description: '11月租金' },
      { id: 'pay-12', date: '2024-12-09', amount: 3000, type: 'rent', status: 'paid', description: '12月租金' },
      { id: 'pay-13', date: '2025-01-05', amount: 3000, type: 'rent', status: 'paid', description: '1月租金' }
    ],
    correctAction: 'partial_deduction',
    correctDeductions: [
      { itemId: 'floor-01', reason: '地板划痕修复费', amount: 800 },
      { itemId: 'window-01', reason: '窗户把手维修费', amount: 100 },
      { itemId: 'furniture-01', reason: '餐桌损坏赔偿', amount: 600 },
      { itemId: 'furniture-02', reason: '餐椅缺失赔偿', amount: 300 },
      { itemId: 'key-01', reason: '钥匙门禁卡补办费', amount: 200 }
    ]
  },
  {
    id: 'level-004',
    name: '高难挑战：租金逾期+严重损坏',
    description: '租客多次逾期交租，房屋损坏严重，需综合判断处理方式',
    difficulty: 'hard',
    complaintTags: ['rent_overdue', 'wall_damage', 'furniture_damage', 'appliance_fault'],
    estimatedTime: 360,
    timeLimit: 600,
    roomInfo: {
      roomNumber: 'D栋2201',
      tenantName: '赵六',
      moveInDate: '2024-02-01',
      moveOutDate: '2025-02-01',
      deposit: 8000,
      monthlyRent: 4000
    },
    utilityData: {
      electricityStart: 2000,
      electricityEnd: 3800,
      electricityRate: 0.6,
      waterStart: 120,
      waterEnd: 210,
      waterRate: 5.0,
      hasAbnormality: true,
      abnormalityHint: '水电用量明显偏高，需确认是否有设备长时间运行或漏水'
    },
    inspectionItems: [
      { id: 'wall-01', name: '主卧墙面', category: '墙面', status: 'damaged', severity: 'critical', description: '墙面有大面积涂鸦和破损，约2平方米', deductionAmount: 1500 },
      { id: 'wall-02', name: '客厅墙面', category: '墙面', status: 'damaged', severity: 'major', description: '多处钉孔和壁纸脱落', deductionAmount: 800 },
      { id: 'wall-03', name: '次卧墙面', category: '墙面', status: 'dirty', severity: 'major', description: '大面积发黄污渍', deductionAmount: 600 },
      { id: 'floor-01', name: '地板', category: '地面', status: 'damaged', severity: 'critical', description: '多处地板起翘、变形，约5平方米', deductionAmount: 2000 },
      { id: 'door-01', name: '入户门', category: '门窗', status: 'damaged', severity: 'minor', description: '门锁有撬动痕迹', deductionAmount: 300 },
      { id: 'window-01', name: '阳台落地窗', category: '门窗', status: 'damaged', severity: 'major', description: '玻璃有一道明显划痕', deductionAmount: 500 },
      { id: 'appliance-01', name: '空调', category: '家电', status: 'damaged', severity: 'major', description: '空调不制冷，疑似压缩机损坏', deductionAmount: 1200 },
      { id: 'appliance-02', name: '洗衣机', category: '家电', status: 'damaged', severity: 'minor', description: '洗衣机门密封圈损坏', deductionAmount: 200 },
      { id: 'appliance-03', name: '冰箱', category: '家电', status: 'normal', severity: 'minor', description: '运行正常', deductionAmount: 0 },
      { id: 'furniture-01', name: '沙发', category: '家具', status: 'damaged', severity: 'major', description: '沙发扶手破损，坐垫塌陷', deductionAmount: 800 },
      { id: 'furniture-02', name: '衣柜', category: '家具', status: 'damaged', severity: 'minor', description: '一扇柜门合页损坏', deductionAmount: 150 },
      { id: 'furniture-03', name: '茶几', category: '家具', status: 'missing', severity: 'minor', description: '茶几缺失', deductionAmount: 400 },
      { id: 'key-01', name: '钥匙门禁', category: '物品', status: 'missing', severity: 'minor', description: '缺少两把钥匙和两张门禁卡', deductionAmount: 300 }
    ],
    paymentRecords: [
      { id: 'pay-01', date: '2024-02-01', amount: 12000, type: 'deposit', status: 'paid', description: '押金+首月租金' },
      { id: 'pay-02', date: '2024-03-05', amount: 4000, type: 'rent', status: 'paid', description: '3月租金（逾期4天）' },
      { id: 'pay-03', date: '2024-04-15', amount: 4000, type: 'rent', status: 'overdue', description: '4月租金（逾期14天）' },
      { id: 'pay-04', date: '2024-05-08', amount: 4000, type: 'rent', status: 'paid', description: '5月租金（逾期7天）' },
      { id: 'pay-05', date: '2024-06-20', amount: 4000, type: 'rent', status: 'overdue', description: '6月租金（逾期19天）' },
      { id: 'pay-06', date: '2024-07-10', amount: 4000, type: 'rent', status: 'paid', description: '7月租金（逾期9天）' },
      { id: 'pay-07', date: '2024-08-05', amount: 4000, type: 'rent', status: 'paid', description: '8月租金（逾期4天）' },
      { id: 'pay-08', date: '2024-09-18', amount: 4000, type: 'rent', status: 'overdue', description: '9月租金（逾期17天）' },
      { id: 'pay-09', date: '2024-10-12', amount: 4000, type: 'rent', status: 'paid', description: '10月租金（逾期11天）' },
      { id: 'pay-10', date: '2024-11-25', amount: 4000, type: 'rent', status: 'overdue', description: '11月租金（逾期24天）' },
      { id: 'pay-11', date: '2024-12-08', amount: 4000, type: 'rent', status: 'paid', description: '12月租金（逾期7天）' },
      { id: 'pay-12', date: '2025-01-20', amount: 4000, type: 'rent', status: 'overdue', description: '1月租金（逾期19天）' },
      { id: 'pay-13', date: '2025-02-01', amount: 0, type: 'rent', status: 'partial', description: '2月租金未付（截止退租日）' }
    ],
    correctAction: 'full_deduction',
    correctDeductions: [
      { itemId: 'wall-01', reason: '主卧墙面大面积损坏修复', amount: 1500 },
      { itemId: 'wall-02', reason: '客厅墙面修复费', amount: 800 },
      { itemId: 'wall-03', reason: '次卧墙面清洁翻新', amount: 600 },
      { itemId: 'floor-01', reason: '地板更换修复费', amount: 2000 },
      { itemId: 'door-01', reason: '门锁更换费', amount: 300 },
      { itemId: 'window-01', reason: '落地窗玻璃更换', amount: 500 },
      { itemId: 'appliance-01', reason: '空调维修/折旧费', amount: 1200 },
      { itemId: 'appliance-02', reason: '洗衣机维修', amount: 200 },
      { itemId: 'furniture-01', reason: '沙发损坏赔偿', amount: 800 },
      { itemId: 'furniture-02', reason: '衣柜门维修', amount: 150 },
      { itemId: 'furniture-03', reason: '茶几缺失赔偿', amount: 400 },
      { itemId: 'key-01', reason: '钥匙门禁卡补办', amount: 300 }
    ]
  },
  {
    id: 'level-005',
    name: '专家级：擅自装修+宠物损坏+纠纷',
    description: '租客擅自装修、饲养宠物造成损坏，且存在合同纠纷，需上报处理',
    difficulty: 'expert',
    complaintTags: ['unauthorized_remodel', 'pet_damage', 'contract_issue', 'noise_complaint'],
    estimatedTime: 480,
    timeLimit: 720,
    roomInfo: {
      roomNumber: 'E栋0908',
      tenantName: '孙七',
      moveInDate: '2023-09-01',
      moveOutDate: '2025-03-01',
      deposit: 10000,
      monthlyRent: 5000
    },
    utilityData: {
      electricityStart: 3000,
      electricityEnd: 5200,
      electricityRate: 0.6,
      waterStart: 180,
      waterEnd: 320,
      waterRate: 5.0,
      hasAbnormality: true,
      abnormalityHint: '水电用量显著偏高，结合宠物饲养情况需进一步核实'
    },
    inspectionItems: [
      { id: 'wall-01', name: '主卧墙面', category: '墙面', status: 'damaged', severity: 'critical', description: '墙面被重新刷漆，颜色与原房不一致，且有多处宠物抓痕', deductionAmount: 2000 },
      { id: 'wall-02', name: '客厅墙面', category: '墙面', status: 'damaged', severity: 'critical', description: '擅自拆除一面非承重墙，已改变房屋结构', deductionAmount: 5000 },
      { id: 'wall-03', name: '玄关墙面', category: '墙面', status: 'damaged', severity: 'major', description: '墙面贴满壁纸，与交房时不符', deductionAmount: 800 },
      { id: 'floor-01', name: '地板', category: '地面', status: 'damaged', severity: 'critical', description: '全屋地板被更换为复合地板，原实木地板不知去向', deductionAmount: 8000 },
      { id: 'floor-02', name: '卫生间地面', category: '地面', status: 'damaged', severity: 'major', description: '卫生间地砖有多处开裂，疑似宠物造成', deductionAmount: 1500 },
      { id: 'door-01', name: '入户门', category: '门窗', status: 'damaged', severity: 'major', description: '门锁被更换，猫眼被拆除', deductionAmount: 600 },
      { id: 'door-02', name: '卧室门', category: '门窗', status: 'damaged', severity: 'major', description: '门底部有严重宠物抓咬痕迹', deductionAmount: 800 },
      { id: 'window-01', name: '阳台窗户', category: '门窗', status: 'damaged', severity: 'minor', description: '窗纱破损', deductionAmount: 100 },
      { id: 'appliance-01', name: '空调', category: '家电', status: 'normal', severity: 'minor', description: '运行正常', deductionAmount: 0 },
      { id: 'appliance-02', name: '油烟机', category: '家电', status: 'dirty', severity: 'major', description: '油烟机严重油污，疑似未清洗过', deductionAmount: 300 },
      { id: 'furniture-01', name: '定制衣柜', category: '家具', status: 'missing', severity: 'critical', description: '原定制衣柜被拆除，不知去向', deductionAmount: 3000 },
      { id: 'furniture-02', name: '床', category: '家具', status: 'damaged', severity: 'major', description: '床垫有严重污渍和宠物毛发', deductionAmount: 1000 },
      { id: 'furniture-03', name: '餐桌椅', category: '家具', status: 'missing', severity: 'major', description: '餐桌椅全部缺失', deductionAmount: 1500 },
      { id: 'furniture-04', name: '沙发', category: '家具', status: 'damaged', severity: 'critical', description: '沙发被宠物严重损坏，无法修复', deductionAmount: 2500 },
      { id: 'key-01', name: '钥匙门禁', category: '物品', status: 'missing', severity: 'minor', description: '门禁卡未归还', deductionAmount: 200 },
      { id: 'other-01', name: '宠物气味', category: '其他', status: 'dirty', severity: 'major', description: '房间内有明显宠物异味，需深度除味', deductionAmount: 500 }
    ],
    paymentRecords: [
      { id: 'pay-01', date: '2023-09-01', amount: 15000, type: 'deposit', status: 'paid', description: '押金+首月租金' },
      { id: 'pay-02', date: '2023-10-02', amount: 5000, type: 'rent', status: 'paid', description: '10月租金' },
      { id: 'pay-03', date: '2023-11-01', amount: 5000, type: 'rent', status: 'paid', description: '11月租金' },
      { id: 'pay-04', date: '2023-12-05', amount: 5000, type: 'rent', status: 'paid', description: '12月租金' },
      { id: 'pay-05', date: '2024-01-03', amount: 5000, type: 'rent', status: 'paid', description: '1月租金' },
      { id: 'pay-06', date: '2024-02-02', amount: 5000, type: 'rent', status: 'paid', description: '2月租金' },
      { id: 'pay-07', date: '2024-03-08', amount: 5000, type: 'rent', status: 'paid', description: '3月租金' },
      { id: 'pay-08', date: '2024-04-10', amount: 5000, type: 'rent', status: 'paid', description: '4月租金' },
      { id: 'pay-09', date: '2024-05-05', amount: 5000, type: 'rent', status: 'paid', description: '5月租金' },
      { id: 'pay-10', date: '2024-06-12', amount: 5000, type: 'rent', status: 'paid', description: '6月租金' },
      { id: 'pay-11', date: '2024-07-08', amount: 5000, type: 'rent', status: 'paid', description: '7月租金' },
      { id: 'pay-12', date: '2024-08-15', amount: 5000, type: 'rent', status: 'paid', description: '8月租金' },
      { id: 'pay-13', date: '2024-09-10', amount: 5000, type: 'rent', status: 'paid', description: '9月租金' },
      { id: 'pay-14', date: '2024-10-18', amount: 5000, type: 'rent', status: 'paid', description: '10月租金（逾期17天，因宠物投诉纠纷）' },
      { id: 'pay-15', date: '2024-11-22', amount: 5000, type: 'rent', status: 'overdue', description: '11月租金（逾期21天，纠纷中）' },
      { id: 'pay-16', date: '2024-12-15', amount: 5000, type: 'rent', status: 'paid', description: '12月租金' },
      { id: 'pay-17', date: '2025-01-20', amount: 5000, type: 'rent', status: 'overdue', description: '1月租金（逾期19天）' },
      { id: 'pay-18', date: '2025-02-28', amount: 5000, type: 'rent', status: 'paid', description: '2月租金（逾期27天）' },
      { id: 'pay-19', date: '2025-03-01', amount: 0, type: 'other', status: 'paid', description: '备注：租客称已付3月租金，但系统未到账，需核实' }
    ],
    correctAction: 'escalate',
    correctDeductions: [
      { itemId: 'wall-01', reason: '主卧墙面修复+宠物抓痕处理', amount: 2000 },
      { itemId: 'wall-02', reason: '擅自拆除承重墙，需恢复并鉴定', amount: 5000 },
      { itemId: 'wall-03', reason: '玄关壁纸拆除恢复', amount: 800 },
      { itemId: 'floor-01', reason: '原实木地板被更换，需赔偿', amount: 8000 },
      { itemId: 'floor-02', reason: '卫生间地砖修复', amount: 1500 },
      { itemId: 'door-01', reason: '入户门及门锁恢复', amount: 600 },
      { itemId: 'door-02', reason: '卧室门宠物损坏修复', amount: 800 },
      { itemId: 'window-01', reason: '窗纱更换', amount: 100 },
      { itemId: 'appliance-02', reason: '油烟机深度清洁', amount: 300 },
      { itemId: 'furniture-01', reason: '定制衣柜赔偿', amount: 3000 },
      { itemId: 'furniture-02', reason: '床垫更换', amount: 1000 },
      { itemId: 'furniture-03', reason: '餐桌椅赔偿', amount: 1500 },
      { itemId: 'furniture-04', reason: '沙发赔偿', amount: 2500 },
      { itemId: 'key-01', reason: '门禁卡补办', amount: 200 },
      { itemId: 'other-01', reason: '深度除味清洁', amount: 500 }
    ]
  }
];

export function getLevelById(id: string): Level | undefined {
  return levels.find(level => level.id === id);
}

export function getLevelsByDifficulty(difficulty: string): Level[] {
  return levels.filter(level => level.difficulty === difficulty);
}

export function getLevelsByTag(tagId: string): Level[] {
  return levels.filter(level => level.complaintTags.includes(tagId));
}
