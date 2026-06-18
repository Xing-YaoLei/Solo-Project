import type { Level, ChecklistTask, TestDriveTask, QuotationTask } from '@/types'

export const levels: Level[] = [
  { id: 1, name: '新手试车场', timeLimit: 90, carCount: 3, difficulty: 1.0 },
  { id: 2, name: '城区展厅', timeLimit: 75, carCount: 4, difficulty: 1.5 },
  { id: 3, name: '精品车廊', timeLimit: 60, carCount: 5, difficulty: 2.0 },
  { id: 4, name: '旗舰展厅', timeLimit: 50, carCount: 6, difficulty: 2.5 },
  { id: 5, name: '大师挑战赛', timeLimit: 40, carCount: 7, difficulty: 3.0 },
]

export const checklistTasks: Record<number, ChecklistTask[]> = {
  1: [
    { id: 'c1-cl-1', levelId: 1, carModel: '大众朗逸', item: '刹车片磨损检查', actualOk: true, displayOk: true, detail: '前刹车片厚度8mm，处于正常范围', resolved: false },
    { id: 'c1-cl-2', levelId: 1, carModel: '大众朗逸', item: '轮胎花纹深度', actualOk: true, displayOk: true, detail: '四条轮胎花纹深度均大于3mm', resolved: false },
    { id: 'c1-cl-3', levelId: 1, carModel: '丰田卡罗拉', item: '发动机油液位', actualOk: false, displayOk: true, detail: '机油液位低于下限刻度线，需补充', resolved: false },
    { id: 'c1-cl-4', levelId: 1, carModel: '本田思域', item: '冷却液浓度', actualOk: true, displayOk: true, detail: '冷却液冰点检测-35°C，浓度正常', resolved: false },
    { id: 'c1-cl-5', levelId: 1, carModel: '本田思域', item: '电瓶电压检测', actualOk: true, displayOk: true, detail: '静态电压12.6V，启动后14.2V，正常', resolved: false },
  ],
  2: [
    { id: 'c2-cl-1', levelId: 2, carModel: '别克君威', item: '刹车片磨损检查', actualOk: true, displayOk: true, detail: '前刹车片厚度7mm，后刹车片9mm', resolved: false },
    { id: 'c2-cl-2', levelId: 2, carModel: '别克君威', item: '轮胎花纹深度', actualOk: false, displayOk: true, detail: '右前轮花纹深度仅1.6mm，需更换', resolved: false },
    { id: 'c2-cl-3', levelId: 2, carModel: '日产轩逸', item: '发动机油液位', actualOk: true, displayOk: true, detail: '机油液位在上限与下限之间，正常', resolved: false },
    { id: 'c2-cl-4', levelId: 2, carModel: '现代伊兰特', item: '冷却液浓度', actualOk: false, displayOk: false, detail: '冷却液冰点仅-15°C，浓度不足', resolved: false },
    { id: 'c2-cl-5', levelId: 2, carModel: '现代伊兰特', item: '变速箱油品质', actualOk: true, displayOk: true, detail: '变速箱油呈红色透明状，无烧焦味', resolved: false },
    { id: 'c2-cl-6', levelId: 2, carModel: '雪佛兰科鲁兹', item: '电瓶电压检测', actualOk: false, displayOk: true, detail: '静态电压仅11.8V，电瓶需更换', resolved: false },
  ],
  3: [
    { id: 'c3-cl-1', levelId: 3, carModel: '宝马3系', item: '刹车片磨损检查', actualOk: true, displayOk: true, detail: '前后刹车片厚度均在6mm以上', resolved: false },
    { id: 'c3-cl-2', levelId: 3, carModel: '宝马3系', item: '轮胎花纹深度', actualOk: false, displayOk: true, detail: '左后轮花纹深度1.2mm，已到磨损极限', resolved: false },
    { id: 'c3-cl-3', levelId: 3, carModel: '奔驰C级', item: '发动机油液位', actualOk: true, displayOk: true, detail: '机油液位正常，品质清澈', resolved: false },
    { id: 'c3-cl-4', levelId: 3, carModel: '奔驰C级', item: '冷却液浓度', actualOk: true, displayOk: false, detail: '冷却液冰点-40°C，浓度正常', resolved: false },
    { id: 'c3-cl-5', levelId: 3, carModel: '奥迪A4L', item: '变速箱油品质', actualOk: false, displayOk: true, detail: '变速箱油发黑且有烧焦气味', resolved: false },
    { id: 'c3-cl-6', levelId: 3, carModel: '特斯拉Model 3', item: '电池健康度', actualOk: true, displayOk: true, detail: '电池SOH 92%，衰减在正常范围', resolved: false },
    { id: 'c3-cl-7', levelId: 3, carModel: '沃尔沃S60', item: '电瓶电压检测', actualOk: false, displayOk: true, detail: '静态电压12.1V，处于临界值', resolved: false },
  ],
  4: [
    { id: 'c4-cl-1', levelId: 4, carModel: '保时捷Macan', item: '刹车片磨损检查', actualOk: false, displayOk: true, detail: '前刹车片仅剩2mm，急需更换', resolved: false },
    { id: 'c4-cl-2', levelId: 4, carModel: '保时捷Macan', item: '轮胎花纹深度', actualOk: true, displayOk: true, detail: '四条轮胎花纹均大于4mm', resolved: false },
    { id: 'c4-cl-3', levelId: 4, carModel: '路虎揽胜极光', item: '发动机油液位', actualOk: false, displayOk: true, detail: '机油液位严重不足，低于下限', resolved: false },
    { id: 'c4-cl-4', levelId: 4, carModel: '凯迪拉克CT5', item: '冷却液浓度', actualOk: true, displayOk: false, detail: '冷却液冰点-38°C，浓度正常', resolved: false },
    { id: 'c4-cl-5', levelId: 4, carModel: '凯迪拉克CT5', item: '变速箱油品质', actualOk: true, displayOk: true, detail: '变速箱油清澈透明，品质良好', resolved: false },
    { id: 'c4-cl-6', levelId: 4, carModel: '林肯Z', item: '电瓶电压检测', actualOk: true, displayOk: true, detail: '静态电压12.5V，启动后14.1V', resolved: false },
    { id: 'c4-cl-7', levelId: 4, carModel: '雷克萨斯ES', item: '空调制冷效果', actualOk: false, displayOk: true, detail: '出风口温度18°C，制冷不足', resolved: false },
    { id: 'c4-cl-8', levelId: 4, carModel: '英菲尼迪Q50L', item: '底盘悬挂检查', actualOk: true, displayOk: false, detail: '减震器无漏油，弹簧无变形', resolved: false },
  ],
  5: [
    { id: 'c5-cl-1', levelId: 5, carModel: '玛莎拉蒂Ghibli', item: '刹车片磨损检查', actualOk: false, displayOk: true, detail: '后刹车片仅1.5mm，极度磨损', resolved: false },
    { id: 'c5-cl-2', levelId: 5, carModel: '玛莎拉蒂Ghibli', item: '轮胎花纹深度', actualOk: true, displayOk: false, detail: '四条轮胎花纹深度均大于3mm', resolved: false },
    { id: 'c5-cl-3', levelId: 5, carModel: '保时捷911', item: '发动机油液位', actualOk: false, displayOk: true, detail: '机油严重消耗，液位远低于下限', resolved: false },
    { id: 'c5-cl-4', levelId: 5, carModel: '路虎揽胜', item: '冷却液浓度', actualOk: true, displayOk: true, detail: '冷却液冰点-42°C，浓度正常', resolved: false },
    { id: 'c5-cl-5', levelId: 5, carModel: '宝马7系', item: '变速箱油品质', actualOk: false, displayOk: true, detail: '变速箱油呈深褐色且有金属碎屑', resolved: false },
    { id: 'c5-cl-6', levelId: 5, carModel: '奔驰S级', item: '电瓶电压检测', actualOk: false, displayOk: true, detail: '启动后电压仅13.4V，发电机异常', resolved: false },
    { id: 'c5-cl-7', levelId: 5, carModel: '奥迪A8L', item: '空调制冷效果', actualOk: true, displayOk: false, detail: '出风口温度4°C，制冷效果优秀', resolved: false },
    { id: 'c5-cl-8', levelId: 5, carModel: '雷克萨斯LS', item: '底盘悬挂检查', actualOk: false, displayOk: true, detail: '右前减震器漏油严重，需更换', resolved: false },
    { id: 'c5-cl-9', levelId: 5, carModel: '保时捷911', item: '排气管检测', actualOk: true, displayOk: true, detail: '排气管无锈蚀，消音器工作正常', resolved: false },
  ],
}

