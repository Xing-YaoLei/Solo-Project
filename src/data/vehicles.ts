import type { Vehicle } from '@/types';

export const VEHICLES: Vehicle[] = [
  {
    id: 'v001',
    brand: '大众',
    model: '帕萨特',
    year: 2019,
    mileage: 85000,
    faultCodes: ['P0300', 'P0171'],
    customerDescription: '车辆启动时抖动明显，加速无力，油耗比平时高了不少。',
    color: '#1E3A5F'
  },
  {
    id: 'v002',
    brand: '丰田',
    model: '凯美瑞',
    year: 2020,
    mileage: 62000,
    faultCodes: ['C0035', 'C1223'],
    customerDescription: '刹车时有异响，尤其是高速行驶时感觉刹不住，ABS灯偶尔亮起。',
    color: '#E85D04'
  },
  {
    id: 'v003',
    brand: '本田',
    model: '雅阁',
    year: 2018,
    mileage: 120000,
    faultCodes: ['P0420', 'P0430'],
    customerDescription: '尾气味道很重，发动机故障灯亮了，年检没通过。',
    color: '#10B981'
  },
  {
    id: 'v004',
    brand: '宝马',
    model: '3系',
    year: 2021,
    mileage: 45000,
    faultCodes: ['B1000', 'U0100'],
    customerDescription: '中控屏幕偶尔黑屏，倒车雷达失灵，电子系统有各种小问题。',
    color: '#374151'
  },
  {
    id: 'v005',
    brand: '奥迪',
    model: 'A4L',
    year: 2017,
    mileage: 150000,
    faultCodes: ['P0521', 'P0011'],
    customerDescription: '烧机油严重，每1000公里就要加一升，冷车启动有异响。',
    color: '#6B7280'
  },
  {
    id: 'v006',
    brand: '奔驰',
    model: 'C级',
    year: 2020,
    mileage: 38000,
    faultCodes: ['P0700', 'P0720'],
    customerDescription: '换挡时顿挫感明显，有时候挂不上档，变速箱故障灯闪烁。',
    color: '#1E293B'
  },
  {
    id: 'v007',
    brand: '比亚迪',
    model: '汉EV',
    year: 2022,
    mileage: 25000,
    faultCodes: ['P1B00', 'P0AA0'],
    customerDescription: '续航比标称的少了很多，充电速度变慢，电池管理系统报警。',
    color: '#06B6D4'
  },
  {
    id: 'v008',
    brand: '特斯拉',
    model: 'Model 3',
    year: 2021,
    mileage: 55000,
    faultCodes: ['C10D0', 'U0140'],
    customerDescription: '悬挂感觉很硬，过减速带时异响明显，车身高度传感器报错。',
    color: '#F1F5F9'
  }
];

export function getRandomVehicle(): Vehicle {
  return VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
}
