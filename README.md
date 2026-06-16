# 🏥 康复中心患者分级调度解谜游戏

## 项目简介

本项目是一款基于 **Godot 4 + GDScript** 开发的医疗训练游戏，用于训练医护人员的患者分级能力和医保合规意识。玩家需要在时间压力下，通过分析**护理日志**、**结算明细**和**评估量表**三种文档，对患者进行正确的I-IV级分级。

## ✨ 核心功能

### 🎮 游戏玩法
- **三栏式布局**：左侧患者队列、中间患者详情+分级按钮、右侧文档查看
- **时间压力机制**：每位患者有独立的处理时限，超时视为错误
- **危急患者优先**：危急患者会有特殊标记，需要优先处理
- **医保拒付预警**：患者剩余时间≤15秒时触发视觉警告，提示医保风险

### 📊 训练系统
- **3个训练关卡**：
  - 初识分级（入门级）：3位患者，5分钟，目标正确率70%
  - 压力测试（进阶级）：5位患者，6分钟，目标正确率75%
  - 医保督察（专家级）：6位患者，8分钟，目标正确率80%
- **动态患者到达**：患者按时间间隔陆续到达，增加调度压力
- **分级标准**：I级（急危重症）→ II级（急重症）→ III级（急症）→ IV级（非急症）

### 🔍 复盘系统
- **错误步骤查看**：详细展示每次错误的患者信息、错误原因、忽略的关键指标
- **结算错因分析**：专门拆解训练处方相关的医保拒付原因
- **评估量表回放**：保留最近3次评估量表失败记录，帮助找出卡顿点
- **最近失败回放**：查看最近3次完整的失败过程，一键加载详细复盘

### 📈 统计系统
- **训练完成率**：重点展示指标，根据完成率显示不同颜色（≥80%绿色，≥60%黄色，<60%红色）
- **总体统计**：总训练次数、处理患者数、正确率、医保拒付次数、训练时长
- **各关卡统计**：尝试次数、完成次数、最佳得分、最佳用时、单关完成率
- **最近训练记录**：显示最近10次训练的详细信息
- **统计重置功能**：支持清空所有统计数据

## 🛠️ 技术栈

- **游戏引擎**：Godot 4.2+
- **编程语言**：GDScript
- **架构模式**：MVC（模型-视图-控制器）
- **UI系统**：Godot Canvas UI + Control节点
- **数据持久化**：JSON格式存储到user://目录
- **导出平台**：Web（HTML5/WebAssembly）

## 📁 项目结构

```
MP0220/
├── assets/
│   └── data/
│       └── levels.json          # 关卡和患者数据
├── scenes/
│   ├── MainMenu.tscn            # 主菜单场景
│   ├── LevelSelect.tscn         # 关卡选择场景
│   ├── GameLevel.tscn           # 游戏主场景
│   ├── ReviewScene.tscn         # 复盘场景
│   └── StatisticsScene.tscn     # 统计场景
├── scripts/
│   ├── autoload/
│   │   └── globals.gd           # 全局自动加载节点
│   ├── managers/
│   │   ├── game_manager.gd      # 游戏核心管理器
│   │   ├── replay_manager.gd    # 复盘管理器
│   │   ├── statistics_manager.gd # 统计管理器
│   │   └── scene_manager.gd     # 场景管理器
│   ├── models/
│   │   ├── patient.gd           # 患者数据模型
│   │   └── level_data.gd        # 关卡数据模型
│   └── ui/
│       ├── main_menu.gd         # 主菜单逻辑
│       ├── level_select.gd      # 关卡选择逻辑
│       ├── game_level.gd        # 游戏主界面逻辑
│       ├── review_scene.gd      # 复盘界面逻辑
│       └── statistics_scene.gd  # 统计界面逻辑
├── export_presets.cfg           # 导出配置（Web）
├── project.godot                # Godot项目配置
└── README.md                    # 项目说明文档
```

## 🚀 快速开始

### 1. 安装 Godot 4

**macOS:**
```bash
# 使用 Homebrew 安装
brew install --cask godot

# 或从官网下载
# https://godotengine.org/download
```

