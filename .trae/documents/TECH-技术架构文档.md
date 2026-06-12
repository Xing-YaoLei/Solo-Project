## 1. 架构设计

```mermaid
flowchart LR
    subgraph "前端层"
        A["React 18 应用层"] --> B["UI 组件层<br>(TailwindCSS 3)"]
        A --> C["3D 渲染层<br>(React Three Fiber)"]
        C --> D["物理引擎<br>(Rapier)"]
        A --> E["状态管理层<br>(Zustand)"]
        A --> F["路由层<br>(React Router)"]
    end
    
    subgraph "数据层"
        G["本地存储<br>(LocalStorage)"]
        H["配置文件<br>(JSON)"]
        I["Mock 数据<br>(TypeScript)"]
    end
    
    subgraph "配置管理层"
        J["关卡配置<br>/config/levels"]
        K["素材配置<br>/config/assets"]
        L["教程配置<br>/config/tutorials"]
        M["存档数据<br>/saves"]
        N["排行榜<br>/leaderboard"]
    end
    
    E --> G
    E --> H
    E --> I
    J --> H
    K --> H
    L --> H
    M --> G
    N --> G
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **3D 引擎**：Three.js + @react-three/fiber + @react-three/drei
- **物理引擎**：@react-three/rapier
- **后处理**：@react-three/postprocessing
- **构建工具**：Vite 5
- **样式方案**：TailwindCSS 3
- **状态管理**：Zustand 4
- **路由管理**：React Router DOM 6
- **动画库**：Framer Motion
- **图表库**：Recharts
- **图标库**：Lucide React

## 3. 路由定义

| 路由 | 页面 | 功能说明 |
|------|------|----------|
| `/` | 主菜单 | 游戏入口、开始/继续游戏、教程、关卡选择、排行榜 |
| `/game` | 游戏主场景 | 3D 咖啡店场景、任务系统、线索分析、决策交互 |
| `/members/:id` | 会员档案 | 会员信息、消费记录、核销记录、退款原因、失败回放 |
| `/review` | 复盘中心 | 得分统计、错因分析、权益过期记录、续费率分析 |
| `/leaderboard` | 排行榜 | 本地排名、得分展示、历史记录 |
| `/tutorial` | 教程 | 游戏玩法指引、操作说明 |
| `/level-select` | 关卡选择 | 已解锁关卡展示、难度选择 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PLAYER ||--o{ SAVE : has
    PLAYER ||--o{ GAME_RECORD : generates
    LEVEL ||--o{ TASK : contains
    TASK ||--o{ CLUE : has
    TASK ||--o{ DECISION : has
    MEMBER ||--o{ TRANSACTION : has
    MEMBER ||--o{ REFUND : has
    MEMBER ||--o{ BENEFIT : has
    GAME_RECORD ||--o{ DECISION_LOG : contains
    GAME_RECORD ||--o{ FAILURE_REPLAY : has
    SAVE ||--o{ UNLOCKED_LEVEL : unlocks
    
    PLAYER {
        string id
        string name
        int total_score
        int current_level
        datetime created_at
    }
    
    SAVE {
        string id
        string player_id
        json game_state
        datetime saved_at
    }
    
    LEVEL {
        string id
        string name
        int difficulty
        int min_score
        string description
        json task_ids
    }
    
    TASK {
        string id
        string level_id
        string title
        string description
        int time_limit
        int points
        string member_id
        json clue_ids
        json decision_ids
        string correct_decision_id
        string error_category
    }
    
    CLUE {
        string id
        string task_id
        string title
        string content
        string type
        int importance
    }
    
    DECISION {
        string id
        string task_id
        string text
        string consequence
        boolean is_correct
    }
    
    MEMBER {
        string id
        string name
        string avatar
        int level
        decimal balance
        int total_spent
        int visit_count
        date last_visit
    }
    
    TRANSACTION {
        string id
        string member_id
        string type
        decimal amount
        datetime created_at
        string status
    }
    
    REFUND {
        string id
        string member_id
        string transaction_id
        decimal amount
        string reason
        datetime created_at
        string status
    }
    
    BENEFIT {
        string id
        string member_id
        string type
        string description
        date expire_date
        boolean is_expired
        boolean is_used
    }
    
    GAME_RECORD {
        string id
        string player_id
        string level_id
        int score
        int correct_count
        int wrong_count
        decimal avg_decision_time
        datetime played_at
        json error_categories
    }
    
    DECISION_LOG {
        string id
        string record_id
        string task_id
        string decision_id
        boolean is_correct
        int hesitation_time
        datetime made_at
        string error_reason
    }
    
    FAILURE_REPLAY {
        string id
        string record_id
        int replay_index
        json timeline
        json hesitation_points
        datetime created_at
    }
    
    UNLOCKED_LEVEL {
        string save_id
        string level_id
        boolean is_unlocked
        int best_score
        int stars
    }
```

