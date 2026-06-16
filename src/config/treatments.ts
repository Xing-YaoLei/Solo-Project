import type { Treatment } from '../game/types'

export const TREATMENTS: Record<string, Treatment> = {
  physiotherapy_basic: {
    id: 'physiotherapy_basic',
    name: '基础理疗',
    duration: 30,
    cost: 200,
    insuranceCovered: true,
    insuranceRatio: 0.8,
    requiredInstrument: 'treadmill',
    category: '运动疗法'
  },
  massage_relax: {
    id: 'massage_relax',
    name: '放松按摩',
    duration: 45,
    cost: 300,
    insuranceCovered: true,
    insuranceRatio: 0.6,
    requiredInstrument: 'exercise_bike',
    category: '手法治疗'
  },
  ultrasound_therapy: {
    id: 'ultrasound_therapy',
    name: '超声波治疗',
    duration: 20,
    cost: 350,
    insuranceCovered: true,
    insuranceRatio: 0.75,
    requiredInstrument: 'ultrasound',
    category: '物理因子治疗'
  },
  electrotherapy: {
    id: 'electrotherapy',
    name: '电疗',
    duration: 25,
    cost: 280,
    insuranceCovered: true,
    insuranceRatio: 0.85,
    requiredInstrument: 'tens_machine',
    category: '物理因子治疗'
  },
  shockwave_therapy: {
    id: 'shockwave_therapy',
    name: '冲击波治疗',
    duration: 15,
    cost: 600,
    insuranceCovered: false,
    insuranceRatio: 0,
    requiredInstrument: 'shockwave',
    category: '高级治疗'
  },
  laser_treatment: {
    id: 'laser_treatment',
    name: '激光治疗',
    duration: 15,
    cost: 500,
    insuranceCovered: true,
    insuranceRatio: 0.5,
    requiredInstrument: 'laser_therapy',
    category: '高级治疗'
  },
  hydrotherapy_session: {
    id: 'hydrotherapy_session',
    name: '水疗',
    duration: 40,
    cost: 450,
    insuranceCovered: true,
    insuranceRatio: 0.7,
    requiredInstrument: 'hydrotherapy',
    category: '水疗'
  },
  balance_training: {
    id: 'balance_training',
    name: '平衡训练',
    duration: 30,
    cost: 320,
    insuranceCovered: true,
    insuranceRatio: 0.8,
    requiredInstrument: 'balance_board',
    category: '运动疗法'
  },
  robot_assisted: {
    id: 'robot_assisted',
    name: '机器人辅助训练',
    duration: 45,
    cost: 800,
    insuranceCovered: false,
    insuranceRatio: 0,
    requiredInstrument: 'robot_gait',
    category: '智能康复'
  },
  vr_therapy: {
    id: 'vr_therapy',
    name: 'VR康复训练',
    duration: 35,
    cost: 650,
    insuranceCovered: false,
    insuranceRatio: 0,
    requiredInstrument: 'vr_rehab',
    category: '智能康复'
  }
}
