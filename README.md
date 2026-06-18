# 二手车门店过户材料调度解谜游戏

用于培训二手车门店新人的过户流程解谜游戏，基于 PlayCanvas + TypeScript + Ammo.js 技术栈开发。

## 功能特性

### 游戏玩法
- **任务分配环节**：每局开始前展示任务简报，包含车辆信息、成交价格等关键信息
- **判断环节**：玩家根据报价历史、金融资料、车辆档案判断下一步动作
- **材料缺失高难挑战**：部分关卡设置材料缺失，考察玩家应对复杂情况的能力
- **结算页面**：显示得分、用时、错误原因、准确率和等级评定（S/A/B/C/D/F）

### 模式选择
- **训练关卡**：按岗位分类的系统化关卡
- **自由练习**：可自由选择任意关卡进行练习

### 岗位支持
- 过户专员
- 金融专员
- 评估师
- 综合岗位

### 回放复盘系统
- 保留最近3次失败/成功的回放记录
- 卡顿定位：自动识别玩家耗时超过阈值的步骤
- 复盘时可查看每一步的操作、耗时和得分情况

## 技术栈

- **3D 引擎**: [PlayCanvas](https://playcanvas.com/)
- **语言**: TypeScript
- **物理引擎**: [Ammo.js](https://github.com/kripken/ammo.js/) (Bullet Physics 的 WebAssembly 版本)
- **构建工具**: Webpack 5
- **测试框架**: Jest

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:8080` 启动游戏。

### 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录下。

### 运行测试

```bash
npm test
```

## 项目结构

```
src/
├── core/                    # 核心单例
│   └── GameCore.ts         # 游戏核心单例
├── managers/               # 管理器
│   ├── GameManager.ts      # 游戏状态管理
│   ├── LevelManager.ts     # 关卡管理
│   └── ReplayManager.ts    # 回放管理
├── models/                 # 数据模型
│   ├── Material.ts         # 材料模型
│   ├── VehicleArchive.ts   # 车辆档案
│   ├── QuoteHistory.ts     # 报价历史
│   ├── FinanceDocuments.ts # 金融资料
│   ├── Task.ts             # 任务和动作
│   ├── Level.ts            # 关卡定义
│   └── GameState.ts        # 游戏状态
├── scene/                  # 3D 场景
│   └── SceneManager.ts     # PlayCanvas 场景管理
├── physics/                # 物理引擎
│   └── PhysicsManager.ts   # Ammo.js 物理集成
├── ui/                     # UI 系统
│   └── UIManager.ts        # UI 渲染
├── data/                   # 数据
│   └── sampleLevels.ts     # 示例关卡数据
├── __tests__/              # 测试
│   ├── GameManager.test.ts
│   └── LevelManager.test.ts
├── main.ts                 # 入口文件
└── index.html              # HTML 模板
```

## 关卡设计规范

每个关卡包含以下要素：

1. **基本信息**：名称、描述、岗位、难度、预计时间
2. **车辆档案**：车辆基本信息、车况、所有权信息
3. **报价历史**：历史报价记录、价格趋势、最终成交价
4. **金融资料**：贷款信息、保险信息、税务信息
5. **任务步骤**：多个判断步骤，每步有多个选项，只有一个正确选项

## 评分规则

- 每道题正确得分：100 分
- 错误扣分：根据选项严重程度 5-25 分不等
- 等级评定：
  - S: 95%+ 且零错误，按时完成
  - A: 85%+
  - B: 70%+
  - C: 55%+
  - D: 40%+
  - F: 40% 以下

## 卡顿检测阈值

- 默认阈值：30 秒/步骤
- 超过阈值的步骤会在结算页标记为卡顿点，供培训复盘使用
