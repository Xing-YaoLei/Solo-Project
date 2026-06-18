# 二手车门店车源上架跟进台

面向二手车门店的车源上架流程管理系统，替代微信群消息确认状态的低效沟通方式。从车辆档案录入到最终上架，实现 **全链路数字化、批量处理、逐条复核、追溯查询**。

---

## 工程选型

| 层级 | 技术选型 | 说明 |
|-----|---------|------|
| 前端 | **Nuxt 3 + Vue 3 + TypeScript** | 现代 SSR/CSR 混合框架 |
| UI | **Naive UI** + Tailwind CSS | 轻量、高性能 Vue 3 组件库 |
| 状态管理 | **Pinia** + @vicons/antd 图标 | |
| 图表 | **ECharts 5** | 库存分布、周转、趋势等 |
| 后端 | **Django 4.2 + REST Framework** | 企业级 Python Web 框架 |
| 认证 | **Simple JWT** | Token 鉴权 |
| 数据库 | **PostgreSQL 15** | 关系型数据库 |
| 文件存储 | **MinIO** | 兼容 S3 的对象存储，存放证件扫描件、检测照片 |
| 部署 | **Docker Compose** | 一键启动前后端 + PostgreSQL + MinIO |

---

## 业务模块与流程

### 🚗 核心流程（阶段推进）

```
车源录入(评估师) → 检测报告 → 整备清单 → 试驾记录
        ↓              ↓          ↓          ↓
   [待评估] → [待检测] → [待整备] → [待试驾] → [待审核] → [已上架] → [已售出]
                                       ↓              ↓
                                   [批量审核]     [驳回补件]
```

### 🔐 角色权限拆分

| 角色 | 职责 | 主要操作权限 |
|-----|-----|------------|
| **评估师 (appraiser)** | 收车评估、录入档案、上传检测/整备 | 创建车源、检测/整备管理、上传附件、复核 |
| **销售 (sales)** | 试驾、客户意向、成交 | 试驾记录管理、查看车源、查看附件 |
| **金融专员 (finance)** | 贷款资料、证件补充 | 上传附件、管理金融资料 |
| **店长 (manager)** | 全流程管控、审核 | 所有权限 + 系统用户管理、批量操作、统计分析 |

### 📋 四大资料日常核对

| 资料类型 | 对应模块 | 关键字段 |
|---------|---------|---------|
| **车辆档案** | `vehicles` | VIN/车牌、品牌车型、年款、里程、收车/售价、评估师、来源、原车主 |
| **检测报告** | `inspections` | 12 大检测项、评级、事故/泡水/火烧/结构性损伤标记、综合评级、检测照片 |
| **整备清单** | `preparations` | 外观/内饰/机械/电气/喷漆/轮胎等分类项目、预估/实际费用、前后对比照 |
| **试驾记录** | `testdrives` | 客户信息、驾驶证、里程变化、体验反馈（制动/换挡/舒适性/噪音/操控/异响）、意向评级、期望价 |

---

## 功能亮点

### 批量处理 + 逐条复核
- ✅ 顶部多选勾选车源 → **批量推进阶段 / 批量审核通过 / 批量分配人员**
- ✅ 单条车源详情页可逐件查看材料来源、处理过程日志、关闭结论
- ✅ 复核时记录：复核人、结论（通过/资料缺失）、缺失材料清单、补件后再审核

### 资料缺失单独筛出
- ✅ 入口：左侧菜单「**资料缺失**」
- ✅ 必备三项证件（登记证书 / 行驶证 / 保险单）缺失自动识别
- ✅ 顶部可筛选：**缺失类型 + 品牌 + 状态 + 库存天数**
- ✅ 逐行操作：一键上传缺失证件 / 标记已补充 / 批量通知负责人

### 处理过程追溯
- ✅ 车源详情页侧边栏：**完整操作时间线**（创建 / 状态变更 / 检测 / 整备 / 试驾 / 复核 / 文档上传）
- ✅ 文档卡片可展开：**上传人 / 来源 / 核验人 / 核验备注 / 关闭结论 / 过程日志数组**

