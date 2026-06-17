import { Activity } from '../types/game'

export const activities: Activity[] = [
  {
    id: 'act_001',
    name: '晨间太极',
    time: '07:00',
    duration: 30,
    location: '花园',
    description: '晨间轻柔太极拳活动，适合所有老人参加。',
    requiredFor: ['elder_001', 'elder_003', 'elder_005']
  },
  {
    id: 'act_002',
    name: '早餐时间',
    time: '07:30',
    duration: 45,
    location: '餐厅',
    description: '营养早餐，注意特殊饮食需求。',
    requiredFor: ['elder_001', 'elder_002', 'elder_003', 'elder_004', 'elder_005', 'elder_006']
  },
  {
    id: 'act_003',
    name: '书法练习',
    time: '09:00',
    duration: 60,
    location: '活动室',
    description: '书法练习活动，锻炼手部灵活性和专注力。',
    requiredFor: ['elder_002', 'elder_004', 'elder_005']
  },
  {
    id: 'act_004',
    name: '健康讲座',
    time: '10:30',
    duration: 45,
    location: '多功能厅',
    description: '夏季养生健康知识讲座。',
    requiredFor: ['elder_001', 'elder_002', 'elder_003', 'elder_004', 'elder_005']
  },
  {
    id: 'act_005',
    name: '午餐时间',
    time: '11:30',
    duration: 45,
    location: '餐厅',
    description: '午餐时间，注意观察老人进食情况。',
    requiredFor: ['elder_001', 'elder_002', 'elder_003', 'elder_004', 'elder_005', 'elder_006']
  },
  {
    id: 'act_006',
    name: '午休',
    time: '12:30',
    duration: 90,
    location: '各自房间',
    description: '午间休息时间，保持环境安静。',
    requiredFor: ['elder_001', 'elder_002', 'elder_003', 'elder_004', 'elder_005', 'elder_006']
  },
  {
    id: 'act_007',
    name: '园艺活动',
    time: '14:30',
    duration: 60,
    location: '花园',
    description: '花园种植和浇水活动，亲近自然。',
    requiredFor: ['elder_001', 'elder_004', 'elder_005']
  },
  {
    id: 'act_008',
    name: '茶话会',
    time: '16:00',
    duration: 45,
    location: '休息区',
    description: '下午茶和社交时间。',
    requiredFor: ['elder_001', 'elder_003', 'elder_004', 'elder_005']
  },
  {
    id: 'act_009',
    name: '晚餐时间',
    time: '17:30',
    duration: 45,
    location: '餐厅',
    description: '晚餐时间，注意观察老人进食情况。',
    requiredFor: ['elder_001', 'elder_002', 'elder_003', 'elder_004', 'elder_005', 'elder_006']
  },
  {
    id: 'act_010',
    name: '晚间电影',
    time: '19:00',
    duration: 120,
    location: '多功能厅',
    description: '经典老电影放映。',
    requiredFor: ['elder_001', 'elder_002', 'elder_004', 'elder_005']
  }
]
