# 药店连锁促销陈列漏斗报表系统

> 将促销陈列从传统静态报表中独立拆分出来的专业数据看板

## 🎯 核心功能

### 1. 三大数据异常自动标注（每次看板刷新时触发）
| 异常类型 | 标识 | 说明 |
|---|---|---|
| ⏱️ 收银系统延迟 | `cashier_delay` | 收银数据超过设定阈值（默认5分钟）未同步 |
| 👥 会员记录缺失 | `member_missing` | 销售流水关联会员ID为空的条数超标 |
| 🏥 医保接口口径变化 | `mi_caliber_change` | 医保结算字段与历史口径不一致的记录 |

### 2. 三个常用视图
- **销售变化走势**：时间序列 + 陈列不合格区间高亮（红色阴影markArea）+ 异常点标记（markPoint）+ 复盘说明悬浮联动
- **整改记录管理**：整改闭环跟踪，超期自动红色预警，进度仪表板
- **陈列照片保存**：4类照片（全景🖼️/POP📋/价格🏷️/堆头📦）网格管理 + 上传预览

### 3. 核心特色功能
- **复盘说明不与异常点分离**：同一行/同一组件内垂直合并展示异常tag与复盘绿色卡片
- **陈列不合格影响时间范围**：DuckDB窗口函数自动检测巡检区间，计算「影响开始日/结束日/天数/预计损失销售额」
- **下载附带计算规则**：所有导出Excel最后一个Sheet固定为「促销达成计算规则」，含10条标准指标公式
- **预警阈值可配置+修改留痕**：强制输入修改人姓名+原因，完整记录old/new值，审计可追溯

---