export const testDriveTasks: Record<number, TestDriveTask[]> = {
  1: [
    { id: 'c1-td-1', levelId: 1, carModel: '大众朗逸', field: '加速性能', actualValue: '0-100km/h 11.2s', displayValue: '0-100km/h 11.2s', hasError: false, resolved: false },
    { id: 'c1-td-2', levelId: 1, carModel: '丰田卡罗拉', field: '制动距离', actualValue: '100-0km/h 42.3m', displayValue: '100-0km/h 38.5m', hasError: true, resolved: false },
    { id: 'c1-td-3', levelId: 1, carModel: '本田思域', field: '转向灵敏度', actualValue: '方向盘圈数2.8', displayValue: '方向盘圈数2.8', hasError: false, resolved: false },
    { id: 'c1-td-4', levelId: 1, carModel: '本田思域', field: '怠速稳定性', actualValue: '转速波动±20rpm', displayValue: '转速波动±20rpm', hasError: false, resolved: false },
  ],
  2: [
    { id: 'c2-td-1', levelId: 2, carModel: '别克君威', field: '加速性能', actualValue: '0-100km/h 9.8s', displayValue: '0-100km/h 8.5s', hasError: true, resolved: false },
    { id: 'c2-td-2', levelId: 2, carModel: '日产轩逸', field: '制动距离', actualValue: '100-0km/h 40.1m', displayValue: '100-0km/h 40.1m', hasError: false, resolved: false },
    { id: 'c2-td-3', levelId: 2, carModel: '现代伊兰特', field: '转向灵敏度', actualValue: '方向盘圈数3.1', displayValue: '方向盘圈数2.6', hasError: true, resolved: false },
    { id: 'c2-td-4', levelId: 2, carModel: '雪佛兰科鲁兹', field: '怠速稳定性', actualValue: '转速波动±15rpm', displayValue: '转速波动±15rpm', hasError: false, resolved: false },
    { id: 'c2-td-5', levelId: 2, carModel: '别克君威', field: '换挡平顺性', actualValue: '顿挫感明显', displayValue: '换挡平顺', hasError: true, resolved: false },
  ],
  3: [
    { id: 'c3-td-1', levelId: 3, carModel: '宝马3系', field: '加速性能', actualValue: '0-100km/h 6.2s', displayValue: '0-100km/h 6.2s', hasError: false, resolved: false },
    { id: 'c3-td-2', levelId: 3, carModel: '奔驰C级', field: '制动距离', actualValue: '100-0km/h 39.8m', displayValue: '100-0km/h 36.2m', hasError: true, resolved: false },
    { id: 'c3-td-3', levelId: 3, carModel: '奥迪A4L', field: '转向灵敏度', actualValue: '方向盘圈数2.5', displayValue: '方向盘圈数2.5', hasError: false, resolved: false },
    { id: 'c3-td-4', levelId: 3, carModel: '特斯拉Model 3', field: '加速性能', actualValue: '0-100km/h 5.6s', displayValue: '0-100km/h 4.8s', hasError: true, resolved: false },
    { id: 'c3-td-5', levelId: 3, carModel: '沃尔沃S60', field: '怠速稳定性', actualValue: '转速波动±30rpm', displayValue: '转速波动±10rpm', hasError: true, resolved: false },
    { id: 'c3-td-6', levelId: 3, carModel: '宝马3系', field: '换挡平顺性', actualValue: '换挡平顺', displayValue: '换挡平顺', hasError: false, resolved: false },
  ],
  4: [
    { id: 'c4-td-1', levelId: 4, carModel: '保时捷Macan', field: '加速性能', actualValue: '0-100km/h 5.2s', displayValue: '0-100km/h 4.6s', hasError: true, resolved: false },
    { id: 'c4-td-2', levelId: 4, carModel: '路虎揽胜极光', field: '制动距离', actualValue: '100-0km/h 43.5m', displayValue: '100-0km/h 38.0m', hasError: true, resolved: false },
    { id: 'c4-td-3', levelId: 4, carModel: '凯迪拉克CT5', field: '转向灵敏度', actualValue: '方向盘圈数2.7', displayValue: '方向盘圈数2.7', hasError: false, resolved: false },
    { id: 'c4-td-4', levelId: 4, carModel: '林肯Z', field: '怠速稳定性', actualValue: '转速波动±25rpm', displayValue: '转速波动±25rpm', hasError: false, resolved: false },
    { id: 'c4-td-5', levelId: 4, carModel: '雷克萨斯ES', field: '换挡平顺性', actualValue: '换挡平顺', displayValue: '换挡平顺', hasError: false, resolved: false },
    { id: 'c4-td-6', levelId: 4, carModel: '英菲尼迪Q50L', field: '加速性能', actualValue: '0-100km/h 7.1s', displayValue: '0-100km/h 5.9s', hasError: true, resolved: false },
    { id: 'c4-td-7', levelId: 4, carModel: '路虎揽胜极光', field: '越野通过性', actualValue: '接近角20°/离去角28°', displayValue: '接近角25°/离去角32°', hasError: true, resolved: false },
  ],
  5: [
    { id: 'c5-td-1', levelId: 5, carModel: '玛莎拉蒂Ghibli', field: '加速性能', actualValue: '0-100km/h 5.5s', displayValue: '0-100km/h 4.8s', hasError: true, resolved: false },
    { id: 'c5-td-2', levelId: 5, carModel: '保时捷911', field: '制动距离', actualValue: '100-0km/h 34.2m', displayValue: '100-0km/h 34.2m', hasError: false, resolved: false },
    { id: 'c5-td-3', levelId: 5, carModel: '路虎揽胜', field: '转向灵敏度', actualValue: '方向盘圈数3.5', displayValue: '方向盘圈数2.8', hasError: true, resolved: false },
    { id: 'c5-td-4', levelId: 5, carModel: '宝马7系', field: '怠速稳定性', actualValue: '转速波动±35rpm', displayValue: '转速波动±10rpm', hasError: true, resolved: false },
    { id: 'c5-td-5', levelId: 5, carModel: '奔驰S级', field: '换挡平顺性', actualValue: '偶有顿挫', displayValue: '换挡平顺', hasError: true, resolved: false },
    { id: 'c5-td-6', levelId: 5, carModel: '奥迪A8L', field: '加速性能', actualValue: '0-100km/h 5.8s', displayValue: '0-100km/h 5.8s', hasError: false, resolved: false },
    { id: 'c5-td-7', levelId: 5, carModel: '雷克萨斯LS', field: 'NVH静音性', actualValue: '怠速42dB', displayValue: '怠速42dB', hasError: false, resolved: false },
    { id: 'c5-td-8', levelId: 5, carModel: '保时捷911', field: '制动距离', actualValue: '100-0km/h 33.8m', displayValue: '100-0km/h 30.1m', hasError: true, resolved: false },
  ],
}

