# 高校教务选课排课漏斗报表分析系统

> 复盘会议可直接引用的交互式漏斗分析报表，技术栈：Python Dash + Plotly + Pandas + PostgreSQL + Celery

---

## 一、系统概览

### 1.1 业务背景
高校教务选课排课涉及**学生申请表、教学平台、一卡通**三源数据，流程长、环节多，复盘时需要：
- 一眼看清各阶段转化率与流失点
- 快速定位教室冲突、审核超时等异常
- 下钻到原始样本追溯问题根因
- 导出带指标口径的正式报告供会议讨论

### 1.2 漏斗 7 阶段模型
| 阶段编码 | 阶段名称 | 说明 |
|---------|---------|------|
| S1 | 课程目录发布 | 教学平台发布本学期可选课程 |
| S2 | 学生浏览课程 | 学生登录系统浏览课程目录 |
| S3 | 提交选课申请 | 学生选定课程提交申请 |
| S4 | 教务初审通过 | 教务员审核学生选课资格 |
| S5 | 排课分配完成 | 系统完成教室与时隙分配 |
| S6 | 教务终审通过 | 教务处终审确认 |
| S7 | 选课成功 | 学生正式入班 |

### 1.3 主要功能
- ✅ **漏斗总览**：7 阶段转化率 / 流失率标注 + KPI 仪表盘
- ✅ **三级下钻**：课程目录 → 教室资源 / 学生名单 / 申请明细 / 原始样本
- ✅ **冲突高亮**：教室冲突自动红色边框 + 浅红底色染色
- ✅ **备注可见**：所有数据表备注列置于最右侧，不折叠
- ✅ **异常清单**：6 大异常规则自动入库（教室冲突 / 超容量 / 审核超时 / 身份未核验 / 卡号不一致 / 选课超员）
- ✅ **审核时长报告**：8 Sheet Excel 导出，含筛选范围 + 指标口径说明页
- ✅ **三源同步**：Celery 定时同步学生申请、教学平台、一卡通

---

## 二、技术架构

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  学生申请表(外部)    │     │  教学平台(外部)      │     │  一卡通系统(外部)    │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Celery 定时任务层                                    │
│  sync_student_app (30min)  sync_teaching_platform (60min)  sync_card (120min) │
│                              anomaly_detection (15min)                         │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL 数据层                                     │
│  course_catalog / courses / classrooms / students / enrollment_applications   │
│  schedules / classroom_conflicts / anomaly_records / sync_logs / raw_*        │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Dash + Plotly 报表层                                  │
│  6 Tabs: 漏斗总览 / 课程目录下钻 / 排课冲突 / 审核时长 / 异常清单 / 同步日志   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、快速启动（无数据库 Demo 模式）

> **默认使用内置 Mock 数据**，无需 PostgreSQL / Redis / Celery 即可完整体验所有功能。

### 3.1 安装依赖
```bash
cd MP0151
pip install -r requirements.txt
```

> ⚠️ 若 Python ≥ 3.13 出现依赖版本冲突，可使用宽松安装：
> ```bash
> pip install dash dash-bootstrap-components plotly pandas numpy openpyxl xlsxwriter
> ```

### 3.2 启动报表服务
```bash
python app.py
```

启动后浏览器访问：**http://localhost:8050**

### 3.3 内置数据规模
| 数据集 | 数量 | 说明 |
|-------|------|------|
| 学生 | 80 人 | 覆盖 6 个学院 |
| 课程目录 | 20 门 | 含必修 / 选修 / 实验 |
| 选课申请 | 240 条 | 7 阶段全链路 |
| 排课记录 | 96 条 | 12 个教室 × 8 时段 × 5 天 |
| 教室冲突 | 12 起 | 自动染色高亮 |
| 异常记录 | 35 条 | 6 大异常类型 |
| 同步日志 | 30 条 | 3 个来源的同步轨迹 |
| 原始样本 | 100 条 | 三来源各约 30-40 条 |

---

## 四、页面导航说明

### 📊 Tab 1 - 漏斗总览
- 顶部 4 张 KPI 卡：总申请数 / 成功率 / 平均审核时长 / 冲突率
- 主漏斗图：带阶段转化率和阶段流失率标注
- 学院分布柱状图 + 状态饼图 + 异常趋势折线
- 底部：审核时长分布直方图 + 审核时长热力图（学院×阶段）

### 📑 Tab 2 - 课程目录下钻
- 上半：课程目录 DataTable（**备注列最右可见**）
- 点击任意课程行 → 下半联动展示：
  - 📋 课程详情卡（含备注）
  - 🏢 教室资源表（冲突行**红色边框染色**）
  - 👥 学生名单（学号 / 姓名 / 学院 / 一卡通 / 核验状态）
  - 📝 关联申请表（三阶段审核时长）
  - 🧪 原始样本（三来源原始数据快照）

