# 长租公寓房源上架漏斗报表系统

基于 **Python Dash + Plotly + Pandas + PostgreSQL + Celery** 构建的长租公寓房源上架全流程追踪与分析系统。

## ✨ 功能特性

### 📊 房源上架漏斗
- 追踪房源从 **草稿 → 待审核 → 已发布 → 已下架** 的完整流程
- 按区域/项目维度的上架分布统计
- 上架率、出租率核心 KPI 实时展示

### 📈 分析区
1. **房源照片分布** — 饼图+柱状图分析各照片档位的房源数量
2. **租客档案漏斗** — 意向→看房→意向金→签约→入住 的转化漏斗与转化率曲线
3. **合同版本排行** — 各版本合同的使用数、逾期数、平均租金对比
4. **维修记录变化** — 月度趋势、类型占比、状态变化多维度展示

### ⚠️ 租金逾期管理
- 逾期合同列表（按逾期天数高亮分级）
- **支持为每条逾期记录写注释**（备注/催缴/协商/法律通知/已解决）
- 注释历史记录可追溯

### 🔐 权限体系
| 角色 | 可见内容 |
|------|----------|
| **管理层** (admin/manager) | 总览、分析区、租金逾期、全量出租率明细、数据导入 |
| **一线人员** (frontline/agent) | 仅可见自己负责范围内的出租率明细和逾期 |

### 📥 数据导入与批次追踪
- 指标加工顺序：**先 CRM（房源+租客）→ 再合并电子合同 → 最后导入抄表、维修**
- 每次导入自动生成 **唯一批次号**（格式：`类型_时间戳_UUID`）
- 批次历史表记录：源文件、总数、成功数、失败数、状态、错误信息

---

## 🏗️ 技术栈

| 层次 | 技术 |
|------|------|
| 展示层 | **Dash** (Flask 基础), **Plotly**, **dash-bootstrap-components** |
| 数据加工 | **Pandas**, **NumPy** |
| 数据存储 | **PostgreSQL** + **SQLAlchemy 2.0** ORM |
| 异步任务 | **Celery** + **Redis** (数据导入异步处理) |
| 权限认证 | **Flask-Login** + **Werkzeug** 密码哈希 |
| 文件支持 | Excel (.xlsx/.xls), CSV |

---

## 📁 项目结构

```
MP0293/
├── app/
│   ├── __init__.py
│   ├── config.py                    # 配置中心（数据库/Redis/路径）
│   ├── database.py                  # SQLAlchemy 引擎和会话
│   ├── models.py                    # 数据库表模型
│   ├── auth.py                      # 权限控制与数据范围过滤
│   ├── batch_utils.py               # 批次号生成与状态管理
│   ├── report_service.py            # 报表查询服务层
│   ├── celery_app.py                # Celery 应用
│   ├── tasks.py                     # Celery 异步导入任务
│   ├── processors/
│   │   ├── crm_processor.py         # CRM 房源/租客导入处理器
│   │   ├── contract_processor.py    # 电子合同导入+逾期计算+CRM合并
│   │   └── meter_repair_processor.py # 抄表/维修记录处理器
│   └── dash_app/
│       ├── app.py                   # Dash 应用入口
│       ├── layouts.py               # 页面布局与组件
│       └── callbacks.py             # 交互回调逻辑
├── scripts/
│   ├── init_database.py             # 初始化数据库和默认用户
│   └── generate_sample_data.py      # 生成示例 Excel 数据
├── data/
│   ├── uploads/                     # 导入文件上传目录
│   └── exports/                     # 示例数据导出目录
├── run_dash.py                      # Dash 服务器启动脚本
├── run_worker.py                    # Celery Worker 启动脚本
├── requirements.txt                 # Python 依赖
└── .env.example                     # 环境变量模板
```

---

## 🚀 快速开始

### 1️⃣ 环境准备

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量（复制并修改）
cp .env.example .env
```

确保已启动：
- **PostgreSQL**（默认库 `long_rent_report`，用户 `postgres`）
- **Redis**（默认 `localhost:6379`）

### 2️⃣ 初始化数据库

```bash
python scripts/init_database.py
```

自动创建所有表 + 两个默认用户：
| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 管理层 |
| `frontline` | `front123` | 一线人员（权限范围：阳光花园、水岸豪庭） |

### 3️⃣ 生成示例数据

```bash
python scripts/generate_sample_data.py
```

在 `data/exports/` 下生成 5 个 Excel 文件。

### 4️⃣ 启动服务

需要两个终端：

**终端 A — 启动 Celery Worker**（处理异步导入）
```bash
python run_worker.py
```

**终端 B — 启动 Dash 报表**
```bash
python run_dash.py
```

浏览器访问 **http://localhost:8050**

### 5️⃣ 导入示例数据

登录后进入 **📥 数据导入** Tab，按顺序拖拽上传：

1. `示例_CRM房源.xlsx` → 导入房源基础数据
2. `示例_CRM租客.xlsx` → 导入租客档案
3. `示例_电子合同.xlsx` → 导入合同并关联房源/租客（自动计算逾期）
4. `示例_抄表数据.xlsx` → 导入水电燃气抄表
5. `示例_维修记录.xlsx` → 导入维修工单

导入完成后可在 **📜 导入批次历史** 查看每次的批次号、成功/失败数。

---

## 🧭 使用指南

### 管理层视角（admin）
| Tab | 功能 |
|-----|------|
| 📊 **总览** | 8 个核心 KPI 卡片 + 房源上架漏斗图 + 区域分布图 |
| 📈 **分析区** | 4 大分析图表：照片分布、租客漏斗、合同版本排行、维修趋势 |
| ⚠️ **租金逾期** | 逾期列表 + 分级高亮 + 注释写入与历史查看 |
| 🏡 **出租率明细** | 全量房源明细，支持项目/区域/状态筛选，可导出 Excel |
| 📥 **数据导入** | 5 类数据导入入口 + 批次历史追踪（5秒自动刷新） |

### 一线人员视角（frontline）
仅可见：
- **🏡 出租率明细** — 但只显示自己权限范围内（`阳光花园`+`水岸豪庭`）的房源
- **⚠️ 租金逾期** — 同样按权限范围过滤

---

## 🗃️ 核心数据表

| 表名 | 说明 |
|------|------|
| `users` / `user_scopes` | 用户表 + 数据权限范围（项目/区域） |
| `import_batches` | 导入批次记录表（每批次唯一 `batch_no`） |
| `properties` | 房源主表（编号、项目、状态、照片数、管家） |
| `property_photos` | 房源照片明细表 |
| `tenants` | 租客档案表（含 `profile_stage` 转化阶段） |
| `contracts` | 合同表（版本号、租金、租期、逾期状态） |
| `overdue_notes` | 租金逾期注释表（可写多条备注） |
| `meter_readings` | 水电燃气抄表记录 |
| `repair_records` | 维修工单（类型、状态、费用、满意度） |

所有业务表均带 `batch_no` 字段，可追溯每条数据的导入来源。

---

## 🔧 扩展建议

1. **多项目权限配置**：在 `user_scopes` 表中为一线人员添加更多 `project` 或 `district` 类型记录
2. **导入模板校验**：在各 `Processor.clean_*_data` 方法中增加更严格的字段校验
3. **定时任务**：可通过 `celery beat` 配置每日自动触发逾期重算
4. **邮件通知**：在 `submit_note` 回调中接入邮件/短信 API 自动通知租客
5. **导出功能**：在 Dash 表中已启用 `export_format='xlsx'`，可一键导出筛选后的数据
