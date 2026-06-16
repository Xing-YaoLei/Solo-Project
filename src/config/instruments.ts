import type { Instrument } from '../game/types'

export const INSTRUMENTS: Record<string, Instrument> = {
  treadmill: {
    id: 'treadmill',
    name: '康复跑步机',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 500,
    icon: '🏃'
  },
  exercise_bike: {
    id: 'exercise_bike',
    name: '健身车',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 300,
    icon: '🚴'
  },
  ultrasound: {
    id: 'ultrasound',
    name: '超声波治疗仪',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 800,
    icon: '📡'
  },
  tens_machine: {
    id: 'tens_machine',
    name: 'TENS电疗仪',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 600,
    icon: '⚡'
  },
  shockwave: {
    id: 'shockwave',
    name: '冲击波治疗仪',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 1500,
    icon: '💥'
  },
  laser_therapy: {
    id: 'laser_therapy',
    name: '激光治疗仪',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 1200,
    icon: '🔴'
  },
  hydrotherapy: {
    id: 'hydrotherapy',
    name: '水疗池',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 2000,
    icon: '💧'
  },
  balance_board: {
    id: 'balance_board',
    name: '平衡训练板',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 200,
    icon: '⚖️'
  },
  robot_gait: {
    id: 'robot_gait',
    name: '步态训练机器人',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 3000,
    icon: '🤖'
  },
  vr_rehab: {
    id: 'vr_rehab',
    name: 'VR康复系统',
    status: 'available',
    durability: 100,
    maxDurability: 100,
    maintenanceCost: 2500,
    icon: '🥽'
  }
}