### 🗓 Tab 3 - 排课与冲突
- 全局教室占用热力图（冲突格**红色边框**）
- 教室资源总表 + 冲突清单（点击任意教室可下钻其专属占用热力图）

### ⏳ Tab 4 - 审核时长
- 时长总览仪表盘（绿黄红三区间）
- 各阶段时长堆叠柱状图 + 时长分布直方图
- 申请明细表（按审核时长排序，点击可下钻）
- **导出按钮**：下载完整 Excel 报告

### 🚨 Tab 5 - 异常清单
- 6 大异常类型汇总 + 趋势
- 异常明细表（点击行查看关联申请详情）

### 🔄 Tab 6 - 同步日志
- 三来源同步任务执行记录（成功/失败数、耗时、异常数）
- 原始数据样本快照

---

## 五、导出报告说明（审核时长专题）

点击 **⏳ 审核时长 Tab → 📥 导出审核时长报告** 按钮，下载 Excel 文件：
`选课排课审核时长报告_{学期}_{时间戳}.xlsx`

### 5.1 报告包含 8 个 Sheet
| Sheet | 内容 |
|-------|------|
| ① 说明页 | 筛选范围 + 指标口径 + 生成时间 |
| ② 时长总览 | 4 维度汇总统计（初审/排课/终审/总时长） |
| ③ 时长分布 | 各阶段时长区间分布统计 |
| ④ 申请清单 | 全量申请明细（含三阶段时长 + 是否超时） |
| ⑤ 漏斗转化 | 7 阶段人数 + 转化率 |
| ⑥ 冲突清单 | 教室冲突明细 |
| ⑦ 异常清单 | 异常记录明细 |
| ⑧ 指标口径 | 6 个核心指标的定义 / 公式 / 阈值 |

### 5.2 筛选范围（报告说明页内展示）
- 时间范围：`YYYY-MM-DD` ~ `YYYY-MM-DD`
- 学期范围：`2024-2025学年第2学期`
- 学院：全部学院
- 课程类型：全部类型

### 5.3 核心指标口径
| 指标 | 定义 | 公式 | 阈值 |
|-----|------|------|------|
| 初审时长 | 提交→初审通过耗时 | `初审通过时间 - 申请提交时间` | ≤24h |
| 排课时长 | 初审→排课完成耗时 | `排课完成时间 - 初审通过时间` | ≤48h |
| 终审时长 | 排课→终审通过耗时 | `终审通过时间 - 排课完成时间` | ≤24h |
| 总审核时长 | 提交→终审全流程耗时 | `终审通过时间 - 申请提交时间` | ≤72h |
| 阶段转化率 | 下一阶段人数 / 当前阶段人数 | `S(n+1) / S(n)` | ≥80% |
| 教室冲突率 | 冲突排课 / 总排课 | `冲突数 / 排课总数` | ≤5% |

---

## 六、连接真实 PostgreSQL + Celery（生产模式）

### 6.1 环境配置
```bash
cp .env.example .env
# 编辑 .env 填写数据库与 Redis 信息
```

`.env` 关键项：
```env
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/edu_funnel
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### 6.2 初始化数据库
```bash
python -c "from models.database import init_db; init_db()"
```

### 6.3 启动 Celery Worker + Beat
```bash
# 终端1：启动 Worker
celery -A celery_app worker --loglevel=info -P solo

# 终端2：启动 Beat 定时调度
celery -A celery_app beat --loglevel=info
```

同步频率：
| 任务 | 频率 |
|-----|------|
| 学生申请表同步 | 每 30 分钟 |
| 教学平台同步 | 每 60 分钟 |
| 一卡通同步 | 每 120 分钟 |
| 异常检测 | 每 15 分钟 |

### 6.4 切换数据服务
编辑 `app.py`，将 `MockDataService()` 替换为：
```python
from utils import DataService
ds = DataService()
```

---

## 七、项目目录结构

```
MP0151/
├── app.py                     # Dash 主应用入口（6 Tabs + 所有回调）
├── celery_app.py              # Celery 实例 + Beat 定时配置
├── config.py                  # 全局配置（漏斗阶段 / 颜色 / 频率）
├── requirements.txt           # 依赖清单
├── .env.example               # 环境变量模板
├── README.md                  # 本文档
│
├── app/                       # 图表组件层
│   └── charts.py              # 10 个 Plotly 图表构造函数
│
├── models/                    # 数据模型层（10 张表）
│   ├── database.py            # SQLAlchemy Engine + Session
│   ├── student.py             # Student 学生信息
│   ├── course.py              # CourseCatalog / Course 课程
│   ├── classroom.py           # Classroom 教室资源
│   ├── enrollment.py          # EnrollmentApplication 选课申请（含时长字段）
│   ├── schedule.py            # Schedule / ClassroomConflict 排课与冲突
│   ├── anomaly.py             # AnomalyRecord / SyncLog 异常与同步日志
│   └── source_raw.py          # RawStudentApplication / RawTeachingPlatform / RawSmartCard 三源原始表
│
├── tasks/                     # Celery 任务层
│   ├── base.py                # BaseSyncTask 基类（日志 + 异常记录）
│   ├── sync_student_application.py  # 学生申请表同步
│   ├── sync_teaching_platform.py    # 教学平台同步
│   ├── sync_smart_card.py           # 一卡通同步
│   └── anomaly_detection.py          # 6 大异常规则检测
│
└── utils/                     # 数据服务层
    ├── mock_data.py           # 全量 Mock 数据生成器
    ├── data_service.py        # MockDataService + DataService 查询接口
    └── exporter.py            # ReportExporter 8 Sheet Excel 导出器
