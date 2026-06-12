# 连锁咖啡报损复核跟进台

Coffee Chain Loss Review and Tracking System

## 项目概述

本系统是一个专为连锁咖啡企业设计的报损复核跟进管理平台，实现了从报损申报、复核、审批到统计分析的全流程管理。系统采用前后端分离架构，支持管理层和一线人员的角色权限控制，提供损耗率趋势分析和异常预警功能。

## 技术栈

### 后端
- **框架**: FastAPI 0.109.0
- **数据库**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **数据迁移**: Alembic
- **任务队列**: Celery 5.3.6 + Redis
- **认证**: JWT (python-jose)
- **密码加密**: passlib + bcrypt

### 前端
- **框架**: React 18.2.0 + TypeScript
- **路由**: TanStack Router 1.16.0
- **状态管理**: Zustand 4.4.7
- **数据请求**: TanStack Query 5.17.19 + Axios
- **UI组件**: Ant Design 5.12.8
- **图表**: Recharts 2.10.3
- **构建工具**: Vite 5.0.8
- **样式**: Tailwind CSS 3.4.0

## 核心功能

### 业务流程
1. **报损申报**: 一线人员创建报损单，填写报损类别、金额、数量等信息
2. **复核处理**: 管理人员或门店负责人进行复核，填写复核意见，核对责任门店和成本金额
3. **跟进处理**: 如需跟进，系统自动创建待办事项，责任人跟进整改
4. **审批处理**: 管理层进行最终审批
5. **统计分析**: 管理层查看损耗率趋势、门店排名、异常分析等

### 权限控制
- **管理层 (manager)**: 
  - 查看所有门店的报损数据
  - 复核、审批报损单
  - 查看统计分析报表
  - 门店管理、用户管理
  
- **一线人员 (staff)**:
  - 仅查看所在门店的报损数据
  - 创建和提交本店的报损单
  - 处理分配给自己的待办事项
  - 参与沟通讨论

### 异常检测
系统自动检测以下异常情况，并在列表中用红色背景突出显示：
- **高损耗率**: 门店月损耗率超过阈值（默认5%）
- **大额报损**: 单笔报损金额超过5000元
- **高频报损**: 单店一周内报损超过3单
- **可疑模式**: 系统检测到的异常报损模式

## 项目结构

```
MP0008/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI 主入口
│   │   ├── config.py          # 配置管理
│   │   ├── database.py        # 数据库连接
│   │   ├── security.py        # 认证与权限
│   │   ├── celery_app.py      # Celery 配置
│   │   ├── models.py          # SQLAlchemy 模型
│   │   ├── schemas.py         # Pydantic 模型
│   │   ├── tasks.py           # Celery 异步任务
│   │   └── routers/           # API 路由
│   │       ├── __init__.py
│   │       ├── auth.py        # 认证接口
│   │       ├── stores.py      # 门店管理接口
│   │       ├── loss_reports.py # 报损单接口
│   │       ├── reviews.py     # 复核接口
│   │       ├── approvals.py   # 审批接口
│   │       ├── communications.py # 沟通记录接口
│   │       └── statistics.py  # 统计分析接口
│   ├── requirements.txt       # Python 依赖
│   ├── .env.example           # 环境变量示例
│   ├── start.sh               # Linux/Mac 启动脚本
│   ├── start.bat              # Windows 启动脚本
│   ├── start_celery.sh        # Celery Worker 启动脚本
│   └── start_celery_beat.sh   # Celery Beat 启动脚本
│
└── frontend/                   # 前端应用
    ├── src/
    │   ├── main.tsx           # React 入口
    │   ├── App.tsx            # 主应用组件
    │   ├── router.tsx         # TanStack Router 配置
    │   ├── index.css          # 全局样式
    │   ├── types/
    │   │   └── index.ts       # TypeScript 类型定义
    │   ├── api/
    │   │   ├── client.ts      # Axios 实例
    │   │   └── index.ts       # API 接口封装
    │   ├── store/
    │   │   └── auth.ts        # 认证状态管理
    │   └── pages/             # 页面组件
    │       ├── Login.tsx          # 登录页
    │       ├── Dashboard.tsx      # 工作台
    │       ├── LossReportList.tsx # 报损单列表
    │       ├── LossReportDetail.tsx # 报损单详情
    │       ├── LossReportCreate.tsx # 新建报损单
    │       ├── ReviewPage.tsx     # 复核管理
    │       ├── ApprovalPage.tsx   # 审批管理
    │       ├── Statistics.tsx     # 统计分析
    │       └── StoreManagement.tsx # 门店管理
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── start.sh               # Linux/Mac 启动脚本
    └── start.bat              # Windows 启动脚本
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 数据库准备

1. 创建 PostgreSQL 数据库：
```sql
CREATE DATABASE coffee_loss;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE coffee_loss TO postgres;
```

2. 确保 Redis 服务已启动：
```bash
redis-server
```

### 后端启动

**Linux/Mac:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
cd backend
start.bat
```

或手动执行：
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Windows: copy .env.example .env
# 编辑 .env 文件，配置数据库连接
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 启动 Celery (可选，用于异步任务)

```bash
# 启动 Worker
cd backend
./start_celery.sh

# 启动 Beat (定时任务)
cd backend
./start_celery_beat.sh
```

### 前端启动

**Linux/Mac:**
```bash
cd frontend
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
cd frontend
start.bat
```