### 库存周转追踪到单据
- ✅ 入口：「**库存周转**」页面
- ✅ 指标：售出台数、总成本、总毛利、单车平均毛利、平均/中位/最快/最慢周转天数
- ✅ 图表：周转天数分布直方图、毛利排行 Top10 柱图
- ✅ 明细表点击「**追溯**」→ 抽屉展示从创建到售出全链路事件 + 关联单据号

---

## 项目目录结构

```
MP0323/
├── backend/                         # Django 后端
│   ├── core/                        # Django 项目配置
│   │   ├── settings.py              # 数据库/MinIO/JWT/REST 配置
│   │   ├── urls.py                  # 总路由
│   │   ├── asgi.py / wsgi.py
│   ├── apps/
│   │   ├── users/                   # 用户、角色、权限、登录
│   │   ├── vehicles/                # 车源档案、复核、状态日志
│   │   ├── inspections/             # 检测报告（12项检测明细）
│   │   ├── preparations/            # 整备工单与项目
│   │   ├── testdrives/              # 试驾记录与客户意向
│   │   ├── documents/               # 附件文档 + MinIO 存储封装
│   │   └── statistics/              # 统计分析 / 库存周转 / 追溯
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                        # Nuxt 3 前端
│   ├── pages/                       # 页面路由
│   │   ├── login.vue                # 登录页
│   │   ├── index.vue                # 工作台（Dashboard）
│   │   ├── vehicles/
│   │   │   ├── index.vue            # 车源列表（批量操作）
│   │   │   └── [id].vue             # 车源详情（6大Tab）
│   │   ├── documents/missing.vue    # 资料缺失专项页
│   │   ├── inventory-turnover/      # 库存周转分析
│   │   │   └── index.vue
│   │   ├── statistics/              # 统计报表
│   │   │   └── index.vue
│   │   └── users/                   # 用户管理（店长）
│   ├── layouts/
│   │   └── default.vue              # 侧边栏+顶栏 管理后台布局
│   ├── stores/
│   │   └── auth.ts                  # Pinia：登录态+角色权限
│   ├── plugins/
│   │   ├── api.ts                   # 全局 API Client（fetch 封装）
│   │   └── naive-ui.ts              # 按需注册 Naive UI 组件
│   ├── types/
│   │   └── index.ts                 # 所有 TypeScript 接口定义
│   ├── assets/styles/main.css       # Tailwind 入口
│   ├── nuxt.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml               # 一键启动全栈
├── .env.example                     # 环境变量模板
├── .gitignore
└── README.md
```

---

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 一键构建并启动（PostgreSQL + MinIO + 后端 + 前端）
docker-compose up -d --build

# 3. 查看日志
docker-compose logs -f backend frontend

# 4. 初始化数据库+演示账号（首次启动会自动执行，也可手动）
docker-compose exec backend python manage.py init_roles
```

访问地址：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000/api
- 后端 Swagger 文档：http://localhost:8000/api/docs/
- MinIO 控制台：http://localhost:9001 (账号/密码见 .env 中 MINIO_ACCESS_KEY / MINIO_SECRET_KEY)

### 方式二：本地开发（非 Docker）

#### 后端（Python 3.11+）

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 需要先创建 PostgreSQL 数据库
# CREATE DATABASE cardealer;
cp .env.example .env        # 按实际修改数据库/MinIO配置

python manage.py makemigrations
python manage.py migrate
python manage.py init_roles
python manage.py runserver 0.0.0.0:8000
```

#### 前端（Node.js 20+）

```bash
cd frontend
npm install
# npm install --save-dev @vicons/antd   # 首次需要补充安装
npm run dev
```

---

## 演示账号（密码统一 `123456`）

