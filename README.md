# 法律服务案件委托经营模拟游戏

一款基于 Cocos Creator + TypeScript + Tiled 开发的法律模拟游戏。玩家扮演律师，通过接任务、查看线索、选择处理动作来推进案件，逐步解锁更复杂的客户档案和案件阶段。

## 技术栈

- **游戏引擎**: Cocos Creator 3.x
- **开发语言**: TypeScript
- **地图编辑**: Tiled
- **数据驱动**: JSON 配置表

## 项目结构

```
MP0457/
├── assets/
│   ├── scripts/
│   │   ├── core/               # 核心系统
│   │   │   ├── GameConstants.ts       # 游戏常量定义
│   │   │   ├── GameInterfaces.ts      # 数据接口定义
│   │   │   ├── ConfigManager.ts       # 配置表管理器
│   │   │   ├── GameManager.ts         # 游戏主管理器
│   │   │   ├── SaveManager.ts         # 存档管理器
│   │   │   ├── LeaderboardManager.ts  # 排行榜管理器
│   │   │   ├── MapManager.ts          # Tiled地图管理器
│   │   │   ├── TrainingAnalysis.ts    # 训练复盘分析
│   │   │   └── index.ts               # 模块导出
│   │   ├── ui/                 # UI组件
│   │   │   ├── UIBase.ts              # UI基类
│   │   │   ├── MissionHallUI.ts       # 任务大厅
│   │   │   ├── CluePanelUI.ts         # 线索面板
│   │   │   ├── ActionPanelUI.ts       # 动作选择面板
│   │   │   ├── ClientArchiveUI.ts     # 客户档案
│   │   │   ├── TrainingRecordUI.ts    # 训练记录
│   │   │   ├── LeaderboardUI.ts       # 排行榜
│   │   │   ├── TrialScheduleUI.ts     # 庭审日程
│   │   │   └── TutorialManager.ts     # 教程管理器
│   │   ├── utils/              # 工具类
│   │   │   ├── Utils.ts               # 通用工具函数
│   │   │   └── EventManager.ts        # 事件管理器
│   │   └── GameController.ts   # 游戏主控制器
│   └── resources/
│       └── configs/            # 配置表数据
│           ├── cases.json             # 案件配置
│           ├── levels.json            # 关卡配置
│           ├── clients.json           # 客户档案
│           ├── tutorials.json         # 教程配置
│           ├── assets.json            # 素材配置
│           └── trial_schedules.json   # 庭审日程
```

## 核心玩法

### 案件流程
每个案件包含6个阶段，按顺序推进：
1. **案件受理** - 接受客户委托，了解基本案情
2. **调查取证** - 收集证据材料，调查案件事实
3. **诉辩阶段** - 起草法律文书，提起诉讼/仲裁
4. **庭审阶段** - 参加法庭审理，举证质证辩论
5. **判决阶段** - 等待判决结果，分析判决
6. **案件结案** - 案件终结，归档总结

### 游戏系统

#### 1. 配置表系统
所有游戏数据均通过 JSON 配置表驱动，新增案件和场景无需修改核心逻辑。

- **案件配置** (`cases.json`)：案件剧情、线索、动作、阶段参数
- **关卡配置** (`levels.json`)：关卡解锁条件、包含案件
- **客户档案** (`clients.json`)：客户信息、性格特点、关联案件
- **庭审日程** (`trial_schedules.json`)：庭审日程安排、时间表
- **教程配置** (`tutorials.json`)：新手引导步骤
- **素材配置** (`assets.json`)：资源路径映射

#### 2. 线索系统
- 5种线索类型：证人证言、物证、书证、电子数据、鉴定意见
- 关键线索标记、可信度评估
- 材料缺页机制：部分线索存在缺页，会扣分并记录

#### 3. 动作系统
- 6种动作类型：询问、举证、文书、咨询、异议、和解
- 每个动作有前置线索条件
- 正确动作加分，错误动作扣分并记录错因

#### 4. 训练记录与复盘
- 每次训练完整记录：得分、用时、发现线索、执行动作
- 错误分类统计：程序类、证据类、法律适用类、策略类、职业伦理类
- 材料缺页触发记录
- 单案件复盘分析
- 总体统计与改进建议

#### 5. 解锁系统
- 关卡解锁：达到累计分数要求
- 客户解锁：完成该客户一定比例案件
- 案件解锁：完成前置案件

#### 6. 存档与排行榜
- 本地存档，自动保存
- 训练记录保存最近100条
- 本地排行榜系统

## 添加新案件

只需在 `assets/resources/configs/` 目录下修改对应配置文件，无需修改代码：

1. 在 `cases.json` 中添加新案件数据
2. 在 `clients.json` 中如涉及新客户则添加
3. 在 `levels.json` 中如涉及新关卡则添加
4. 在 `trial_schedules.json` 中添加庭审日程

### 案件配置示例结构

```json
{
  "id": "case_001",
  "title": "案件标题",
  "type": "案件类型",
  "description": "案件描述",
  "difficulty": "easy",
  "stages": [
    {
      "stage": "acceptance",
      "clueIds": ["clue_001"],
      "actionIds": ["action_001", "action_002"]
    }
  ],
  "clues": [...],
  "actions": [...]
}
```

## 核心管理器

### GameManager
游戏主管理器，负责案件流程控制、阶段推进、动作执行。

### ConfigManager
配置表管理器，支持异步加载所有配置数据，提供查询接口。

### SaveManager
存档管理器，负责游戏进度、训练记录的本地存储。

### TrainingAnalysis
训练分析器，提供单案件复盘、总体统计、改进建议。

### LeaderboardManager
排行榜管理器，支持本地排行榜功能。

### MapManager
Tiled 地图管理器，解析地图对象、坐标转换。

## 快速开始

1. 使用 Cocos Creator 3.x 打开项目
2. 场景入口：`MainScene`
3. 主控制器脚本：`GameController.ts`
4. 配置数据位于 `assets/resources/configs/`

## 扩展方向

- [ ] 添加更多案件类型（刑事、行政、知识产权等）
- [ ] 实现多人对战/合作模式
- [ ] 添加语音和音效系统
- [ ] 接入云端排行榜
- [ ] 实现更多 Tiled 地图交互场景
