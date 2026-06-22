# 合规审计证据归档训练系统

基于 Godot 4 的合规审计证据归档调度解谜游戏，用于风控专员岗位训练场景。

## 功能模块

### 核心玩法

| 模块 | 说明 |
|------|------|
| 证据附件识别 | 从给定文件中识别属于合规审计必须归档的证据附件（多选） |
| 通报模板选择 | 根据违规类型和等级匹配合适的通报模板（单选） |
| 检查清单排序 | 按正确顺序排列归档/整改工作流程步骤 |
| 抽样记录处理 | 对审计抽样发现的异常记录进行分级处理，或为审计场景选择抽样方法 |

### 系统功能

- **权限越权检测**：基于角色的权限控制，越权操作时给出详细原因说明
- **成绩记录系统**：正式训练和自由练习分开记录，成绩持久化存储
- **问题复发分析**：统计高频错误类型，支持针对性复盘
- **配置管理**：
  - 关卡管理（启用/禁用、难度、题数、时限、包含玩法）
  - 题目素材维护
  - 徽章奖励设置
  - 开放时间与训练模式配置
  - 角色权限说明与测试切换

### 训练模式（入口分离）

- **📋 正式训练**：有时间限制，成绩计入正式训练记录
- **🎯 自由练习**：无时间限制，可使用提示，不计入正式成绩

## 技术栈

- **引擎**：Godot 4.2+
- **语言**：GDScript
- **渲染**：GL Compatibility（兼容 Web 导出）
- **目标平台**：Web（HTML5/Canvas/WebAssembly）

## 项目结构

```
MP0478/
├── project.godot              # Godot 项目主配置
├── export_presets.cfg         # Web 导出预设
├── scenes/
│   ├── MainMenu.tscn          # 主菜单（模式入口分离）
│   ├── FormalTrainingSelect.tscn   # 正式训练关卡选择
│   ├── FreePracticeSelect.tscn     # 自由练习关卡选择
│   ├── ResultReview.tscn      # 训练记录与复盘分析
│   ├── ConfigManagement.tscn  # 配置管理中心
│   └── games/
│       ├── EvidenceIdentification.tscn  # 证据附件识别
│       ├── TemplateSelection.tscn       # 通报模板选择
│       ├── ChecklistSorting.tscn        # 检查清单排序
│       └── SamplingProcessing.tscn      # 抽样记录处理
└── scripts/
    ├── autoload/              # 全局单例
    │   ├── GameManager.gd     # 游戏流程调度
    │   ├── DataManager.gd     # 题库/素材/配置数据管理
    │   ├── PermissionManager.gd   # 权限控制
    │   └── TrainingRecordManager.gd # 训练记录与复盘
    ├── ui/                    # UI 场景脚本
    │   ├── BaseUI.gd          # UI 基类与通用组件
    │   ├── MainMenu.gd
    │   ├── LevelSelect.gd
    │   ├── ResultReview.gd
    │   └── ConfigManagement.gd
    └── games/                 # 玩法模块脚本
        ├── BaseGame.gd        # 游戏基类
        ├── EvidenceIdentification.gd
        ├── TemplateSelection.gd
        ├── ChecklistSorting.gd
        └── SamplingProcessing.gd
```

## 运行方式

1. 使用 Godot 4.2+ 打开本项目目录
2. 点击运行（F5）启动主菜单
3. 选择正式训练或自由练习入口开始游戏

## Web 导出

项目已预置 Web 导出配置，执行：

```bash
godot --headless --export-release "Web" build/web/index.html
```

导出产物可部署至任意静态 Web 服务器。

## 数据存储

所有游戏数据和训练记录保存在 Godot `user://` 目录（各平台标准用户数据目录），Web 版本保存在浏览器 IndexedDB 中。