| 用户名 | 角色 | 用途 |
|-------|-----|-----|
| `admin` | 超级管理员(店长) | 系统最高权限 `admin123` |
| `manager` | 店长 | 批量审核、全流程管控、统计分析 |
| `appraiser` / `appraiser2` | 评估师 | 创建车源、录入检测整备 |
| `sales` / `sales2` | 销售 | 试驾记录、客户跟进 |
| `finance` | 金融专员 | 证件补充、金融资料上传 |

---

## 主要 API 端点

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET  /api/auth/profile` - 当前用户
- `POST /api/auth/logout` - 退出

### 车源
- `GET    /api/vehicles/` - 列表（支持多维度筛选/搜索/分页）
- `POST   /api/vehicles/` - 新建车源
- `GET    /api/vehicles/{id}/` - 详情
- `PUT    /api/vehicles/{id}/` - 更新
- `POST   /api/vehicles/{id}/change-status/` - 变更状态（记录日志）
- `POST   /api/vehicles/{id}/review/` - 发起复核
- `GET    /api/vehicles/{id}/review-records/` - 复核历史
- `GET    /api/vehicles/{id}/status-logs/` - 状态变更日志
- `POST   /api/vehicles/batch-action/` - 批量操作
- `GET    /api/vehicles/missing-documents/` - 资料缺失清单

### 检测 / 整备 / 试驾
- `GET/POST/PUT /api/inspections/{id}/` 及其子端点 `verify`
- `GET/POST/PUT /api/preparations/{id}/` 及其子端点 `verify`
- `GET/POST/PUT /api/testdrives/{id}/` 及其子端点 `verify`

### 附件文档
- `GET    /api/documents/` - 按车源/类型筛选
- `POST   /api/documents/upload/` - 上传（Multipart，自动存 MinIO）
- `GET    /api/documents/{id}/download/` - 获取预签名下载 URL
- `POST   /api/documents/{id}/verify/` - 核验
- `POST   /api/documents/{id}/close/` - 关闭/重开
- `POST   /api/documents/{id}/process-log/` - 追加处理日志
- `DELETE /api/documents/{id}/` - 删除（同步清理 MinIO）

### 统计
- `GET /api/statistics/overview/` - 工作台概览
- `GET /api/statistics/stage-distribution/` - 各阶段分布
- `GET /api/statistics/document-completion/` - 资料完整度
- `GET /api/statistics/trend-data?months=6` - 月度趋势
- `GET /api/statistics/inventory-turnover?days=90` - 库存周转明细
- `GET /api/statistics/staff-performance/` - 人员绩效
- `GET /api/statistics/vehicle-trace?vehicle_id=xxx` - 单台车全链路追溯

---

## 数据模型关系简图

```
users (用户/角色)
  ├─ 1:N → vehicles.appraiser (评估师)
  ├─ 1:N → vehicles.salesperson (销售)
  ├─ 1:N → vehicles.created_by (创建人)
  └─ 1:N → documents.uploaded_by / verified_by / closed_by

vehicles (车源档案)
  ├─ 1:1 → inspection_report (检测报告)
  │     └─ 1:N → inspection_items (检测项明细)
  ├─ 1:N → preparation_orders (整备工单)
  │     └─ 1:N → preparation_items (整备项目)
  ├─ 1:N → testdrive_records (试驾记录)
  ├─ 1:N → documents (附件文档，存储路径在 MinIO)
  ├─ 1:N → review_records (复核记录)
  └─ 1:N → status_logs (状态变更流水)
```

---

## 后续可扩展方向

1. **OCR 证件识别**：上传行驶证/登记证书后自动识别填入车源信息
2. **短信/企微通知**：资料缺失、审核结果、任务分配自动推送
3. **微信小程序端**：销售端快速查看车源、录入试驾反馈
4. **对接车商平台**：一键同步到懂车帝/汽车之家/瓜子等
5. **多门店分仓**：按门店维度隔离数据，总部大屏汇总
6. **AI 估值模型**：基于历史成交 + 公里数 + 车龄自动给出指导价区间

---

© 2026 Solo Manage Pro · MP0323 二手车门店车源上架跟进台
