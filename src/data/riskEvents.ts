import { RiskEvent } from '../types/game'

export const riskEvents: RiskEvent[] = [
  {
    id: 'risk_001',
    type: 'fall',
    severity: 'high',
    description: '张奶奶在走廊不慎跌倒，主诉左腿疼痛无法站立。',
    elderlyId: 'elder_001',
    timeLimit: 15,
    correctActions: ['立即上前搀扶并询问伤情', '检查意识和生命体征', '呼叫医生进行评估', '记录事件经过'],
    wrongActions: ['直接拉起老人', '让老人自行起来', '忽略继续其他工作', '给老人按摩疼痛部位']
  },
  {
    id: 'risk_002',
    type: 'confusion',
    severity: 'medium',
    description: '李爷爷表现出意识混乱，不认识周围环境，反复询问"这是哪里"。',
    elderlyId: 'elder_002',
    timeLimit: 20,
    correctActions: ['温和地告知所在地点和时间', '保持环境安静避免刺激', '检查血糖和血压', '观察是否有其他异常症状'],
    wrongActions: ['纠正老人的错误认知并争论', '给老人服用镇静剂', '让老人独处', '大声说话试图唤醒老人']
  },
  {
    id: 'risk_003',
    type: 'medication_error',
    severity: 'critical',
    description: '发现刘爷爷可能误服了双倍剂量的降压药，目前感觉头晕。',
    elderlyId: 'elder_004',
    timeLimit: 10,
    correctActions: ['立即测量血压', '让老人平卧休息', '紧急呼叫医生', '准备好急救物品'],
    wrongActions: ['让老人多喝水稀释', '给老人服用升压药', '观察一会儿再说', '让老人活动促进代谢']
  },
  {
    id: 'risk_004',
    type: 'agitation',
    severity: 'medium',
    description: '赵爷爷情绪激动，大声喊叫并试图离开房间。',
    elderlyId: 'elder_006',
    timeLimit: 20,
    correctActions: ['保持冷静温和的态度', '用简单语言安抚', '移除周围危险物品', '观察是否有身体不适'],
    wrongActions: ['试图约束老人', '大声呵斥制止', '多人围堵', '立即给药镇静']
  },
  {
    id: 'risk_005',
    type: 'health_decline',
    severity: 'high',
    description: '王奶奶主诉胸闷气短，面色苍白，出冷汗。',
    elderlyId: 'elder_003',
    timeLimit: 10,
    correctActions: ['让老人静坐或半卧位', '测量血压和心率', '立即呼叫医生', '准备吸氧设备'],
    wrongActions: ['让老人继续活动', '给老人喝温水', '等待观察是否缓解', '让老人回房间休息']
  },
  {
    id: 'risk_006',
    type: 'fall',
    severity: 'medium',
    description: '陈奶奶在下楼梯时扭伤脚踝，局部肿胀疼痛。',
    elderlyId: 'elder_005',
    timeLimit: 15,
    correctActions: ['协助老人坐下休息', '检查伤处并冷敷', '限制患肢活动', '必要时就医检查'],
    wrongActions: ['立即热敷消肿', '按摩扭伤部位', '让老人试着走路', '忽略症状继续活动']
  },
  {
    id: 'risk_007',
    type: 'medication_error',
    severity: 'high',
    description: '发现李爷爷服用了过敏药物磺胺类，皮肤出现红疹瘙痒。',
    elderlyId: 'elder_002',
    timeLimit: 12,
    correctActions: ['立即停止服用可疑药物', '观察过敏反应程度', '告知医生评估', '准备抗过敏药物'],
    wrongActions: ['继续服用其他药物', '涂抹止痒药膏了事', '等待自行消退', '给老人洗热水澡']
  },
  {
    id: 'risk_008',
    type: 'confusion',
    severity: 'low',
    description: '张奶奶忘记是否已经吃过早餐，反复询问。',
    elderlyId: 'elder_001',
    timeLimit: 25,
    correctActions: ['耐心告知已用餐并出示证据', '温和转移话题', '查看用餐记录确认', '给予适当的安抚'],
    wrongActions: ['不耐烦地重复回答', '指责老人记忆力差', '让老人再吃一份', '不予理睬']
  }
]
