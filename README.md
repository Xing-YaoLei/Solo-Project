# 连锁咖啡原料补货经营模拟游戏

一款基于 Cocos Creator 3.x + TypeScript + Tiled 开发的连锁咖啡原料补货经营模拟游戏，用于练习原料补货判断能力。

## 项目特性

### 🎮 核心玩法
- **可拖拽供应商信息**：将供应商卡片拖拽到门店区域即可创建采购订单
- **动态领用记录**：实时显示原料消耗情况，帮助判断补货节奏
- **计时任务**：关卡有时间限制，需要在规定天数内完成经营目标
- **盘点差异结算**：定期盘点库存，处理账实差异后进入结算环节

### ⚙️ 可配置系统（非硬编码）
- **关卡难度**：在 `assets/configs/levels.json` 中配置天数、资金、消耗率等
- **道具冷却**：在 `assets/configs/items.json` 中配置道具冷却时间和效果参数
- **成就规则**：在 `assets/configs/achievements.json` 中配置成就条件和奖励

### 🎲 突发事件系统
- **批次短缺**：作为核心突发事件出现，影响订单交付
- 物流延误、价格波动、需求激增、质量问题、设备故障等多种随机事件
- 事件触发概率和影响参数完全可配置

### 📊 复盘页面
- **周转天数统计**：计算原料平均周转效率
- **完成时间记录**：记录每关完成用时
- **玩家卡点追踪**：自动记录关键决策、失误、成功节点和突发事件

### 👶 新手引导
- 围绕供应商信息展开引导流程
- 新玩家无需额外讲解即可上手操作
- 高亮引导 + 步骤说明 + 动作触发的渐进式教学

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Cocos Creator | 3.8+ | 游戏引擎 |
| TypeScript | 5.0+ | 开发语言 |
| Tiled | 1.8+ | 地图编辑 |

## 项目结构

```
MP0017/
├── assets/
│   ├── configs/                    # 可配置数据表（JSON）
│   │   ├── ingredients.json        # 原料配置
│   │   ├── suppliers.json          # 供应商配置
│   │   ├── stores.json             # 门店配置
│   │   ├── levels.json             # 关卡配置
│   │   ├── items.json              # 道具配置
│   │   ├── achievements.json       # 成就规则
│   │   ├── randomEvents.json       # 随机事件配置
│   │   └── tutorials.json          # 新手引导配置
│   ├── scripts/
│   │   ├── bootstrap.ts            # 全局入口
│   │   ├── core/                   # 核心管理系统
│   │   │   ├── EventManager.ts     # 事件总线
│   │   │   ├── TimeManager.ts      # 游戏时间管理
│   │   │   ├── ConfigManager.ts    # 配置管理
│   │   │   └── GameManager.ts      # 游戏状态管理
│   │   ├── models/                 # 数据模型
│   │   │   ├── Ingredient.ts
│   │   │   ├── Supplier.ts
│   │   │   ├── Order.ts
│   │   │   ├── UsageRecord.ts
│   │   │   ├── Level.ts
│   │   │   ├── Item.ts
│   │   │   ├── Achievement.ts
│   │   │   ├── RandomEvent.ts
│   │   │   ├── Store.ts
│   │   │   ├── GameStats.ts
│   │   │   └── Tutorial.ts
│   │   ├── game/                   # 业务逻辑层
│   │   │   ├── InventoryManager.ts       # 库存管理
│   │   │   ├── OrderManager.ts           # 订单管理
│   │   │   ├── LevelManager.ts           # 关卡管理
│   │   │   ├── AchievementManager.ts     # 成就管理
│   │   │   ├── RandomEventManager.ts     # 随机事件管理
│   │   │   ├── ItemManager.ts            # 道具管理
│   │   │   └── ConsumptionManager.ts     # 消耗模拟
│   │   ├── scenes/                 # 场景脚本
│   │   │   ├── GameMain.ts         # 主场景控制器
│   │   │   ├── SupplierCard.ts     # 供应商卡片（可拖拽）
│   │   │   ├── SupplierPanel.ts    # 供应商面板
│   │   │   ├── InventoryPanel.ts   # 库存面板
│   │   │   ├── UsageRecordPanel.ts # 领用记录面板
│   │   │   ├── GameTimer.ts        # 计时器
│   │   │   ├── OrderDialog.ts      # 下单弹窗
│   │   │   ├── StoreNode.ts        # 门店节点
│   │   │   ├── InventoryCheckDialog.ts  # 盘点弹窗
│   │   │   ├── ResultScreen.ts     # 结算复盘页面
│   │   │   ├── TutorialSystem.ts   # 新手引导系统
│   │   │   ├── EventBanner.ts      # 事件提示条
│   │   │   └── ItemBar.ts          # 道具栏
│   │   ├── ui/                     # UI 组件
│   │   │   ├── TopBar.ts           # 顶部栏
│   │   │   └── MainMenu.ts         # 主菜单
│   │   └── utils/                  # 工具类
│   │       ├── TiledMapController.ts  # Tiled 地图集成
│   │       ├── ToastManager.ts     # Toast 提示
│   │       ├── ScreenShake.ts      # 屏幕震动
│   │       └── Helpers.ts          # 通用工具函数
├── project.json                    # Cocos Creator 项目配置
├── tsconfig.json                   # TypeScript 配置
├── package.json                    # 项目依赖
└── README.md
```

