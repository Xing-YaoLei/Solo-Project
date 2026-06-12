# 连锁咖啡报损复核调度游戏

## 项目概述

本项目是一个基于Godot 4引擎开发的连锁咖啡门店报损复核训练游戏，用于培训营运经理进行报损复核判断。

## 技术栈

- **引擎**: Godot 4.2+
- **语言**: GDScript
- **导出平台**: Web (HTML5)
- **分辨率**: 1280x720

## 目录结构

```
MP0020/
├── project.godot              # Godot项目配置文件
├── export_presets.cfg         # 导出配置（Web）
├── icon.svg                   # 项目图标
├── PROJECT_STRUCTURE.md       # 本文档
│
├── scenes/                    # 场景文件
│   ├── Main.tscn             # 主菜单
│   ├── LevelSelect.tscn      # 关卡选择
│   ├── Gameplay.tscn         # 游戏主界面
│   ├── Result.tscn           # 结果页面
│   ├── Config.tscn           # 配置页面
│   └── Records.tscn          # 训练记录与复盘
│
├── scripts/                   # 脚本文件
│   ├── globals/              # 全局自动加载脚本
│   │   ├── game_manager.gd    # 游戏状态管理
│   │   ├── data_manager.gd    # 数据管理
│   │   └── audio_manager.gd   # 音频管理
│   │
│   ├── ui/                   # UI界面脚本
│   │   ├── main_menu.gd       # 主菜单逻辑
│   │   ├── level_select.gd    # 关卡选择逻辑
│   │   ├── result_screen.gd   # 结果页面逻辑
│   │   ├── config_screen.gd   # 配置页面逻辑
│   │   └── records_screen.gd  # 记录复盘逻辑
│   │
│   └── gameplay/             # 游戏玩法脚本
│       └── gameplay_controller.gd  # 核心玩法控制器
│
├── themes/                    # 主题资源
│   └── theme.tres            # UI主题（咖啡色系）
│
├── assets/                    # 资源目录
│   ├── images/               # 图片资源
│   └── sounds/               # 音效资源
│       ├── correct.wav
│       ├── wrong.wav
│       ├── click.wav
│       └── complete.wav
│
├── data/                      # 数据目录（运行时生成）
└── build/                     # 构建输出目录
    └── web/                  # Web导出目录
```

## 核心功能模块

### 1. 游戏模式

- **训练模式**: 按关卡顺序进行训练，完成关卡后解锁下一关
- **自由练习模式**: 可自由选择任意已解锁关卡进行练习

### 2. 四种玩法类型

#### 📝 复核意见识别
- 分析门店报损原因，选择正确的复核意见
- 包含：正常损耗、管理责任、物流责任、操作责任等判断

#### 🏪 责任门店选择
- 根据损耗数据，选择责任门店
- 展示门店信息：经理、目标损耗率等

#### 💰 成本金额排序
- 将报损项目按金额从高到低（或从低到高）排序
- 拖拽式交互，点击选择顺序

#### 📋 审批记录处理
- 按正确流程处理审批步骤
- 模拟真实审批流程顺序

### 3. 训练记录与复盘

- 历史训练记录查询
- 关卡统计分析（平均得分、正确率）
- 门店损耗率可视化图表
- 获得奖励徽章展示

### 4. 系统配置

- **关卡配置**: 新增、编辑、删除关卡
- **题库配置**: 按题型管理题目
- **门店配置**: 维护门店信息
- **系统设置**: 训练模式、开放时间、音效设置

### 5. 数据持久化

- 训练记录自动保存
- 关卡解锁进度保存
- 系统配置持久化
- 本地存储（user://目录）

## 游戏流程

```
主菜单 → 选择模式 → 关卡选择 → 开始训练
    ↑                        ↓
    └──── 结果页面 ←──── 答题界面
              ↓
          查看记录/复盘
```

## 核心算法

### 排序题判断
```gdscript
func check_sorting(user_order: Array, correct_order: Array) -> bool:
    return user_order == correct_order
```

### 正确率计算
```gdscript
accuracy = (correct_count / total_count) * 100.0
```

### 关卡解锁逻辑
- 训练模式：完成上一关卡且达到通过分数
- 自由练习模式：所有关卡均可选择

## Web导出说明

1. 打开Godot编辑器
2. 项目 → 导出
3. 选择"Web"预设
4. 点击"导出项目"
5. 输出目录：`build/web/`
6. 部署到Web服务器即可访问

## 运行要求

- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+
- **WebAssembly支持**: 必须启用
- **本地存储**: 必须启用（用于保存进度）

## 音效文件说明

需要在 `assets/sounds/` 目录下放置以下音效文件：

| 文件名 | 用途 | 时长 |
|--------|------|------|
| correct.wav | 回答正确 | ~0.5s |
| wrong.wav | 回答错误 | ~0.5s |
| click.wav | 按钮点击 | ~0.2s |
| complete.wav | 关卡完成 | ~1.0s |

## 扩展开发指南

### 添加新题型

1. 在 `data_manager.gd` 中添加新题型数据
2. 在 `gameplay_controller.gd` 中添加 `create_xxx_widget()` 方法
3. 在 `gameplay_controller.gd` 的 `create_question_widget()` 中添加匹配分支
4. 在配置页面中添加对应复选框

### 添加新关卡

1. 通过配置页面可视化添加
2. 或直接在 `data_manager.gd` 的 `levels_data` 中添加

### 自定义主题

修改 `themes/theme.tres` 文件中的颜色和样式配置。

## 数据结构

### 题目数据结构
```gdscript
{
    "id": "ro_001",
    "type": "review_opinion",
    "difficulty": 1,
    "description": "题目描述",
    "options": [{"id": "A", "text": "选项A", "correct": true}],
    "correct_reason": "正确答案解析",
    "abnormal_reason": "异常提示",
    "score": 10
}
```

### 训练记录结构
```gdscript
{
    "level_id": "level_1",
    "mode": 0,  # 0=训练, 1=自由练习
    "score": 85,
    "accuracy": 85.0,
    "total_questions": 10,
    "correct_questions": 8,
    "timestamp": 1234567890,
    "gameplay_data": {...}
}
```

## License

内部训练系统，仅限授权使用。
