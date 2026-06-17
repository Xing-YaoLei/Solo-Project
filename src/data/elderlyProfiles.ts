import { ElderlyProfile } from '../types/game'

export const elderlyProfiles: ElderlyProfile[] = [
  {
    id: 'elder_001',
    name: '张奶奶',
    age: 78,
    avatar: '👵',
    room: '301室',
    medicalConditions: ['高血压', '糖尿病', '轻度关节炎'],
    medications: [
      { id: 'med_001', name: '硝苯地平', dosage: '10mg', time: '08:00', frequency: 'daily', type: 'tablet', withFood: false, sideEffects: ['头晕'] },
      { id: 'med_002', name: '二甲双胍', dosage: '500mg', time: '08:00', frequency: 'twice_daily', type: 'tablet', withFood: true, sideEffects: ['胃部不适'] }
    ],
    allergies: ['青霉素'],
    dietaryRestrictions: ['低盐', '低糖'],
    activityLevel: 'medium',
    notes: '喜欢下棋，早上有时会头晕，需要提醒慢慢起床。'
  },
  {
    id: 'elder_002',
    name: '李爷爷',
    age: 82,
    avatar: '👴',
    room: '302室',
    medicalConditions: ['冠心病', '前列腺增生', '轻度认知障碍'],
    medications: [
      { id: 'med_003', name: '阿司匹林', dosage: '100mg', time: '08:00', frequency: 'daily', type: 'tablet', withFood: true, sideEffects: ['胃部刺激'] },
      { id: 'med_004', name: '阿托伐他汀', dosage: '20mg', time: '20:00', frequency: 'daily', type: 'tablet', withFood: false, sideEffects: ['肌肉酸痛'] }
    ],
    allergies: ['磺胺类药物'],
    dietaryRestrictions: ['低脂肪'],
    activityLevel: 'low',
    notes: '记忆力不好，需要反复提醒；晚上容易起夜，注意防跌倒。'
  },
  {
    id: 'elder_003',
    name: '王奶奶',
    age: 75,
    avatar: '👵',
    room: '303室',
    medicalConditions: ['骨质疏松', '抑郁症', '失眠'],
    medications: [
      { id: 'med_005', name: '钙尔奇D', dosage: '600mg', time: '08:00', frequency: 'daily', type: 'tablet', withFood: true, sideEffects: ['便秘'] },
      { id: 'med_006', name: '舍曲林', dosage: '50mg', time: '08:00', frequency: 'daily', type: 'tablet', withFood: false, sideEffects: ['恶心'] },
      { id: 'med_007', name: '佐匹克隆', dosage: '7.5mg', time: '22:00', frequency: 'as_needed', type: 'tablet', withFood: false, sideEffects: ['嗜睡'] }
    ],
    allergies: ['无'],
    dietaryRestrictions: ['高钙'],
    activityLevel: 'low',
    notes: '情绪容易低落，需要多陪伴交流；动作缓慢，不要催促。'
  },
  {
    id: 'elder_004',
    name: '刘爷爷',
    age: 85,
    avatar: '👴',
    room: '304室',
    medicalConditions: ['高血压', '糖尿病', '慢性支气管炎', '类风湿性关节炎'],
    medications: [
      { id: 'med_008', name: '缬沙坦', dosage: '80mg', time: '08:00', frequency: 'daily', type: 'capsule', withFood: false, sideEffects: ['咳嗽'] },
      { id: 'med_009', name: '胰岛素', dosage: '10U', time: '07:30', frequency: 'twice_daily', type: 'injection', withFood: false, sideEffects: ['低血糖'] },
      { id: 'med_010', name: '氨茶碱', dosage: '100mg', time: '08:00', frequency: 'twice_daily', type: 'tablet', withFood: true, sideEffects: ['心慌'] }
    ],
    allergies: ['海鲜'],
    dietaryRestrictions: ['低盐', '低糖', '糖尿病饮食'],
    activityLevel: 'high',
    notes: '性格开朗，喜欢参加活动；需要监测血糖，注意胰岛素注射时间。'
  },
  {
    id: 'elder_005',
    name: '陈奶奶',
    age: 72,
    avatar: '👵',
    room: '305室',
    medicalConditions: ['偏头痛', '干眼症', '胃食管反流'],
    medications: [
      { id: 'med_011', name: '奥美拉唑', dosage: '20mg', time: '07:00', frequency: 'daily', type: 'capsule', withFood: false, sideEffects: ['头痛'] },
      { id: 'med_012', name: '布洛芬', dosage: '200mg', time: 'as_needed', frequency: 'as_needed', type: 'tablet', withFood: true, sideEffects: ['胃痛'] }
    ],
    allergies: ['花粉'],
    dietaryRestrictions: ['避免辛辣刺激'],
    activityLevel: 'high',
    notes: '非常活跃，喜欢组织活动；有时会忘记吃饭导致胃痛。'
  },
  {
    id: 'elder_006',
    name: '赵爷爷',
    age: 88,
    avatar: '👴',
    room: '306室',
    medicalConditions: ['阿尔茨海默病', '高血压', '便秘'],
    medications: [
      { id: 'med_013', name: '多奈哌齐', dosage: '5mg', time: '20:00', frequency: 'daily', type: 'tablet', withFood: false, sideEffects: ['失眠'] },
      { id: 'med_014', name: '氨氯地平', dosage: '5mg', time: '08:00', frequency: 'daily', type: 'tablet', withFood: false, sideEffects: ['水肿'] },
      { id: 'med_015', name: '乳果糖', dosage: '15ml', time: '08:00', frequency: 'daily', type: 'liquid', withFood: false, sideEffects: ['腹胀'] }
    ],
    allergies: ['无'],
    dietaryRestrictions: ['高纤维'],
    activityLevel: 'low',
    notes: '晚期痴呆，需要全面护理；有时会躁动，需要耐心安抚。'
  }
]