export const quotationTasks: Record<number, QuotationTask[]> = {
  1: [
    { id: 'c1-qt-1', levelId: 1, carModel: '大众朗逸', marketPrice: 85000, options: [72000, 85000, 98000, 110000], correctIndex: 1, resolved: false, selectedIndex: null },
    { id: 'c1-qt-2', levelId: 1, carModel: '丰田卡罗拉', marketPrice: 92000, options: [92000, 78000, 105000, 120000], correctIndex: 0, resolved: false, selectedIndex: null },
    { id: 'c1-qt-3', levelId: 1, carModel: '本田思域', marketPrice: 108000, options: [85000, 95000, 108000, 130000], correctIndex: 2, resolved: false, selectedIndex: null },
  ],
  2: [
    { id: 'c2-qt-1', levelId: 2, carModel: '别克君威', marketPrice: 112000, options: [98000, 112000, 128000, 145000], correctIndex: 1, resolved: false, selectedIndex: null },
    { id: 'c2-qt-2', levelId: 2, carModel: '日产轩逸', marketPrice: 78000, options: [65000, 78000, 89000, 102000], correctIndex: 1, resolved: false, selectedIndex: null },
    { id: 'c2-qt-3', levelId: 2, carModel: '现代伊兰特', marketPrice: 65000, options: [65000, 52000, 78000, 91000], correctIndex: 0, resolved: false, selectedIndex: null },
  ],
  3: [
    { id: 'c3-qt-1', levelId: 3, carModel: '宝马3系', marketPrice: 225000, options: [198000, 215000, 225000, 258000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c3-qt-2', levelId: 3, carModel: '奔驰C级', marketPrice: 238000, options: [238000, 205000, 268000, 298000], correctIndex: 0, resolved: false, selectedIndex: null },
    { id: 'c3-qt-3', levelId: 3, carModel: '奥迪A4L', marketPrice: 215000, options: [188000, 200000, 215000, 245000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c3-qt-4', levelId: 3, carModel: '特斯拉Model 3', marketPrice: 185000, options: [158000, 172000, 185000, 210000], correctIndex: 2, resolved: false, selectedIndex: null },
  ],
  4: [
    { id: 'c4-qt-1', levelId: 4, carModel: '保时捷Macan', marketPrice: 458000, options: [398000, 428000, 458000, 518000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c4-qt-2', levelId: 4, carModel: '路虎揽胜极光', marketPrice: 285000, options: [285000, 248000, 325000, 368000], correctIndex: 0, resolved: false, selectedIndex: null },
    { id: 'c4-qt-3', levelId: 4, carModel: '凯迪拉克CT5', marketPrice: 178000, options: [155000, 168000, 178000, 205000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c4-qt-4', levelId: 4, carModel: '雷克萨斯ES', marketPrice: 265000, options: [235000, 250000, 265000, 298000], correctIndex: 2, resolved: false, selectedIndex: null },
  ],
  5: [
    { id: 'c5-qt-1', levelId: 5, carModel: '玛莎拉蒂Ghibli', marketPrice: 520000, options: [458000, 490000, 520000, 598000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c5-qt-2', levelId: 5, carModel: '保时捷911', marketPrice: 880000, options: [880000, 780000, 980000, 1080000], correctIndex: 0, resolved: false, selectedIndex: null },
    { id: 'c5-qt-3', levelId: 5, carModel: '路虎揽胜', marketPrice: 650000, options: [580000, 620000, 650000, 720000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c5-qt-4', levelId: 5, carModel: '宝马7系', marketPrice: 425000, options: [375000, 398000, 425000, 480000], correctIndex: 2, resolved: false, selectedIndex: null },
    { id: 'c5-qt-5', levelId: 5, carModel: '奔驰S级', marketPrice: 580000, options: [580000, 510000, 650000, 720000], correctIndex: 0, resolved: false, selectedIndex: null },
  ],
}