或手动执行：
```bash
cd frontend
npm install
npm run dev
```

### 初始化测试数据

启动后端服务后，访问 API 初始化测试数据：
```bash
curl -X POST http://localhost:8000/api/auth/init-data
```

或在前端登录页点击「初始化测试数据」按钮。

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理层 | manager | 123456 |
| 一线人员 | staff1 | 123456 |
| 一线人员 | staff2 | 123456 |

### 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 业务流程说明

### 报损处理流程

```
创建报损单
    ↓
提交复核 → 待复核状态
    ↓
复核处理:
  ├─ 确认无误 → 已复核 → 提交审批 → 待审批 → 审批通过/驳回
  ├─ 需要跟进 → 已复核 → 创建待办 → 跟进中 → 完成跟进 → 提交审批
  └─ 存在争议 → 已复核 → 沟通协商 → 重新复核
    ↓
审批通过 → 已通过 → 计入统计 → 关闭
    ↓
审批驳回 → 已驳回 → 重新提交
```

### 复核流程要点

1. **先填复核意见**: 复核人员必须先填写详细的复核意见，说明损耗原因、责任认定
2. **核对责任门店**: 确认报损单归属的责任门店是否正确
3. **核对成本金额**: 核实报损金额是否准确，可调整为核实后的金额
4. **选择复核结果**:
   - 确认无误：数据准确，直接进入审批
   - 需要跟进：存在问题，创建待办事项给责任人
   - 存在争议：数据存疑，需要进一步沟通核实

### 异常处理

- 异常报损单在列表中以红色背景突出显示
- 详情页显示异常类型标签
- 统计分析页提供异常类型分布图
- Celery 定时任务每小时自动检测异常

## API 接口说明

### 认证接口
- `POST /api/auth/login` - 登录获取 Token
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 报损单接口
- `GET /api/loss-reports` - 获取报损单列表（支持筛选）
- `POST /api/loss-reports` - 创建报损单
- `GET /api/loss-reports/{id}` - 获取报损单详情
- `PUT /api/loss-reports/{id}` - 更新报损单
- `POST /api/loss-reports/{id}/submit` - 提交复核
- `POST /api/loss-reports/{id}/transition` - 状态流转

### 复核接口
- `POST /api/reviews` - 创建复核记录
- `GET /api/reviews` - 获取复核列表

### 审批接口
- `POST /api/approvals` - 创建审批记录
- `GET /api/approvals` - 获取审批列表
- `POST /api/approvals/{id}/submit-for-approval` - 提交审批

### 沟通记录接口
- `GET /api/communications` - 获取沟通记录
- `POST /api/communications` - 发送消息

### 统计分析接口
- `GET /api/statistics/dashboard` - 获取工作台统计数据
- `GET /api/statistics/loss-trend` - 获取损耗趋势
- `GET /api/statistics/store-ranking` - 获取门店排名
- `GET /api/statistics/threshold` - 获取损耗率阈值

## 配置说明

### 环境变量 (.env)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | 数据库连接 | postgresql://postgres:password@localhost:5432/coffee_loss |
| REDIS_URL | Redis 连接 | redis://localhost:6379/0 |
| SECRET_KEY | JWT 密钥 | your-secret-key-here |
| ALGORITHM | 加密算法 | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token 有效期 | 1440 (24小时) |
| CELERY_BROKER_URL | Celery Broker | redis://localhost:6379/0 |
| CELERY_RESULT_BACKEND | Celery 结果后端 | redis://localhost:6379/0 |
| LOSS_RATE_THRESHOLD | 损耗率阈值 | 5.0 (%) |

### 前端代理配置

在 `vite.config.ts` 中已配置 API 代理：
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

## 核心特性

### 1. 角色权限控制
- 基于 JWT 的身份认证
- 路由级权限控制（TanStack Router beforeLoad）
- 按钮级权限控制（根据角色显隐）
- 数据级权限控制（一线人员仅看本店数据）

### 2. 异常智能检测
- 实时异常检测（创建报损单时）
- 定时异常扫描（Celery 每小时）
- 多维度异常判定（损耗率、金额、频率）
- 异常可视化标记（列表高亮、详情标签）

### 3. 完整处理流程
- 状态机驱动的流程管控
- 每步操作留痕（创建人、时间、意见）
- 沟通记录完整保留
- 审批历史可追溯

### 4. 数据可视化
- 损耗率趋势图表
- 门店损耗率排名
- 报损类别占比分析
- 异常类型分布统计

### 5. 待办事项驱动
- 复核后自动创建待办
- 待办逾期自动提醒
- 个人待办专属视图

## 开发说明

### 后端开发
```bash
cd backend
source venv/bin/activate

# 代码格式化
pip install black
black app/

# 类型检查
pip install mypy
mypy app/
```

### 前端开发
```bash
cd frontend

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 生产部署建议

### 后端部署
- 使用 Gunicorn 作为 ASGI 服务器
- 使用 Nginx 作为反向代理
- 配置 PostgreSQL 连接池
- Redis 配置持久化
- 使用 systemd 管理服务进程

### 前端部署
- 执行 `npm run build` 构建静态文件
- 使用 Nginx 托管静态资源
- 配置 Gzip 压缩
- 配置缓存策略

### 安全加固
- 修改默认的 SECRET_KEY
- 配置 HTTPS
- 限制密码尝试次数
- 定期轮换数据库密码
- 开启 SQL 注入防护

## 许可证

MIT License
