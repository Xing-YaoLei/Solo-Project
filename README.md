# 职业教育在线课程漏斗报表系统

基于 Python Dash + Plotly + Pandas + PostgreSQL + Celery 构建的职业教育在线课程漏斗分析报表系统。

## 功能特性

### 核心功能
- **漏斗报表分析**: 7级漏斗分析（课程报名 → 开始学习 → 学习中 → 即将完成 → 课程完成 → 成绩合格 → 成功就业）
- **进度落后染色**: 进度落后学生自动标记红色预警
- **多维度下钻**: 从成绩反馈下钻到提醒规则、课程章节、原始样本
- **备注系统**: 分析时可快速添加备注
- **报表导出**: Excel导出，包含筛选范围和指标口径说明
- **早会模式**: 一键切换早会复盘模式

### 数据同步
- **就业表同步**: Celery异步任务同步就业系统数据
- **直播平台同步**: 同步直播观看记录
- **LMS同步**: 同步学习管理系统数据
- **异常数据保留**: 同步异常数据完整保留供排查

## 技术栈

| 技术 | 用途 |
|------|------|
| Python 3.10+ | 开发语言 |
| Dash 2.17 | 前端可视化框架 |
| Plotly 5.22 | 图表库 |
| Pandas 2.2 | 数据处理 |
| PostgreSQL / SQLite | 数据库 |
| SQLAlchemy 2.0 | ORM框架 |
| Celery 5.4 | 异步任务队列 |
| Redis | 消息队列 |

## 快速开始

### 一键启动（推荐）

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 确保 data 目录存在
mkdir -p data

# 3. 运行启动脚本
chmod +x scripts/start.sh
./scripts/start.sh
# 选择选项 5 或 6 一键启动
```

### 手动启动

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 初始化数据库
python scripts/init_db.py

# 3. 生成示例数据
python scripts/generate_sample_data.py

# 4. 启动仪表盘
python run.py
```

### 启动 Celery Worker（可选，用于数据同步）

```bash
celery -A app.sync worker --loglevel=info --beat
```

## 项目结构

```
MP0173/
├── app/
│   ├── __init__.py              # Flask + Dash 应用初始化
│   ├── models/
│   │   ├── __init__.py
│   │   └── base.py            # 数据库模型
│   ├── sync/
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Celery配置
│   │   └── tasks.py           # 同步任务
│   ├── services/
│   │   ├── __init__.py
│   │   └── funnel.py          # 数据服务层
│   ├── pages/
│   │   ├── __init__.py
│   │   ├── main.py            # 主页面
│   │   └── drilldown.py       # 下钻页面
│   └── callbacks/
│       ├── __init__.py
│       ├── main_callbacks.py     # 主页面回调
│       └── drilldown_callbacks.py  # 下钻页面回调
├── scripts/
│   ├── init_db.py             # 数据库初始化
│   ├── generate_sample_data.py  # 示例数据生成
│   └── start.sh             # 一键启动脚本
├── data/                       # SQLite数据库目录
├── requirements.txt           # Python依赖
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
├── run.py                   # 应用入口
└── README.md                # 项目说明
```

## 数据库模型

| 表名 | 说明 |
|------|------|
| courses | 课程信息 |
| course_chapters | 课程章节 |
| students | 学生信息 |
| grades | 成绩记录 |
| employments | 就业记录 |
| live_sessions | 直播观看记录 |
| lms_records | LMS学习记录 |
| reminder_rules | 提醒规则 |
| anomaly_data | 异常数据 |
| notes | 备注 |
| sync_tasks | 同步任务记录 |

## 功能说明

### 漏斗分析阶段

1. **课程报名**: 学生报名课程人数
2. **开始学习**: 至少开始学习一个章节
3. **学习中**: 完成率20%-80%
4. **即将完成**: 完成率80%-100%
5. **课程完成**: 完成所有必修章节
6. **成绩合格**: 总成绩≥60分
7. **成功就业**: 完成课程后成功就业

### 进度预警规则

- 完成率低于30% → 紧急预警
- 完成率低于60% → 进度落后
- 距离截止日期7天内且完成率<80% → 进度落后
- 实际进度落后预期20%以上 → 进度落后

### 报表导出

导出Excel包含以下Sheet：
- **报告说明**: 生成时间、筛选范围
- **核心指标**: 指标名称、指标值、计算口径、数据来源
- **漏斗分析**: 各阶段人数、转化率
- **学生明细**: 筛选范围内所有学生数据
- **提醒规则**: 系统配置的提醒规则

## 早会模式

点击顶部「早会模式」按钮，系统自动聚焦关键数据，适用于早会复盘场景：
- 自动展示关键KPI
- 突出进度落后学生
- 快速下钻分析问题
- 快速添加跟进备注

## 访问地址

启动后访问：**http://localhost:8050/

## 配置说明

### 环境变量配置（`.env`）

```env
# 数据库连接
DATABASE_URL=sqlite:///data/edu_funnel.db

# Redis（Celery可选）
REDIS_URL=redis://localhost:6379/0

# 外部API配置
EMPLOYMENT_API_URL=...
LIVE_API_URL=...
LMS_API_URL=...
API_TOKEN=...

# Dash配置
DASH_DEBUG=True
DASH_PORT=8050
```

### PostgreSQL配置

如需使用PostgreSQL，请修改`.env`：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/edu_funnel
```

## 数据同步

### 手动同步数据

```python
from app.sync import sync_employment_data, sync_live_platform_data, sync_lms_data

# 同步就业数据
result = sync_employment_data.delay(records=[...])

# 同步直播数据
result = sync_live_platform_data.delay(records=[...])

# 同步LMS数据
result = sync_lms_data.delay(records=[...])
```

### 异常数据处理

所有同步过程中的异常数据会自动保存到`anomaly_data`表，包含：
- 原始数据（JSON格式）
- 异常类型
- 错误信息
- 同步批次号
- 解决状态标记

## 常用操作

### 添加备注

1. 在主页面表格中选择学生行，点击「添加备注」
2. 或在下钻页面点击「添加备注」按钮
3. 选择备注类型（通用/学习跟进/就业指导/心理辅导）
4. 输入备注内容保存

### 导出报表

1. 设置筛选条件（课程、专业、日期、状态等）
2. 点击「导出报表」按钮
3. 系统自动生成Excel文件，包含筛选范围和指标口径

### 下钻分析

1. 在主页面表格中选择学生
2. 点击「查看详情」或直接双击表格行
3. 查看：
   - 匹配的提醒规则
   - 各章节学习进度
   - 学习时长对比
   - 历史备注
   - 原始样本数据（LMS/直播/就业记录）

## 开发说明

### 添加新的提醒规则

```python
from app.models import ReminderRule
from app import db

rule = ReminderRule(
    rule_name="新规则名称",
    rule_type="warning_type",
    threshold_type="completion_rate",  # 或 total_score
    threshold_value=50,
    comparison="lt",  # lt, lte, gt, gte, eq, ne
    time_window_days=7,
    reminder_message="提醒内容",
    priority=1,
)
db.session.add(rule)
db.session.commit()
```

### 自定义指标口径

修改 `app/services/funnel.py` 中的 `METRICS_CALIBER` 字典：

```python
METRICS_CALIBER = {
    "your_metric": {
        "name": "指标名称",
        "calculation": "计算公式说明",
        "data_source": "数据来源",
        "update_frequency": "更新频率",
    }
}
```

## License

MIT License