## 🏗️ 技术选型与架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          前端（React SPA）                        │
│   React 18 + React Router 6 + Ant Design 5 + ECharts 5 + Vite    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ /api/v1/* (Vite proxy)
┌──────────────────────────────▼──────────────────────────────────┐
│                       后端（FastAPI REST API）                    │
│   FastAPI + SQLAlchemy + Pydantic + Pandas(Excel导出)            │
└──────────┬───────────────────────────────┬──────────────────────┘
           │ OLTP 增删改查                  │ OLAP 聚合分析
┌──────────▼──────────┐         ┌──────────▼──────────┐
│   PostgreSQL 14+    │◄─ATTACH─│      DuckDB         │
│   10张事务表        │         │ 3张物化分析视图      │
└─────────────────────┘         └─────────────────────┘
```

| 层级 | 技术 | 说明 |
|---|---|---|
| 前端展示 | React 18 + ECharts 5 | 6大页面SPA |
| 前端UI库 | Ant Design 5 | 组件库 + 图标 |
| 前端构建 | Vite 5 | 热更新 + API代理（5173→8000） |
| 后端API | FastAPI 0.110 | 异步ASGI，Swagger文档`/docs` |
| ORM | SQLAlchemy 2.0 | PostgreSQL映射10张表 |
| 事务数据库 | PostgreSQL | 门店/促销/巡检/整改/照片/阈值/标注 |
| 分析引擎 | DuckDB 0.10 | ATTACH PG → 漏斗聚合/窗口函数/时间范围检测 |
| 报表导出 | Pandas + openpyxl | 多Sheet Excel + 计算规则Sheet |

---

## 📦 数据库表设计（共10张）

| 表名 | 用途 | 核心字段 |
|---|---|---|
| `stores` | 门店信息 | store_code, region, city, is_medical_insurance |
| `promotions` | 促销活动 | promo_code, start_date, end_date, target_sales, discount_rate |
| `display_inspections` | 陈列巡检 | is_qualified, position/pop/price/stock_score, overall_score |
| `display_photos` | 陈列照片 | inspection_id, file_path, upload_by, photo_type(4类) |
| `sales_records` | 销售流水(含异常) | sales_amount, cashier_delay_minutes, member_record_missing_count, medical_insurance_caliber_changed |
| `rectifications` | 整改记录 | issue_description, status(pending/completed/overdue), reviewer |
| `threshold_configs` | 阈值配置 | config_key, config_value, category, current_modified_by |
| `threshold_change_logs` | **阈值修改历史** | config_id, old_value, new_value, changed_by, change_reason, changed_at |
| `exception_annotations` | 异常标注复盘 | exception_type, impact_degree, review_note, review_by |
| `refresh_logs` | 刷新日志 | records_processed, exceptions_found(JSON), status |

---

## 🚀 快速启动指南

### 前置环境

```bash
# 必须
Python 3.10+
Node.js 18+
PostgreSQL 14+  （本地创建一个空数据库即可）
```

### Step 1：克隆并配置后端

```bash
cd MP0233/backend

# 1. 安装Python依赖
pip install -r requirements.txt

# 2. 配置环境变量（复制模板）
cp .env.example .env
# 编辑 .env 修改 PostgreSQL 连接信息：
#   PG_HOST=localhost
#   PG_PORT=5432
#   PG_USER=postgres
#   PG_PASSWORD=your_password
#   PG_DATABASE=pharmacy_promo

# 3. 初始化数据库 + 导入1000+条Mock数据
python scripts/init_mock_data.py
# 输出：
#   ✅ 数据库表创建完成
#   ✅ 20家门店已创建
#   ✅ 10个促销活动已创建
#   ✅ 10项默认阈值已创建
#   ✅ 陈列巡检 + 照片 + 整改记录已导入
#   ✅ 200+条销售流水（含8%收银延迟/6%会员缺失/4%医保口径变化）已导入
#   ✅ Mock数据初始化全部完成

# 4. 启动 FastAPI 后端（端口8000）
uvicorn app.main:app --reload --port 8000
# 验证：浏览器打开 http://localhost:8000/api/v1/docs 查看Swagger
```

### Step 2：启动前端

```bash
cd MP0233/frontend

# 1. 安装Node依赖
npm install
# 或者
yarn install

# 2. 启动Vite开发服务器（端口5173）
npm run dev
# 输出：
#   VITE v5.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/

# 3. 浏览器打开：http://localhost:5173
```

### Step 3：首次使用流程

1. 登录系统默认进入「**促销陈列漏斗看板**」首页
2. 点击顶部筛选栏右侧的 **「🔄 刷新数据(标注异常)」** 按钮
   - 触发DuckDB从PostgreSQL同步分析数据
   - 自动扫描3类异常（收银延迟/会员缺失/医保口径）
   - 写入刷新日志，顶部异常横幅显示各类异常计数徽章
3. 点击徽章可展开异常明细表，支持直接为异常添加复盘说明

---

## 🧭 功能页面导航

### 1. 🏠 促销陈列漏斗看板（首页）
- 顶部异常横幅（3类异常计数徽章，点击查看明细）
- 筛选：区域/门店/促销/日期范围
- 核心指标卡：活动数/累计销售额/目标额/平均达成率
- **左侧ECharts漏斗图**：5阶段（活动创建→巡检完成→陈列合格→整改完成→销售达成）+ 阶段转化率
- 右侧异常统计 + Top3促销详情
- 底部促销明细表：点击促销编码→弹窗显示该促销的漏斗柱状图
- 下载按钮：导出当前筛选条件下的漏斗报表（含计算规则Sheet）

### 2. 📈 销售变化走势
- 顶部Alert：陈列不合格影响的时间范围Tag组（Hover显示影响天数/得分/预计损失）
- **核心ECharts图**：
  - 蓝色面积线：实际销售额
  - 黄色虚线：日均目标线
  - 彩色柱状：当日达成率（<70%红色）
  - **红色阴影markArea**：陈列不合格影响区间
  - **图标markPoint**：3类异常标记点（⏱️/👥/🏥）
  - **Tooltip深度联动**：同时显示金额+异常tag+复盘说明（绿色块）
- 下方明细表：**异常tag列与复盘说明列合并在同一单元格内垂直展示**（不分离），不合格行红色背景高亮
- 支持任意日期+异常类型添加异常标注与复盘说明

### 3. 🛠️ 整改记录管理
- 顶部整改完成率仪表板（进度环）
- 筛选：状态/促销活动
- 表格列：门店/促销/问题描述/要求完成日/实际完成日/整改人/审核人
- 超期记录自动整行红色高亮
- 支持新建/编辑整改记录

### 4. 🖼️ 陈列照片保存
- 筛选：门店/促销/合格状态/日期
- 表格行可展开 → 显示该巡检记录下的4类照片网格
- 4类照片emoji标识：全景🖼️ / POP物料📋 / 价格标签🏷️ / 库存堆头📦
- 支持每行动态上传照片 + 批量上传
- 照片详情Modal + 大图预览

### 5. ⚙️ 预警阈值配置
- 顶部「阈值调整须知」Alert（留痕说明/生效时机/建议角色）
- 表格列：阈值名称/说明/当前值（大字体蓝）/参考范围/最近修改人+时间/变更历史条数/操作
- **调整阈值Modal**：
  - 自动显示配置键/分类/当前值/说明
  - 必填项：新阈值（带min/max校验）+ **修改人姓名** + **修改原因（≥5字）**
  - 若新旧值相同自动提示无需保存
- **变更历史Modal**：表格展示每次修改的时间/修改人/变更前/变更后/原因

### 6. 📥 报表下载中心
- 6大报表模板卡片（渐变图标+hover抬升）：
  1. 促销陈列漏斗报表（3Sheet）
  2. 销售变化走势报表（4Sheet，含陈列影响范围）
  3. 整改记录汇总报表（4Sheet）
  4. 陈列照片巡检报表（3Sheet）
  5. 阈值调整审计报表（3Sheet）
  6. 异常数据摘要报表（5Sheet）
- 点击卡片展开筛选条件（区域/门店/促销/状态/异常类型/日期范围）
- 「促销达成计算规则预览」列表：6条核心指标公式 + 说明
- 「最近数据刷新记录」表格：时间/触发方式/处理数/异常发现/状态

---

## 📊 促销达成计算规则（下载Sheet内完整版共10条）

| 序号 | 指标名称 | 计算公式 | 说明 |
|---|---|---|---|
| 1 | 活动覆盖率 | 活动创建门店数 ÷ 总门店数 × 100% | 促销活动覆盖广度 |
| 2 | 巡检完成率 | 已完成巡检门店数 ÷ 活动覆盖门店数 × 100% | 巡检工作执行度 |
| 3 | 陈列合格率 | 陈列评分≥80分的门店数 ÷ 已巡检门店数 × 100% | 合格线80分，可调 |
| 4 | 整改完成率 | 已完成整改数 ÷ 需整改总数 × 100% | 问题闭环效率 |
| 5 | 销售达成率 | 实际促销销售额 ÷ 目标销售额 × 100% | 最终业绩评估 |
| 6 | 陈列影响损失 | 日均目标销售额 × 影响天数 × 30% | 保守估算损失额 |
| 7 | 漏斗总转化率 | 销售达成数 ÷ 活动创建数 × 100% | 全链路转化效率 |
| 8 | 收银延迟率 | 收银延迟记录数 ÷ 总销售记录数 × 100% | 数据质量指标 |
| 9 | 会员数据完整率 | (1-会员缺失记录数÷总记录数) × 100% | 会员数据质量 |
| 10 | 异常影响占比 | 异常影响日期销售额 ÷ 周期总销售额 × 100% | 异常对整体影响 |

---

## 🔧 关键API接口（全部在`/api/v1/docs`有Swagger文档）

### 漏斗核心
```
GET    /funnel/                      获取漏斗数据（同时扫描异常）
GET    /funnel/sales-trend           获取每日销售走势（含异常嵌入）
GET    /funnel/display-impact-ranges 陈列不合格影响时间范围检测
GET    /funnel/exceptions/scan       强制扫描异常
```

### 阈值配置（带审计留痕）
```
GET    /thresholds/                  获取所有阈值（含最近10条变更历史）
PUT    /thresholds/{config_id}       修改阈值（自动插入变更日志）
```

### 下载（多Sheet Excel）
```
GET    /download/funnel-report       漏斗报表（3Sheet + 计算规则）
GET    /download/sales-trend-report  走势报表（4Sheet + 计算规则）
```

### 数据刷新
```
POST   /refresh                      手动触发DuckDB同步+异常扫描
```

---

## 🐛 常见问题

**Q：启动后端提示 `psycopg2.OperationalError: connection refused`**
A：PostgreSQL未启动或`.env`连接配置错误，检查端口5432和账号密码。

**Q：DuckDB ATTACH失败，提示 `pg_config not found`**
A：DuckDB ATTACH PostgreSQL需要系统安装libpq。可直接使用init_mock_data.py（走SQLAlchemy写PG，不走ATTACH），然后调用`/refresh`接口时后端会回退。

**Q：下载Excel时浏览器打开了乱码页面**
A：检查Vite proxy是否正确配置，请求是否转发到8000端口。直接访问`http://localhost:8000/api/v1/download/funnel-report`可验证。

**Q：阈值修改后下次刷新仍用旧值**
A：刷新按钮点击后才会重新按新阈值扫描异常，修改配置后建议点击一次「刷新数据(标注异常)」。

---

## 📁 目录结构

```
MP0233/
├── backend/
│   ├── app/
│   │   ├── core/          # 配置（Pydantic Settings）
│   │   ├── db/            # SQLAlchemy会话
│   │   ├── models/        # 10张ORM表
│   │   ├── schemas/       # Pydantic 请求/响应Schema
│   │   ├── services/      # DuckDB分析服务
│   │   ├── api/           # 4组路由：funnel/records/config/download
│   │   └── main.py        # FastAPI入口
│   ├── scripts/
│   │   └── init_mock_data.py  # 1000+条Mock数据脚本
│   ├── uploads/           # 陈列照片存储目录
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios封装 + EXCEPTION_LABELS常量
│   │   ├── pages/         # 6个页面（Dashboard/SalesTrend/RectificationList/DisplayPhotos/ThresholdConfig/DownloadCenter）
│   │   ├── styles/        # global.css（异常tag/stat-card样式）
│   │   ├── App.jsx        # 主布局（Sider+Header+Routes）
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js     # 配置代理 /api -> :8000
│   └── package.json
│
└── README.md
```

---

## 📝 License

内部系统，仅限业务分析使用。