**Windows/Linux:**
从 [Godot官网](https://godotengine.org/download) 下载对应版本。

### 2. 导入项目

1. 启动 Godot 4
2. 点击 **Import** 按钮
3. 选择项目目录下的 `project.godot` 文件
4. 点击 **Import & Edit**

### 3. 运行项目

1. 在Godot编辑器中，按 `F5` 键或点击右上角的 **Play** 按钮
2. 游戏将从主菜单开始

### 4. Web 导出

#### 方法一：使用编辑器导出
1. 在Godot编辑器中，点击菜单栏 **Project** → **Export**
2. 选择 **Web** 预设（已配置在 `export_presets.cfg` 中）
3. 点击 **Export Project**
4. 选择输出目录，导出完成后会生成 `index.html` 文件

#### 方法二：使用命令行导出
```bash
# 导出Web版本
godot --headless --export-release "Web" build/web/index.html

# 运行本地Web服务器测试
cd build/web
python3 -m http.server 8080
# 然后在浏览器中访问 http://localhost:8080
```

**注意**：Web导出需要安装Godot的Web导出模板。首次导出时，Godot会提示下载安装。

## 🎯 游戏操作说明

### 主菜单
- **开始训练**：直接进入第一关
- **关卡选择**：选择特定关卡进行训练
- **训练统计**：查看历史训练数据
- **复盘回放**：查看最近的训练复盘

### 游戏界面
1. **左侧患者队列**：点击患者卡片选择要处理的患者
2. **中间患者详情**：查看患者基本信息和主诉症状
3. **右侧文档查看**：
   - 点击「护理日志」查看症状和生命体征
   - 点击「结算明细」查看收费项目和医保风险
   - 点击「评估量表」查看专业评估得分
4. **分级按钮**：根据文档信息选择正确的分级（I-IV级）

### 分级判断要点
- **I级（急危重症）**：意识障碍、呼吸困难、严重创伤等
- **II级（急重症）**：脑卒中、心肌梗死、剧烈疼痛等
- **III级（急症）**：发热、轻度创伤、常规疾病等
- **IV级（非急症）**：慢性病随访、康复训练等

### 医保风险提示
- 注意查看结算明细中的「医保风险提示」
- 训练处方项目需要与诊断相符
- 注意收费编码和项目匹配性

## 💾 数据存储位置

游戏数据存储在以下位置：

- **macOS**: `~/Library/Application Support/Godot/app_userdata/RehabPatientTriage/`
- **Windows**: `%APPDATA%\Godot\app_userdata\RehabPatientTriage\`
- **Linux**: `~/.local/share/godot/app_userdata/RehabPatientTriage/`
- **Web**: 浏览器IndexedDB存储

存储的文件：
- `replays.json` - 复盘记录（最近10次）
- `statistics.json` - 统计数据

## 🎨 核心机制说明

### 压力机制
- 每位患者有独立的处理时限（60-120秒）
- 患者卡片底部的进度条显示剩余时间
- 剩余时间<30秒时进度条变黄，<15秒时变红
- 超时未处理自动记为错误

### 医保预警机制
- 当患者剩余时间≤15秒时，底部弹出医保拒付预警
- 预警包含具体的风险点说明
- 点击关闭按钮可隐藏预警

### 评分机制
- 得分 = 正确率 × 100
- 通关条件：得分≥要求分数 且 正确率≥目标正确率
- 医保拒付会计入错误统计

## 🔧 常见问题

**Q: Godot打不开项目？**
A: 确保使用的是Godot 4.2或更高版本。

**Q: Web导出后运行显示黑屏？**
A: 确保使用Web服务器运行，不能直接打开html文件。推荐使用 `python3 -m http.server`。

**Q: 如何重置所有数据？**
A: 在统计页面点击「重置统计」按钮，或手动删除上述数据存储目录中的文件。

**Q: 可以自定义关卡吗？**
A: 可以，编辑 `assets/data/levels.json` 文件添加或修改关卡数据。

## 📝 开发说明

### 核心类关系
- `Globals` (自动加载) → 持有所有管理器实例
- `GameManager` → 处理游戏逻辑、关卡生命周期
- `ReplayManager` → 处理复盘记录、错因分析
- `StatisticsManager` → 处理统计数据、计算完成率
- `SceneManager` → 处理场景切换、过渡动画

### 信号系统
- `level_started` → 关卡开始
- `patient_arrived` → 新患者到达
- `patient_completed` → 患者处理完成
- `insurance_rejection_warning` → 医保拒付预警
- `level_completed` / `level_failed` → 关卡结束

## 📄 许可证

本项目用于训练和教育目的。

---

**版本**: v1.0.0  
**最后更新**: 2025年
