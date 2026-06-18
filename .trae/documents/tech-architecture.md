## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        UI["React UI层<br/>首页/关卡选择/结算/统计"]
        HUD["HUD覆盖层<br/>任务面板/线索抽屉/决策面板"]
    end
    subgraph "3D引擎层"
        BABYLON["Babylon.js<br/>场景渲染/相机/灯光/后处理"]
        PHYSICS["Cannon-es<br/>刚体物理/碰撞检测/约束"]
        SCENE["场景管理器<br/>展厅/展车/档案柜/办公桌"]
    end
    subgraph "游戏逻辑层"
        TASK["任务系统<br/>任务分发/状态管理"]
        CLUE["线索系统<br/>线索收集/转化追踪"]
        JUDGE["判定系统<br/>决策评估/错因生成"]
        PROGRESS["进度系统<br/>关卡解锁/存档"]
    end
    subgraph "数据层"
        STORE["Zustand Store<br/>全局状态管理"]
        DATA["静态数据<br/>关卡/线索/判定规则"]
        STATS["统计引擎<br/>线索转化率/对比计算"]
    end
    UI --> STORE
    HUD --> STORE
    BABYLON --> PHYSICS
    SCENE --> BABYLON
    TASK --> STORE
    CLUE --> STORE
    JUDGE --> STORE
    PROGRESS --> STORE
    STATS --> STORE
    DATA --> TASK
    DATA --> CLUE
    DATA --> JUDGE
```

## 2. 技术说明
- 前端框架：React 18 + TypeScript + Vite
- 3D引擎：Babylon.js @latest + Cannon-es @latest
- 状态管理：Zustand
- 样式方案：Tailwind CSS 3
- 路由：React Router DOM 6
- 初始化工具：vite-init (react-ts 模板)
- 后端：无（纯前端，数据持久化使用 localStorage）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 首页，双入口导航（正式训练/自由练习）+ 快速继续 |
| /training | 正式训练关卡选择，含进度锁 |
| /practice | 自由练习关卡选择，全部关卡开放 |
| /game/:levelId | 游戏主场景，3D展厅 + HUD |
| /result/:levelId | 结算面板，得分/用时/错因 |
| /stats | 统计页，线索转化/关卡对比/趋势 |

## 4. API定义
无后端API，所有数据为前端静态数据 + localStorage持久化。

核心TypeScript类型定义：

```typescript
interface Level {
  id: string
  name: string
  difficulty: "beginner" | "advanced" | "noshow"
  position: "sales" | "scheduler" | "service"
  task: TaskDefinition
  clues: Clue[]
  decisions: DecisionPoint[]
  timeLimit: number
}

interface TaskDefinition {
  title: string
  description: string
  customerName: string
  requestedCar: string
  requestedTime: string
}

interface Clue {
  id: string
  type: "test_drive_record" | "customer_profile" | "vehicle_archive"
  title: string
  content: string
  relatedObject3D: string
  isCritical: boolean
}

interface DecisionPoint {
  id: string
  question: string
  options: DecisionOption[]
  correctOptionId: string
  knowledgePoint: string
}

interface DecisionOption {
  id: string
  label: string
  description: string
}

interface LevelResult {
  levelId: string
  score: number
  timeUsed: number
  decisions: DecisionRecord[]
  clueConversions: ClueConversion[]
  completedAt: number
}

interface DecisionRecord {
  decisionPointId: string
  selectedOptionId: string
  isCorrect: boolean
  timeToDecide: number
}

interface ClueConversion {
  clueId: string
  wasViewed: boolean
  ledToCorrectDecision: boolean
}
```

## 5. 服务器架构图
无后端服务，纯前端应用。

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Level ||--o{ Clue : contains
    Level ||--o{ DecisionPoint : contains
    DecisionPoint ||--o{ DecisionOption : has
    Level ||--o{ LevelResult : produces
    LevelResult ||--o{ DecisionRecord : includes
    LevelResult ||--o{ ClueConversion : tracks

    Level {
        string id PK
        string name
        string difficulty
        string position
        number timeLimit
    }
    Clue {
        string id PK
        string type
        string title
        string content
        string relatedObject3D
        boolean isCritical
    }
    DecisionPoint {
        string id PK
        string question
        string correctOptionId
        string knowledgePoint
    }
    DecisionOption {
        string id PK
        string label
        string description
    }
    LevelResult {
        string levelId FK
        number score
        number timeUsed
        number completedAt
    }
    DecisionRecord {
        string decisionPointId FK
        string selectedOptionId
        boolean isCorrect
        number timeToDecide
    }
    ClueConversion {
        string clueId FK
        boolean wasViewed
        boolean ledToCorrectDecision
    }
```

### 6.2 数据定义语言
使用 localStorage 存储，键值设计：
- `game_progress`: 关卡解锁状态与进度 (JSON)
- `level_results`: 各关卡最佳成绩记录 (JSON数组)
- `clue_stats`: 线索转化统计数据 (JSON)
- `player_profile`: 玩家工号与基本设置 (JSON)
