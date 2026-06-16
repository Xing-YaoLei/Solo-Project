import type { LevelConfig } from '../game/types'

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '初出茅庐',
    description: '熟悉康复中心的基本运营流程，学习接待简单患者',
    taskCount: 3,
    complexity: 1,
    unlockInstruments: ['treadmill', 'exercise_bike'],
    unlockTreatments: ['physiotherapy_basic', 'massage_relax'],
    targetScore: 500
  },
  {
    id: 2,
    name: '稳步发展',
    description: '扩展治疗项目，学习处理医保结算细节',
    taskCount: 4,
    complexity: 2,
    unlockInstruments: ['ultrasound', 'tens_machine'],
    unlockTreatments: ['ultrasound_therapy', 'electrotherapy'],
    targetScore: 1000
  },
  {
    id: 3,
    name: '精益求精',
    description: '处理复杂病例，平衡治疗效果与医保合规',
    taskCount: 5,
    complexity: 3,
    unlockInstruments: ['shockwave', 'laser_therapy'],
    unlockTreatments: ['shockwave_therapy', 'laser_treatment'],
    targetScore: 1800
  },
  {
    id: 4,
    name: '行业精英',
    description: '高难度病例挑战，严格的医保审计环境',
    taskCount: 6,
    complexity: 4,
    unlockInstruments: ['hydrotherapy', 'balance_board'],
    unlockTreatments: ['hydrotherapy_session', 'balance_training'],
    targetScore: 2800
  },
  {
    id: 5,
    name: '康复大师',
    description: '终极挑战，综合运用所有知识经营康复中心',
    taskCount: 8,
    complexity: 5,
    unlockInstruments: ['robot_gait', 'vr_rehab'],
    unlockTreatments: ['robot_assisted', 'vr_therapy'],
    targetScore: 4000
  }
]
