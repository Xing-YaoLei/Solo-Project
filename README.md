# 🎫 TicketVerifyTrainer - 票务核销训练师

活动票务现场核销调度解谜游戏。基于 Godot 4、GDScript 开发，支持 Web 导出。

## 项目特色

- **关卡化训练**：从入门到精通，渐进解锁更复杂的票种规则
- **动态内容**：关卡、票种、订单、教程、排行榜均通过 JSON 配置，不写死
- **完整复盘**：每次训练记录得分、错因统计、退票争议触发记录
- **效率分析**：统计页展示各关卡训练效果评分，便于针对性训练
- **本地持久化**：训练进度、高分记录、排行榜全部本地存储

## 目录结构

```
MP0420/
├── project.godot              # Godot 项目配置
├── export_presets.cfg         # Web 导出预设
├── icon.svg                   # 项目图标
├── data/                      # JSON 数据配置（全部可编辑）
│   ├── ticket_types.json      # 票种定义与核销规则
│   ├── levels.json            # 关卡配置
│   ├── order_templates.json   # 订单模板
│   └── tutorials.json         # 教程内容
├── scenes/                    # Godot 场景文件
│   ├── main_menu.tscn         # 主菜单
│   ├── level_select.tscn      # 关卡选择
│   ├── game_play.tscn         # 核心游戏场景
│   ├── results.tscn           # 结算复盘页
│   ├── tutorial.tscn          # 教程引导
│   └── stats.tscn             # 统计中心+排行榜
├── scripts/                   # GDScript 代码
│   ├── autoload/              # 全局单例
│   │   ├── game_manager.gd    # 游戏状态、场景切换、进度管理
│   │   ├── data_loader.gd     # JSON 数据加载
│   │   ├── score_manager.gd   # 评分逻辑、错因、争议记录
│   │   └── stats_manager.gd   # 统计、排行榜、训练效果分析
│   ├── main_menu.gd
│   ├── level_select.gd
│   ├── game_play.gd
│   ├── results.gd
│   ├── tutorial.gd
│   └── stats.gd
└── assets/                    # 素材目录（纹理、音效、字体）
```

## 核心玩法流程

1. **接任务**：在关卡选择界面选择训练关卡
2. **看线索**：每个订单提供现场线索描述和详细信息
3. **做选择**：
   - ✅ 放行通过 - 核验无误
   - ❌ 拒绝入场 - 不符合规则
   - ⚠️ 升级处理 - 存疑需进一步核实
4. **解锁进阶**：达到及格分数自动解锁下一关卡
5. **复盘改进**：结算页展示错因统计和争议记录

## 扩展内容

### 添加新票种
编辑 `data/ticket_types.json`，按现有格式新增条目即可。

### 添加新关卡
编辑 `data/levels.json`，指定启用的票种、订单数量、时间限制等。

### 添加订单模板
编辑 `data/order_templates.json`，可设置有效/无效订单和线索描述。

### 添加教程
编辑 `data/tutorials.json`，支持多页幻灯片式教程。

## Web 导出

项目已配置 Web 导出预设：
1. 用 Godot 4 打开项目
2. 菜单 → 项目 → 导出
3. 选择 "Web" 预设
4. 点击 "导出项目"

## 运行

1. 安装 Godot 4.2+
2. 导入项目文件夹
3. 点击运行按钮（F5）
