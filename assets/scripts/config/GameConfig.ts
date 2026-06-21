import { Position, LevelConfig, SubsidyRule } from '../types/GameTypes';

export const MAP_LOCATIONS: Position[] = [
  { x: 200, y: 500, name: '阳光小区', address: '阳光路123号' },
  { x: 400, y: 300, name: '中心医院', address: '健康大道88号' },
  { x: 600, y: 550, name: '万达广场', address: '商业路66号' },
  { x: 800, y: 250, name: '科技园A区', address: '科技路1号' },
  { x: 300, y: 150, name: '大学城', address: '学府路99号' },
  { x: 700, y: 450, name: '美食街', address: '美食路55号' },
  { x: 500, y: 100, name: '火车站', address: '站前路1号' },
  { x: 150, y: 350, name: '居民区', address: '民安街45号' },
  { x: 900, y: 400, name: '物流园', address: '物流大道100号' },
  { x: 350, y: 450, name: '超市总店', address: '购物路8号' },
  { x: 650, y: 150, name: '写字楼', address: '办公街20号' },
  { x: 850, y: 550, name: '公园东门', address: '公园路16号' },
];

export const RIDER_NAMES = ['小张', '小李', '小王', '小刘', '小陈'];

export const WEATHER_EFFECTS = {
  sunny: { speedMultiplier: 1.0, rejectionRate: 0.05, name: '晴天' },
  rainy: { speedMultiplier: 0.7, rejectionRate: 0.15, name: '雨天' },
  snowy: { speedMultiplier: 0.5, rejectionRate: 0.25, name: '雪天' },
  hot: { speedMultiplier: 0.85, rejectionRate: 0.1, name: '高温' },
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '新手入门',
    description: '学习基础操作，处理简单订单',
    duration: 180,
    targetScore: 500,
    maxOrders: 5,
    maxCompensation: 100,
    orderFrequency: 8,
    riderCount: 2,
    initialSubsidies: ['peak_hour', 'long_distance'],
    weather: 'sunny',
    difficulty: 'easy',
  },
  {
    id: 2,
    name: '午间高峰',
    description: '应对午餐时段的订单压力',
    duration: 240,
    targetScore: 1200,
    maxOrders: 8,
    maxCompensation: 200,
    orderFrequency: 5,
    riderCount: 3,
    initialSubsidies: ['peak_hour', 'long_distance', 'urgent_bonus'],
    weather: 'sunny',
    difficulty: 'medium',
  },
  {
    id: 3,
    name: '雨天挑战',
    description: '恶劣天气下的运营管理',
    duration: 300,
    targetScore: 2000,
    maxOrders: 12,
    maxCompensation: 400,
    orderFrequency: 4,
    riderCount: 4,
    initialSubsidies: ['weather_bonus', 'peak_hour', 'long_distance', 'urgent_bonus'],
    weather: 'rainy',
    difficulty: 'hard',
  },
];

export const SUBSIDY_RULES: SubsidyRule[] = [
  {
    id: 'peak_hour',
    name: '高峰时段补贴',
    description: '午晚高峰时段每单额外补贴',
    condition: { timeRange: [720, 840] },
    subsidyType: 'per_order',
    value: 3,
    active: true,
  },
  {
    id: 'long_distance',
    name: '远距离补贴',
    description: '超过3公里订单按距离补贴',
    condition: { minDistance: 3000 },
    subsidyType: 'distance_multiplier',
    value: 0.5,
    active: true,
  },
  {
    id: 'urgent_bonus',
    name: '加急单补贴',
    description: 'VIP和加急订单额外补贴',
    condition: { priority: 'urgent' },
    subsidyType: 'per_order',
    value: 5,
    active: true,
  },
  {
    id: 'weather_bonus',
    name: '恶劣天气补贴',
    description: '雨雪天气全单补贴',
    condition: { weather: 'rainy' },
    subsidyType: 'per_order',
    value: 4,
    active: true,
  },
];

export const COMPENSATION_RULES = {
  late_delivery: { base: 10, perMinute: 2, max: 50 },
  wrong_address: { base: 20, max: 30 },
  rider_rejection: { base: 15, max: 25 },
  order_cancel: { base: 8, max: 15 },
};

export const KEYBOARD_SHORTCUTS = {
  assign_rider: ['1', '2', '3', '4', '5'],
  apply_subsidy: ['q', 'w', 'e', 'r'],
  confirm: ['Enter', 'Space'],
  cancel: ['Escape'],
  pause: ['p', 'P'],
  speed_up: ['ArrowUp'],
  speed_down: ['ArrowDown'],
};
