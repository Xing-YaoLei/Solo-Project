# 家装工地量房报价经营模拟游戏

一个基于 Cocos Creator + TypeScript + Tiled 的家装工地量房报价训练游戏。通过接任务、看线索、做选择的核心循环，帮助用户反复练习量房报价技能。

## 核心功能

### 🎮 游戏玩法
- **接任务**：选择不同难度的家装任务
- **看线索**：收集房间面积、材料价格、工艺要求等线索
- **做选择**：填写单据、通过审批节点
- **解锁进阶**：完成任务后解锁更复杂的单据明细和审批节点

### 📊 训练记录
- 每次训练保留得分记录
- 错因分析（选择错误、数量错误、价格错误等）
- 金额不一致触发记录
- 围绕回款周期复盘分析

### 🎯 关卡系统
- 数据驱动配置，关卡内容不写死
- 难度递进：一居室 → 两居室 → 三居室
- 星星评价系统
- 关卡解锁机制

### 🎹 操作方式
- **触屏操作**：点击、滑动手势
- **键盘操作**：方向键、回车、数字快捷键 1-4
- **快捷键**：R 重新开始、P 暂停、ESC 取消

### 🔄 快速重开
- 失败后一键再来一局
- 复盘分析帮助提升
- 排行榜激励进步

### 📚 可配置内容
- 关卡配置（JSON）
- 教程配置（JSON）
- 排行榜数据
- 素材资源

## 项目结构

```
MP0319/
├── assets/
│   ├── scripts/
│   │   ├── core/           # 核心类型和控制器
│   │   ├── managers/       # 游戏管理器
│   │   ├── ui/             # UI 组件
│   │   └── utils/          # 工具类
│   ├── scenes/             # 场景文件
│   └── resources/
│       ├── config/         # 配置数据（关卡、教程）
│       ├── tiled/          # Tiled 地图文件
│       └── textures/       # 纹理素材
├── settings/               # Cocos Creator 项目设置
├── index.html              # HTML 演示版本
├── package.json
├── tsconfig.json
└── README.md
```

## 核心管理器

| 管理器 | 功能 |
|--------|------|
| `GameManager` | 游戏主循环、阶段切换、核心逻辑 |
| `LevelManager` | 关卡进度、解锁、星级计算 |
| `DataManager` | 配置数据加载、关卡数据管理 |
| `ScoreManager` | 得分记录、错因分析、历史数据 |
| `LeaderboardManager` | 排行榜管理 |
| `TutorialManager` | 教程引导系统 |
| `InputManager` | 触屏/键盘双输入支持 |
| `AudioManager` | 音效管理 |
| `StorageManager` | 本地存储 |
| `EventManager` | 事件系统 |

## 快速开始

### 方式一：HTML 演示版
直接在浏览器中打开 `index.html` 即可体验游戏。

### 方式二：Cocos Creator 编辑器
1. 使用 Cocos Creator 3.8+ 打开本项目
2. 打开 `assets/scenes/Main.scene` 场景
3. 点击运行按钮开始游戏

## 关卡配置说明

关卡数据存储在 `assets/resources/config/levels/` 目录下，使用 JSON 格式。

### 关卡结构
```json
{
  "id": "level_001",
  "name": "关卡名称",
  "difficulty": 1,
  "starThresholds": [600, 800, 950],
  "task": { ... },
  "clues": [ ... ],
  "document": { ... },
  "approvalNodes": [ ... ]
}
```

### 核心元素
- **Task**：任务信息（客户、房型、面积、报酬、时间限制）
- **Clue**：线索（房间信息、价格信息、风险提示等）
- **Document**：报价单（多个单据明细项）
- **ApprovalNode**：审批节点（选择题形式）

## 技术栈

- **游戏引擎**：Cocos Creator 3.8+
- **开发语言**：TypeScript
- **地图编辑器**：Tiled
- **数据格式**：JSON

## 扩展开发

### 添加新关卡
1. 在 `assets/resources/config/levels/` 中创建新的 JSON 文件
2. 在 `index.json` 中注册新关卡
3. 可选择性添加 Tiled 地图到 `assets/resources/tiled/`

### 添加新教程
1. 在 `assets/resources/config/tutorials/` 中创建教程 JSON
2. 在 `index.json` 中注册

### 自定义素材
将图片、音频等资源放入对应目录，在配置文件中引用即可。

## 游戏机制

### 计分规则
- 基础分：1000 分
- 时间奖励：剩余秒数 × 2 分
- 金额不一致：每处 -50 分
- 错误选择：每次 -30 分（具体数值以选项为准）

### 星级评价
- ⭐：达到最低分数阈值
- ⭐⭐：达到中等分数阈值
- ⭐⭐⭐：达到最高分数阈值

## 许可证

MIT License