## 快速开始

### 1. 环境准备
- 安装 [Cocos Creator 3.8+](https://www.cocos.com/creator)
- 安装 [Node.js 16+](https://nodejs.org/)

### 2. 打开项目
1. 启动 Cocos Creator Dashboard
2. 点击「导入项目」，选择本项目根目录
3. 等待项目资源加载完成

### 3. 运行项目
1. 在 Cocos Creator 编辑器中打开 `assets/scenes/MainMenu.scene`
2. 点击顶部工具栏的「预览」按钮
3. 或使用快捷键 `Ctrl/Cmd + P`

## 配置指南

### 修改关卡难度
编辑 `assets/configs/levels.json`：

```json
{
  "id": "level_1",
  "name": "新手入门",
  "difficulty": 1,
  "durationDays": 15,              // 关卡持续天数
  "initialCapital": 15000,          // 初始资金
  "randomEventChance": 0.05,        // 每日随机事件概率
  "dailyConsumptionRate": {         // 每日消耗速度
    "arabica_beans": 5
  },
  "consumptionFluctuation": 0.15,   // 消耗波动幅度
  "objectives": [                   // 通关目标
    {
      "id": "obj_no_shortage_1",
      "type": "no_shortage",
      "targetValue": 1,
      "description": "不出现缺货",
      "weight": 40                  // 权重占比
    }
  ]
}
```

### 修改道具冷却时间
编辑 `assets/configs/items.json`：

```json
{
  "id": "item_instant_delivery",
  "name": "加急配送",
  "cooldownSeconds": 120,          // 冷却时间（秒）
  "maxStack": 5,                   // 最大堆叠数
  "effectParams": {
    "deliveryCount": 1
  }
}
```

### 添加新成就
编辑 `assets/configs/achievements.json`：

```json
{
  "id": "ach_custom",
  "name": "自定义成就",
  "rarity": "rare",
  "conditions": [
    {
      "type": "complete_level",
      "params": { "target": 5 }
    }
  ],
  "rewards": {
    "coins": 1000
  }
}
```

### Tiled 地图使用
1. 使用 Tiled 编辑器打开 `assets/tiled/map.tmx`
2. 在 `stores` 图层放置门店标记（使用自定义属性 storeId）
3. 在 `drop_zones` 图层放置可拖拽区域
4. 导出为 `.tmx` 格式，Cocos Creator 会自动识别

## 核心系统说明

### 事件系统
游戏使用发布-订阅模式进行模块间通信，所有事件定义在 `GameEvents` 中：

```typescript
import { EventManager, GameEvents } from './core/EventManager';

// 监听事件
EventManager.getInstance().on(GameEvents.STOCK_CHANGED, (data) => {
    console.log('库存变化:', data);
});

// 触发事件
EventManager.getInstance().emit(GameEvents.ORDER_CREATED, order);
```

### 库存系统
- 支持 FIFO（先进先出）批次管理
- 自动记录每笔领用记录
- 安全库存预警
- 保质期追踪

### 订单流程
```
创建订单 → 供应商确认 → 发货中 → 送达（或部分缺货）
                                              ↓
                                          入库更新
```

## 扩展开发

### 添加新原料类型
1. 在 `ingredients.json` 添加原料配置
2. 在 `IngredientCategory` 枚举中添加分类（如需）
3. 关联到对应供应商的 `suppliers.json` 配置

### 添加新随机事件
1. 在 `RandomEventType` 枚举中添加事件类型
2. 在 `randomEvents.json` 添加事件配置
3. 在 `RandomEventManager` 中处理事件效果逻辑

### 添加新道具类型
1. 在 `ItemType` 枚举中添加道具类型
2. 在 `items.json` 添加道具配置
3. 在 `ItemManager.applyItemEffect` 中实现效果逻辑
4. 监听对应事件在各业务模块中处理

## License

MIT