```

---

## 八、关键设计决策

### 8.1 冲突高亮染色机制
`app.py` → `_style_table()` 函数：
- 行含 `is_conflict=1` 或 `has_conflict=1` → `border-left: 4px solid #FF4D4F` + 浅红背景 `#FFF1F0`
- 单元格值含"冲突"文字 → 字体标红加粗

### 8.2 备注列不隐藏
所有 `dash_table.DataTable` 的 `columns` 定义中 `remark` 列始终置于末尾，不加入 `hidden_columns`。

### 8.3 三级下钻联动
```
课程目录行点击 → active_course_code (Store)
   ├→ 课程详情卡（get_course_details）
   ├→ 教室资源过滤
   ├→ 学生名单过滤
   ├→ 关联申请过滤
   └→ 原始样本过滤
        教室行点击 → active_room_id (Store) → 专属占用热力图
            申请行点击 → 三阶段时长详情卡
```

### 8.4 异常检测 6 大规则
| 规则 | 触发条件 | 异常类型 |
|-----|---------|---------|
| 教室冲突 | 同时段同教室 ≥2 门课 | CLASSROOM_CONFLICT |
| 超容量排课 | 选课人数 > 教室容量 | OVER_CAPACITY |
| 审核超时 | 初审>24h / 终审>24h / 总>72h | REVIEW_TIMEOUT |
| 身份未核验 | student.is_verified=False | IDENTITY_UNVERIFIED |
| 卡号不一致 | 申请表卡号 ≠ 一卡通卡号 | CARD_MISMATCH |
| 选课超员 | 单学生选课 >6 门 | OVER_ENROLLMENT |

---

## 九、复盘会议使用指引

### 准备阶段（开会前 5 分钟）
1. `python app.py` 启动服务
2. 打开浏览器 → Tab 1 漏斗总览
3. 点击 Tab 4 → 导出 Excel 报告（打印或投屏用）

### 会议流程
1. **整体形势**（Tab 1）：先过 4 张 KPI 卡 → 漏斗转化率 → 异常趋势
2. **学院差异**（Tab 1 柱状图）：定位落后学院 → Tab 2 筛选该学院
3. **冲突问题**（Tab 3）：查看冲突热力图 → 下钻具体教室和课程
4. **时长瓶颈**（Tab 4）：仪表盘 + 阶段柱状图 → 定位是初审/排课/终审哪段慢
5. **异常追责**（Tab 5）：按类型筛选 → 点击行查看关联申请详情
6. **总结输出**：将导出的 Excel 作为会议纪要附件发送

---

## 十、常见问题

**Q: 启动报错 `ModuleNotFoundError: No module named 'xxx'`**
A: 执行 `pip install -r requirements.txt`，若 Python 3.13+ 有兼容问题，逐个安装：
   `pip install dash dash-bootstrap-components plotly pandas numpy openpyxl xlsxwriter`

**Q: 图表中文显示为方框**
A: macOS 系统已安装 PingFang SC，已通过 fonts.googleapis.com 加载 Noto Sans SC。
   若仍乱码，检查本机网络能否访问 fonts.googleapis.com。

**Q: 导出 Excel 打不开？**
A: 报告使用 xlsxwriter 生成标准 .xlsx，WPS / Office 2016+ 均可打开。
   文件较大时（申请>10000条）建议用 Excel 而非 WPS 打开。

**Q: 如何替换为真实数据？**
A: 参考「第六章 连接真实 PostgreSQL + Celery」，配置 .env → 启 DB → 启 Celery → 切换 DataService。
   任务中已预留数据源连接接口，实际部署时替换为学校接口对接代码即可。
