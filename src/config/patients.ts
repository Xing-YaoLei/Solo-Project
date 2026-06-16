import type { Patient, Clue } from '../game/types'

const FIRST_NAMES = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨光', '赵敏', '黄磊', '周婷', '吴强', '徐丽', '孙浩']
const DIAGNOSES = [
  { name: '腰椎间盘突出', symptoms: ['腰痛', '下肢放射痛', '活动受限'], treatments: ['physiotherapy_basic', 'massage_relax', 'ultrasound_therapy'] },
  { name: '膝关节骨性关节炎', symptoms: ['膝关节疼痛', '肿胀', '活动受限'], treatments: ['physiotherapy_basic', 'electrotherapy', 'hydrotherapy_session'] },
  { name: '颈椎病', symptoms: ['颈肩痛', '手臂麻木', '头晕'], treatments: ['massage_relax', 'electrotherapy', 'ultrasound_therapy'] },
  { name: '脑卒中后遗症', symptoms: ['肢体偏瘫', '平衡障碍', '步态异常'], treatments: ['physiotherapy_basic', 'balance_training', 'robot_assisted'] },
  { name: '肩周炎', symptoms: ['肩部疼痛', '活动受限', '夜间痛'], treatments: ['massage_relax', 'electrotherapy', 'shockwave_therapy'] },
  { name: '跟腱炎', symptoms: ['足跟痛', '行走困难', '局部肿胀'], treatments: ['ultrasound_therapy', 'shockwave_therapy', 'laser_treatment'] },
  { name: '骨折术后康复', symptoms: ['关节僵硬', '肌肉萎缩', '活动受限'], treatments: ['physiotherapy_basic', 'balance_training', 'hydrotherapy_session'] },
  { name: '慢性腰痛', symptoms: ['反复腰痛', '腰肌紧张', '久坐加重'], treatments: ['massage_relax', 'physiotherapy_basic', 'vr_therapy'] }
]

let patientIdCounter = 0

export function generatePatient(unlockedTreatments: string[]): Patient {
  const eligibleDiagnoses = DIAGNOSES.filter(d =>
    d.treatments.some(t => unlockedTreatments.includes(t))
  )

  const pool = eligibleDiagnoses.length > 0 ? eligibleDiagnoses : DIAGNOSES

  const id = `patient_${Date.now()}_${patientIdCounter++}`
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const age = 35 + Math.floor(Math.random() * 45)
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  const diagnosis = pool[Math.floor(Math.random() * pool.length)]
  const insuranceTypes: Array<'basic' | 'supplementary' | 'commercial'> = ['basic', 'basic', 'basic', 'supplementary', 'commercial']
  const insuranceType = insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)]
  const avatars = gender === 'male' ? ['👨', '👴', '👨‍🦰', '👨‍🦱'] : ['👩', '👵', '👩‍🦰', '👩‍🦱']

  const availableTreatments = diagnosis.treatments.filter(t => unlockedTreatments.includes(t))
  const treatmentCount = Math.max(1, Math.min(availableTreatments.length, 1 + Math.floor(Math.random() * availableTreatments.length)))
  const selectedTreatments = [...availableTreatments].sort(() => Math.random() - 0.5).slice(0, treatmentCount)

  return {
    id,
    name,
    age,
    gender,
    diagnosis: diagnosis.name,
    insuranceType,
    symptoms: diagnosis.symptoms,
    requiredTreatments: selectedTreatments,
    avatar: avatars[Math.floor(Math.random() * avatars.length)]
  }
}

export function generateClues(patient: Patient): Clue[] {
  const clues: Clue[] = [
    {
      id: `clue_${patient.id}_symptom`,
      content: `主诉症状：${patient.symptoms.join('、')}`,
      type: 'symptom',
      isRevealed: true
    },
    {
      id: `clue_${patient.id}_diagnosis`,
      content: `临床诊断：${patient.diagnosis}`,
      type: 'symptom',
      isRevealed: true
    },
    {
      id: `clue_${patient.id}_insurance`,
      content: `医保类型：${patient.insuranceType === 'basic' ? '基本医疗保险' : patient.insuranceType === 'supplementary' ? '补充医疗保险' : '商业保险'}`,
      type: 'insurance',
      isRevealed: false
    },
    {
      id: `clue_${patient.id}_history`,
      content: `既往史：${Math.random() > 0.5 ? '有高血压病史，需注意治疗强度' : '无特殊既往史'}`,
      type: 'history',
      isRevealed: false
    },
    {
      id: `clue_${patient.id}_risk`,
      content: `风险提示：${Math.random() > 0.7 ? '该患者对超声波治疗过敏，禁用相关项目' : '无特殊治疗禁忌'}`,
      type: 'risk',
      isRevealed: false
    }
  ]
  return clues
}
