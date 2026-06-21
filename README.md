# 本地跑腿即时下单经营模拟游戏

## 项目简介

这是一个基于 Cocos Creator 3.x + TypeScript + Tiled 开发的本地跑腿即时下单经营模拟训练游戏。玩家需要快速处理订单地址、调度骑手、应用补贴规则，在限定时间内完成目标，同时控制赔付成本。

## 核心玩法

### 🎯 训练目标
- 快速准确处理订单地址（取货/送货地址）
- 合理调度骑手，降低拒单率
- 灵活应用补贴规则，平衡成本与效率
- 控制赔付成本，完成关卡目标

### 🎮 游戏流程
1. **接单阶段**: 新订单产生，显示取货/送货地址、优先级、预计时间
2. **地址处理**: 通过触屏点击地图或键盘操作确认地址
3. **骑手调度**: 选择合适骑手，注意拒单预警提示
4. **补贴应用**: 根据订单类型和天气情况应用补贴
5. **配送监控**: 监控骑手轨迹，处理异常情况
6. **结算复盘**: 查看错误步骤、赔付明细，可申诉

### ⌨️ 键盘快捷键
| 按键 | 功能 |
|------|------|
| `↑↓` | 上下选择地址/调整游戏速度 |
| `1-5` | 快速分配给对应骑手 |
| `Q/W/E/R` | 切换对应补贴规则 |
| `回车/空格` | 确认选择 |
| `ESC` | 取消操作 |
| `P` | 暂停/继续 |
| `Ctrl+R` | 重新开始当前关卡 |
| `Tab` | 切换取货/送货地址模式 |
| `字母键` | 地址搜索输入 |
| `Backspace` | 删除搜索字符 |

### 📱 触屏操作
- **点击地图标记**: 快速选择地址
- **滑动地址列表**: 浏览可选地址
- **点击骑手头像**: 分配订单
- **点击补贴按钮**: 应用/取消补贴

## 核心功能

### 1. 订单地址处理系统
- 支持触屏点击地图选择地址
- 支持键盘输入搜索和导航
- 地址错误即时反馈和记录
- 搜索功能快速定位地址

### 2. 骑手轨迹与拒单预警
- 实时骑手轨迹可视化
- 三级拒单风险预警（黄/橙/红）
- 视觉闪烁提示高风险情况
- 拒单原因和影响分析

### 3. 补贴规则系统
- 高峰时段补贴
- 远距离补贴
- 加急单补贴
- 恶劣天气补贴
- 补贴误用检测和记录

### 4. 复盘与失败回放
- 最近10场游戏记录自动保存
- 失败回放保留最近5次
- 时间轴回放，可定位到错误步骤
- 错误步骤高亮显示，附正确做法

### 5. 结算与申诉
- 赔付明细分类展示
- 申诉证据自动收集（时间线、轨迹、补贴记录）
- 申诉成功率评估
- 可申诉项一键申诉

### 6. 统计分析
- 总游戏次数、胜率、平均分
- 赔付成本按类型统计
- 补贴使用效果分析
- 性能改进建议

## 关卡设计

| 关卡 | 名称 | 难度 | 时长 | 目标分 | 最大赔付 | 天气 | 特点 |
|------|------|------|------|--------|----------|------|------|
| 1 | 新手入门 | 简单 | 3分钟 | 500 | ¥100 | 晴天 | 基础操作训练 |
| 2 | 午间高峰 | 中等 | 4分钟 | 1200 | ¥200 | 晴天 | 高频订单压力 |
| 3 | 雨天挑战 | 困难 | 5分钟 | 2000 | ¥400 | 雨天 | 低效率+高拒单率 |

## 项目结构

```
MP0439/
├── assets/
│   ├── scripts/
│   │   ├── types/              # 类型定义
│   │   │   └── GameTypes.ts    # 核心数据结构
│   │   ├── config/             # 配置文件
│   │   │   └── GameConfig.ts   # 关卡、补贴、常量配置
│   │   ├── managers/           # 核心管理器
│   │   │   ├── OrderManager.ts     # 订单管理（对象池）
│   │   │   ├── RiderManager.ts     # 骑手管理
│   │   │   ├── SubsidyManager.ts   # 补贴管理
│   │   │   └── StorageManager.ts   # 本地存储
│   │   ├── controllers/        # 控制器
│   │   │   ├── GameController.ts      # 游戏主循环
│   │   │   ├── MainSceneController.ts # 场景管理
│   │   │   ├── MapController.ts       # Tiled地图控制
│   │   │   ├── AddressInputController.ts # 地址输入
│   │   │   ├── RiderWarningSystem.ts  # 拒单预警
│   │   │   ├── TrajectoryRenderer.ts  # 轨迹渲染
│   │   │   ├── ReplaySystem.ts        # 复盘回放
│   │   │   ├── SettlementPanel.ts     # 结算面板
│   │   │   └── StatisticsPanel.ts     # 统计面板
│   │   └── utils/              # 工具类
│   │       ├── EventDispatcher.ts    # 事件分发
│   │       ├── PerformanceOptimizer.ts # 性能优化
│   │       └── uuid.ts               # UUID生成
│   ├── scenes/               # 场景文件
│   │   └── Main.scene
│   └── tiled/                # Tiled地图
│       └── city_map.tmx
├── settings/                 # 项目设置
├── tsconfig.json            # TypeScript配置
├── package.json             # 项目配置
└── README.md                # 本文件
```

