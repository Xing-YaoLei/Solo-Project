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

### 3. 启用 PlayFab（可选，用于云端排行榜/存档）

项目已内置 PlayFab SDK 占位包 `Packages/com.playfab.unitysdk/`（仅含 package.json 和空 asmdef），
确保 `manifest.json` 可正常解析。要接入真正的 PlayFab 服务，需替换为真实 SDK：

**方式 A（推荐）：替换本地占位包为官方 UnityPackage**
1. 删除 `Packages/com.playfab.unitysdk/` 目录
2. 从 https://learn.microsoft.com/en-us/gaming/playfab/sdks/unity/quickstart 下载 `PlayFabAllSDK.unitypackage`
3. 在 Unity 中双击导入，或 `Assets → Import Package → Custom Package...`
4. 在 `manifest.json` 中移除 `"com.playfab.unitysdk": "file:com.playfab.unitysdk"` 行

**方式 B：通过 UPM Git URL 安装**
1. 删除 `Packages/com.playfab.unitysdk/` 目录
2. 在 `manifest.json` 中将 `"com.playfab.unitysdk": "file:com.playfab.unitysdk"` 替换为：
   `"com.playfab.unitysdk": "https://github.com/PlayFab/UnitySDK.git#upm"`
3. 菜单 `Window → Package Manager` 确认安装成功

**启用条件编译宏**

```
Edit → Project Settings → Player → Other Settings → Script Compilation
添加：USE_PLAYFAB
```

**初始化（可选）**

```csharp
var pf = ServiceLocator.Get<IPlayFabService>();
yield return pf.Initialize("YOUR_TITLE_ID");
yield return pf.Login();
```

未启用 PlayFab 时，所有云端接口为 no-op，游戏完全本地运行。

### 4. 关卡数据源

关卡列表通过 `LevelDataProvider.DiscoverLevelAddresses()` 动态获取，优先级：

1. **Addressables**（启用 `USE_ADDRESSABLES` 时）：扫描 `Levels` 标签下所有 LevelConfig 资产
2. **PlayFab 云端**（启用 `USE_PLAYFAB` 时）：通过 `LoadCloudLevelList` 获取远程地址列表
3. **Fallback**：使用 `LevelDataProvider.BuiltInLevelAddresses` 内置列表（Level_001 ~ Level_003）

新增关卡只需：
- 将 LevelConfig 资产放入 Addressables Group 并标记 `Levels` 标签，或
- 在 PlayFab Title Data 的 `LevelAddresses` 中追加地址，或
- 在 `LevelDataProvider.BuiltInLevelAddresses` 中追加地址并在 `SampleLevelFactory` 中添加对应工厂方法

关卡选择页会自动发现并生成可点击卡片。

### 5. 创建示例关卡

点击菜单：

```
UsedCarGame → Levels → Create Sample Level 001
```

会在 `Assets/AddressableAssets/Levels/` 下生成 `Level_001.asset`。  
将其标记为 Addressable（地址建议设为 `Levels/Level_001`）。

### 5. UI 预制体（可选：运行时自动构建）

本项目使用 **RuntimeUIBuilder** 在启动时自动构建完整 UI，无需手动创建预制体。  
打开 `Assets/Scenes/Boot.unity` 并按下 Play 即可直接运行。

如需自定义 UI 样式，可在以下文件中修改布局代码：

- `Assets/Scripts/Systems/UIPanelBuilders.cs` — 主菜单 / 关卡选择 / 设置 / 暂停
- `Assets/Scripts/Systems/GameplayPanelBuilder.cs` — 限时答题界面（四 Tab + 三决策按钮）
- `Assets/Scripts/Systems/SettlementAndReviewBuilders.cs` — 结算页（速度/错误/连击三栏评级）+ 库存周转复盘页

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
3. 将该资产放入 Addressables Group，标记 `Levels` 标签，配置地址（如 `Levels/Level_004`）
4. 启动游戏，关卡选择页自动发现并生成可点击卡片

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