### 4.2 配置文件结构

```
src/config/
├── levels/
│   ├── level-1.json
│   ├── level-2.json
│   └── level-3.json
├── assets/
│   ├── models.json
│   ├── textures.json
│   └── materials.json
├── tutorials/
│   ├── tutorial-1.json
│   └── tutorial-2.json
└── members/
    ├── member-a.json
    └── member-b.json
```

## 5. 目录结构

```
MP0018/
├── src/
│   ├── components/
│   │   ├── ui/              # 基础 UI 组件
│   │   ├── game/            # 游戏相关组件
│   │   ├── three/           # 3D 场景组件
│   │   ├── member/          # 会员档案组件
│   │   └── review/          # 复盘组件
│   ├── scenes/
│   │   ├── CoffeeShop.tsx   # 咖啡店 3D 场景
│   │   └── objects/         # 3D 对象组件
│   ├── store/
│   │   ├── useGameStore.ts  # 游戏状态
│   │   ├── usePlayerStore.ts # 玩家状态
│   │   └── useUIVStore.ts   # UI 状态
│   ├── hooks/
│   │   ├── useGameLoop.ts
│   │   ├── usePhysics.ts
│   │   └── useReplay.ts
│   ├── config/
│   │   ├── levels/
│   │   ├── assets/
│   │   ├── tutorials/
│   │   └── members/
│   ├── types/
│   │   ├── game.ts
│   │   ├── member.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   ├── scoring.ts
│   │   └── replay.ts
│   ├── pages/
│   │   ├── MainMenu.tsx
│   │   ├── GameScene.tsx
│   │   ├── MemberProfile.tsx
│   │   ├── ReviewCenter.tsx
│   │   └── Leaderboard.tsx
│   ├── data/
│   │   ├── mockMembers.ts
│   │   ├── mockTasks.ts
│   │   └── mockLeaderboard.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── models/
│   ├── textures/
│   └── icons/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 6. 核心系统设计

### 6.1 游戏状态管理（Zustand）

- `useGameStore`：当前关卡、任务列表、当前任务、得分、时间、决策历史
- `usePlayerStore`：玩家信息、存档、已解锁关卡、总得分
- `useUIStore`：面板开关、当前视图、动画状态

### 6.2 犹豫点记录机制

在 `useGameLoop` hook 中实现：
- 记录玩家查看每个线索的开始/结束时间
- 记录决策面板打开到最终选择的时间
- 超过阈值（如 5 秒）标记为犹豫点
- 存储在 `DECISION_LOG.hesitation_time` 字段

### 6.3 失败回放系统

- 每次失败记录完整决策时间线
- 最多保留最近 3 次失败记录
- 回放时按时间轴重现，犹豫点高亮显示
- 支持倍速播放、暂停、进度跳转

### 6.4 物理交互设计

- 线索卡片：Rapier 刚体，可拖拽、碰撞
- 咖啡杯：物理对象，正确决策拉花动画，错误决策溢出效果
- 档案柜抽屉：物理约束，可滑动打开

### 6.5 性能优化

- 3D 对象按需加载，使用 Suspense
- 物理对象池化复用
- 状态分片，避免不必要重渲染
- 使用 React.memo 和 useMemo 优化
