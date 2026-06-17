# 养老护理入住评估经营模拟游戏

一款以养老护理入住评估为题材的经营模拟游戏，使用 Cocos Creator 3.8 + TypeScript + Tiled 开发。

## 游戏特色

### 🎮 核心玩法
- **用药清单**：判断药物名称、剂量、服用时间是否正确
- **探访记录**：核对访客身份、关系、探访时间
- **活动签到**：管理活动名称、时间、地点

### 📊 评分系统
- **速度分**：剩余时间越多，奖励越高
- **准确率**：正确答案比例影响评级
- **连击分**：连续正确可获得额外加分
- **星级评价**：1-3星根据总分评定

### ⚙️ 办公友好设置
- **声音开关**：静音模式，适合办公环境
- **震动开关**：可关闭触感反馈
- **动画强度**：低/中/高三档可调

### 📈 复盘系统
- **护理达标比较**：各关卡护理评分柱状图
- **五级评价**：S/A/B/C/D 等级评定
- **详细数据**：得分、准确率、最高连击

### 🎓 新手引导
- **围绕用药清单展开**：从最核心的任务入手
- **7步渐进教学**：逐步熟悉游戏机制
- **可随时跳过**：老玩家直接开玩

## 关卡设计

| 关卡 | 名称 | 难度 | 任务类型 | 特色 |
|------|------|------|----------|------|
| 1 | 初来乍到 | ⭐ | 用药清单 | 熟悉基本操作 |
| 2 | 渐入佳境 | ⭐ | 用药+探访 | 增加任务类型 |
| 3 | 有条不紊 | ⭐⭐ | 全部三项 | 综合管理能力 |
| 4 | 高效运营 | ⭐⭐ | 全部三项 | 时间紧任务多 |
| 5 | 护理专家 | ⭐⭐⭐ | 全部三项 | 最高难度挑战 |

## 技术架构

### 核心模块
- `GameManager` - 全局游戏状态、设置、存档管理
- `ScoreManager` - 评分计算（速度、准确率、连击）
- `LevelManager` - 关卡加载、任务生成、进度追踪
- `GameController` - 游戏主循环、任务处理、UI更新
- `SceneManager` - 场景切换管理

### UI 模块
- `MainMenu` - 主菜单界面
- `LevelSelectPanel` - 关卡选择界面
- `SettingsPanel` - 设置面板
- `ReviewPanel` - 复盘页面
- `TutorialManager` - 新手引导系统

### 工具模块
- `AnimationHelper` - 通用动画效果
- `ScorePopup` - 得分弹窗动画
- `AvatarGenerator` - 程序化头像生成
- `TiledMapController` - Tiled 地图控制器

### 数据结构
- `ElderlyData` - 老人、用药、探访、活动数据接口
- `LevelConfig` - 关卡配置与数据生成器

## 项目结构

```
MP0257/
├── assets/
│   ├── scripts/
│   │   ├── data/           # 数据模型
│   │   │   ├── ElderlyData.ts
│   │   │   └── LevelConfig.ts
│   │   ├── utils/          # 工具类
│   │   │   ├── AnimationHelper.ts
│   │   │   ├── ScorePopup.ts
│   │   │   └── AvatarGenerator.ts
│   │   ├── GameManager.ts
│   │   ├── ScoreManager.ts
│   │   ├── LevelManager.ts
│   │   ├── GameController.ts
│   │   ├── SceneManager.ts
│   │   ├── SettingsPanel.ts
│   │   ├── LevelSelectPanel.ts
│   │   ├── MainMenu.ts
│   │   ├── TutorialManager.ts
│   │   ├── ReviewPanel.ts
│   │   ├── TiledMapController.ts
│   │   ├── GameBootstrap.ts
│   │   └── index.ts
│   ├── scenes/              # 场景文件
│   │   └── MainMenu.scene
│   └── tiled/               # Tiled 地图
│       └── nursing_home.tmx
├── settings/                # 项目设置
├── package.json
├── project.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 环境要求
- Cocos Creator 3.8+
- Node.js 14+

### 运行项目
1. 使用 Cocos Creator 打开项目目录
2. 等待资源导入完成
3. 点击播放按钮运行游戏

### 验证代码
```bash
node verify.js
```

## 游戏玩法说明

### 基本操作
1. 点击【开始游戏】进入当前进度关卡
2. 查看任务列表，判断每条记录是否正确
3. 点击**正确**的条目获得分数
4. **不要**点击错误的条目，会扣分并中断连击

### 得分技巧
- ✅ 快速完成所有正确条目，获得速度奖励
- 🔥 保持连续正确，触发连击加分
- 🎯 确保准确率，错误会大幅扣分
- ⏱️ 关注时间进度，时间越充裕分数越高

### 护理达标评级
- **S级 (90+)** - 护理专家，完美表现
- **A级 (80-89)** - 优秀护理员
- **B级 (60-79)** - 合格达标
- **C级 (40-59)** - 待提升
- **D级 (1-39)** - 需要努力

## 开发说明

### 数据持久化
- 设置项：`localStorage` key = `elderly_care_settings`
- 关卡结果：`localStorage` key = `elderly_care_results`
- 教程状态：`localStorage` key = `elderly_care_tutorial`

### 动画系统
所有动画都通过 `GameManager.getAnimationMultiplier()` 控制强度，
支持 0-1 范围的强度调节，对应低/中/高三档。

### 关卡数据生成
每局游戏的任务数据由 `LevelConfig.ts` 中的生成函数随机生成，
确保每次游玩都有不同的体验，同时保证正确/错误比例合理。

## 许可证

MIT License
