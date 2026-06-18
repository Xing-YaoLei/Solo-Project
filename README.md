# 二手车门店车辆收购经营模拟游戏

一款面向二手车收购专员的培训练习游戏，使用 **Unity WebGL + C# + Addressables + PlayFab** 构建。适合工作间隙安静练习。

---

## 功能特性

- 🎯 **限时关卡**：每局限时，要求玩家处理报价历史、金融资料、车辆档案和检测报告
- 📊 **结算三要素**：速度、错误次数、连续正确数分别独立显示评级（S/A/B/C/D）
- 🔕 **办公模式友好**：可在设置中关闭音效和震动，静音练习
- 🔁 **失败立即重试**：结算页提供「再试一次」按钮，无需返回菜单
- 📈 **复盘对比**：复盘页按库存周转、正确率、答题速度等维度对比不同关卡
- 🧩 **可扩展关卡**：关卡与题目数据不写死，通过 `LevelConfig` ScriptableObject + Addressables 动态加载，后续可随时追加题目和场景

---

## 项目架构

```
Assets/
├── Scripts/
│   ├── Core/              # 核心系统
│   │   ├── GameManager.cs         # 游戏状态机
│   │   ├── GameBootstrap.cs       # 启动入口 (RuntimeInitialize)
│   │   ├── GameSession.cs         # 单局会话与计分
│   │   ├── GameSessionRunner.cs   # 会话计时器
│   │   ├── ServiceLocator.cs      # 服务定位器
│   │   ├── SettingsManager.cs     # 设置持久化
│   │   ├── AudioService.cs        # 音效服务
│   │   └── VibrationService.cs    # 震动服务
│   ├── Data/              # 数据模型
│   │   ├── LevelConfig.cs         # 关卡配置 (ScriptableObject)
│   │   ├── QuestionData.cs        # 题目数据
│   │   ├── SessionResult.cs       # 结算数据
│   │   ├── LevelDataProvider.cs   # Addressables 加载器
│   │   └── SampleLevelFactory.cs  # 示例关卡工厂
│   ├── Services/          # 外部服务
│   │   ├── IPlayFabService.cs     # PlayFab 接口
│   │   └── PlayFabService.cs      # PlayFab 实现
│   ├── UI/                # 界面层
│   │   ├── UIManager.cs           # 界面管理
│   │   ├── UIPanelBase.cs         # 界面基类
│   │   ├── MainMenuPanel.cs       # 主菜单
│   │   ├── LevelSelectPanel.cs    # 关卡选择
│   │   ├── GameplayPanel.cs       # 玩法界面（含报价/金融/档案/检测四个标签）
│   │   ├── SettlementPanel.cs     # 结算页（速度/错误/连击 三栏独立）
│   │   ├── ReviewPanel.cs         # 复盘页（库存周转对比）
│   │   ├── SettingsPanel.cs       # 设置页（音效/震动开关）
│   │   └── PausePanel.cs          # 暂停页
│   └── Editor/            # 编辑器工具
│       ├── LevelConfigCreator.cs  # 关卡创建菜单
│       └── WebGLBuildSetup.cs     # WebGL 构建工具
└── AddressableAssets/     # Addressables 资源目录（运行时创建）
```

---

## 快速开始

### 1. Unity 环境

- Unity Version：**2022.3 LTS 或更高**
- 平台：**WebGL**

### 2. 安装依赖（通过 Unity Package Manager）

```
com.unity.addressables     (1.21+)
com.unity.textmeshpro      (3.0+)
com.playfab.playfabcampsdk (可选：用于 PlayFab 集成)
```

### 3. 启用 PlayFab（可选）

安装 PlayFab SDK 后，点击菜单：

```
UsedCarGame → Build → Add USE_PLAYFAB Scripting Define
```

然后在启动场景或代码中调用：

```csharp
var pf = ServiceLocator.Get<IPlayFabService>();
yield return pf.Initialize("YOUR_TITLE_ID");
yield return pf.Login();
```

### 4. 创建示例关卡

点击菜单：

```
UsedCarGame → Levels → Create Sample Level 001
```

会在 `Assets/AddressableAssets/Levels/` 下生成 `Level_001.asset`。  
将其标记为 Addressable（地址建议设为 `Levels/Level_001`）。

### 5. 构建 UI 预制体

每个 `UIPanelBase` 子类需要对应的 GameObject，字段命名与脚本 SerializeField 一致。  
推荐在 `Assets/Prefabs/UI/` 下创建：

- MainMenuPanel.prefab
- LevelSelectPanel.prefab
- GameplayPanel.prefab（含四个 Tab：报价历史、金融资料、车辆档案、检测报告）
- SettlementPanel.prefab（三栏：Speed / Errors / Consecutive）
- ReviewPanel.prefab
- SettingsPanel.prefab
- PausePanel.prefab

将这些 Prefab 拖入 `UIManager` 对应字段。

### 6. 构建 WebGL

```
UsedCarGame → Build → Setup WebGL Player Settings
File → Build Settings → WebGL → Build
```

---

## 扩展新关卡 / 新题目

**无需修改代码**，遵循以下步骤：

1. `Assets/Create → UsedCarGame → Level Config` 新建关卡资产
2. 填写关卡基础信息、时间设置、题目池
3. 将该资产放入 Addressables Group，配置地址（如 `Levels/Level_003`）
4. 启动游戏，关卡选择页自动加载

> 或使用菜单 `UsedCarGame → Levels → Create Empty Level Config` 快速创建。

也可通过 JSON 导入导出：选中 LevelConfig → `UsedCarGame → Levels → Export Level To JSON`。

---

## 结算页三栏说明

| 维度 | 指标 | 显示 |
|-----|------|-----|
| ⚡ 速度 | 总耗时 / 平均每题耗时 / 剩余时间奖励 / 速度评级 (S/A/B/C/D) | Speed 栏 |
| ❌ 错误 | 正确数 / 错误数 / 正确率 / 准确率评级 | Errors 栏 |
| 🔥 连击 | 最高连续正确数 / 连击奖励分数 / 稳定性评级 | Consecutive 栏 |

最终得分 = 正确基础分 + 剩余时间奖励 + 连击奖励 - 错误惩罚

---

## 设计原则

- **办公友好**：默认关闭震动，音效可一键静音，不打扰他人
- **低内存占用**：关卡通过 Addressables 按需加载，切换即卸载
- **随时可中断**：暂停键、主菜单键、重试键始终可用
- **数据解耦**：所有题目/关卡数据通过 ScriptableObject 配置，逻辑零耦合

---

## License

内部培训用途。