## 技术特点

### 🚀 性能优化
- **对象池模式**: 订单和骑手对象复用，避免频繁GC
- **快速重开**: 异步重置机制，关卡切换 < 100ms
- **状态快照**: 每2秒保存一次状态，支持复盘
- **轨迹裁剪**: 轨迹点超过100个自动裁剪

### 🎯 架构设计
- **事件驱动**: 核心模块通过 EventDispatcher 解耦
- **MVC模式**: 数据层、逻辑层、视图层分离
- **依赖注入**: 组件通过属性注入，灵活配置
- **状态管理**: 统一的 GameState 状态管理

### 🔧 数据持久化
- 游戏记录自动保存到 localStorage
- 统计数据累计更新
- 最多保留10场回放记录
- 最近5次失败优先展示

## 快速开始

### 环境要求
- Cocos Creator 3.8+
- Node.js 16+
- Tiled 地图编辑器（可选，用于编辑地图）

### 安装步骤
1. 使用 Cocos Creator 打开项目目录
2. 等待资源导入完成
3. 打开 `assets/scenes/Main.scene`
4. 点击运行按钮开始游戏

### 代码检查
```bash
# 安装依赖
npm install

# TypeScript 语法检查
npx tsc --noEmit --skipLibCheck --project tsconfig.json
```

## 训练技巧

### 新手必看
1. **先看预警再派单**: 骑手头上的警告标识代表拒单风险
2. **VIP订单优先**: 加急和VIP订单超时赔付更高
3. **雨天多用补贴**: 恶劣天气下补贴能显著降低拒单率
4. **地址搜索提速**: 输入地点名称拼音首字母可快速筛选

### 进阶技巧
1. **预判订单流向**: 观察订单集中区域，提前调度骑手
2. **补贴组合使用**: 远距离+高峰时段可叠加补贴
3. **控制赔付节奏**: 赔付接近上限时保守操作
4. **分析错误类型**: 统计页会告诉你最常犯的错误

## 扩展开发

### 添加新关卡
编辑 [GameConfig.ts](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0439/assets/scripts/config/GameConfig.ts) 中的 `LEVELS` 数组：

```typescript
{
    id: 4,
    name: '雪夜急送',
    description: '雪夜高峰挑战',
    duration: 360,
    targetScore: 3000,
    maxOrders: 15,
    maxCompensation: 600,
    orderFrequency: 3,
    riderCount: 5,
    initialSubsidies: ['weather_bonus', 'peak_hour', 'urgent_bonus'],
    weather: 'snowy',
    difficulty: 'hard',
}
```

### 添加新补贴规则
编辑 `SUBSIDY_RULES` 数组：

```typescript
{
    id: 'night_bonus',
    name: '夜间补贴',
    description: '22:00-06:00订单补贴',
    condition: { timeRange: [1320, 360] },
    subsidyType: 'per_order',
    value: 6,
    active: true,
}
```

### 编辑地图
1. 使用 Tiled 编辑器打开 `assets/tiled/city_map.tmx`
2. 修改后保存，Cocos Creator 会自动导入
3. 更新 [GameConfig.ts](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0439/assets/scripts/config/GameConfig.ts) 中的 `MAP_LOCATIONS` 坐标

## 常见问题

**Q: 重开关卡很慢怎么办？**
A: 确保使用的是 `GameController.restartLevel()` 方法，它采用对象池复用和异步重置，速度最快。

**Q: 骑手总是拒单怎么办？**
A: 注意观察骑手头上的预警标识，一级预警可正常派单，二级需要考虑补贴，三级建议换骑手。

**Q: 如何提高申诉成功率？**
A: 骑手拒单类申诉成功率最高，尤其是预警级别≥2时；补贴误用类申诉成功率约70%。

**Q: 触屏操作不灵敏？**
A: 地图标记点击判定范围是60像素，确保点击在标记附近。

## License

MIT License
