# Solo Management System - 开发指南

## 项目概述

Solo Management System 是一个全栈案件管理系统，包含前端 React 应用和后端 FastAPI 服务。

## 项目结构说明

```
MP0451/
├── backend/                    # 后端服务（FastAPI）
│   ├── app/
│   │   ├── config/            # 配置管理
│   │   ├── db/                # 数据库连接
│   │   ├── integrations/      # 外部系统集成
│   │   ├── middleware/        # 中间件
│   │   ├── models/            # ORM 模型
│   │   ├── routers/           # API 路由
│   │   ├── schemas/           # Pydantic 数据模型
│   │   ├── services/          # 业务逻辑层
│   │   └── utils/             # 工具函数
│   ├── duckdb/                # DuckDB 分析视图
│   ├── migrations/            # 数据库迁移脚本
│   ├── main.py                # 应用入口
│   ├── requirements.txt       # Python 依赖
│   ├── start.sh               # 启动脚本
│   ├── .env.example           # 环境变量示例
│   └── README.md              # 后端开发文档
├── src/                        # 前端源代码（React + TypeScript）
│   ├── api/                   # API 接口定义
│   ├── components/            # React 组件
│   ├── hooks/                 # 自定义 Hooks
│   ├── lib/                   # 工具库
│   ├── pages/                 # 页面组件
│   ├── router/                # 路由配置
│   ├── store/                 # 状态管理
│   ├── types/                 # TypeScript 类型定义
│   ├── utils/                 # 工具函数
│   └── main.tsx               # 应用入口
├── public/                     # 静态资源
├── index.html                  # HTML 入口
├── package.json                # npm 依赖
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind CSS 配置
├── .env.development            # 开发环境变量
└── DEVELOPMENT.md              # 本文档
```

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **路由**: React Router DOM 7
- **状态管理**: Zustand
- **UI 框架**: Tailwind CSS 3
- **图表**: ECharts + echarts-for-react
- **HTTP 客户端**: Axios
- **图标**: Lucide React

### 后端
- **框架**: FastAPI 0.138+
- **ASGI 服务器**: Uvicorn
- **ORM**: SQLAlchemy 2.0 (Async)
- **主数据库**: PostgreSQL
- **分析数据库**: DuckDB
- **认证**: JWT (python-jose)
- **任务队列**: Celery + Redis
- **数据处理**: Pandas, Polars

---

## 前端开发指南

### 环境要求
- Node.js 18+
- npm 9+

### 快速开始

#### 1. 安装依赖
```bash
npm install
```

#### 2. 配置环境变量
项目已预置 `.env.development` 配置文件，包含以下内容：
```dotenv
VITE_APP_TITLE=Solo Management System
VITE_APP_ENV=development
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK=true
VITE_MOCK_DELAY=500
```

#### 3. 启动开发服务器
```bash
npm run dev
```
服务将在 http://localhost:5173 启动。

#### 4. 代码检查
```bash
# TypeScript 类型检查
npm run check

# ESLint 代码检查
npm run lint
```

#### 5. 构建生产版本
```bash
npm run build
```

### 代理配置
Vite 开发服务器已配置代理，将 `/api` 和 `/health` 请求转发到后端服务：
```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    '/health': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### 前端目录说明

#### `src/api/` - API 接口
- `client.ts` - Axios 客户端配置，包含请求/响应拦截器、Token 自动刷新
- `endpoints/` - 各模块 API 接口定义
  - `auth.ts` - 认证相关接口
  - `report.ts` - 报表相关接口
  - `export.ts` - 导出相关接口
  - `share.ts` - 分享相关接口

#### `src/components/` - 组件
- `charts/` - 图表组件（仪表板可视化）
- `layout/` - 布局组件（Header、Sidebar、Layout）
- `ui/` - 基础 UI 组件（Button、Card、Table 等）

#### `src/pages/` - 页面
- `Login.tsx` - 登录页面
- `Dashboard.tsx` - 仪表板主页
- `CaseDetail.tsx` - 案件详情页
- `ExportCenter.tsx` - 导出中心
- `ShareManage.tsx` - 分享管理
- `ShareAccess.tsx` - 分享访问页

#### `src/hooks/` - 自定义 Hooks
- `useChartData.ts` - 图表数据获取
- `usePermission.ts` - 权限检查
- `useTheme.ts` - 主题切换

#### `src/store/` - 状态管理
- `authStore.ts` - 认证状态管理（使用 Zustand）

### Mock 数据使用

项目支持 Mock 数据模式，方便在后端不可用时进行前端开发。

#### 启用 Mock
在 `.env.development` 中设置：
```dotenv
VITE_ENABLE_MOCK=true
```

#### Mock 数据位置
Mock 数据定义在 `src/utils/mockData.ts`，包含：
- 测试用户数据
- 仪表板统计数据
- 案件列表数据
- 发票数据
- 图表趋势数据

#### 使用 Mock 数据
在组件中根据 `VITE_ENABLE_MOCK` 环境变量决定使用真实 API 还是 Mock 数据：
```typescript
import { mockDashboardData } from '@/utils/mockData';

const fetchData = async () => {
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    setData(mockDashboardData);
  } else {
    const data = await reportApi.getDashboard();
    setData(data);
  }
};
```

#### 延迟模拟
通过 `VITE_MOCK_DELAY` 配置模拟网络延迟（毫秒）：
```dotenv
VITE_MOCK_DELAY=500  # 500ms 延迟
```

### 代码规范

#### 导入路径别名
使用 `@/` 作为 `src/` 目录的别名：
```typescript
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
```

#### 命名规范
- 组件文件：`PascalCase.tsx`
- 工具函数：`camelCase.ts`
- 类型定义：`PascalCase`
- CSS 类名：`kebab-case`（Tailwind）

---

## 后端开发指南

### 环境要求
- Python 3.10+
- PostgreSQL 13+
- Redis 6+（可选，用于限流和缓存）

### 快速开始

#### 1. 创建虚拟环境
```bash
cd backend
python -m venv venv
source venv/bin/activate
```

#### 2. 安装依赖
```bash
pip install -r requirements.txt
```

> **注意**: `mailparser` 包在 Python 3.14+ 上可能不可用，已在 requirements.txt 中标记为可选。如需邮件解析功能，请使用 Python 3.11 或检查 mailparser 最新版本。

#### 3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，配置数据库连接等信息。

#### 4. 启动服务
使用启动脚本：
```bash
./start.sh
```

或手动启动：
```bash
export PYTHONPATH=$(pwd)
export APP_ENV=development
export DEBUG=true
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 5. 访问 API 文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 后端目录说明

#### `app/config/` - 配置
- `settings.py` - 应用配置，使用 pydantic-settings 从环境变量加载

#### `app/db/` - 数据库
- `database.py` - PostgreSQL 连接和会话管理
- `duckdb_client.py` - DuckDB 连接和查询管理

#### `app/middleware/` - 中间件
- `auth.py` - JWT 认证中间件
- `permission.py` - 权限检查中间件
- `rate_limit.py` - 请求限流中间件

#### `app/models/` - ORM 模型
- `user.py` - 用户模型
- `case.py` - 案件模型
- `invoice.py` - 发票模型
- `approval_node.py` - 审批节点模型
- `payment_schedule.py` - 回款计划模型
- `share_link.py` - 分享链接模型

#### `app/routers/` - API 路由
- `auth.py` - 认证接口（登录、刷新、登出）
- `report.py` - 报表接口（仪表板、趋势分析）
- `share.py` - 分享接口（创建、管理分享链接）
- `export.py` - 导出接口（Excel、PDF 导出）
- `data_sync.py` - 数据同步接口（邮件、日历等）

#### `app/schemas/` - Pydantic 模型
定义请求和响应的数据结构，用于数据验证和序列化。

#### `app/services/` - 业务逻辑层
处理核心业务逻辑，路由层调用服务层完成业务处理。

### API 认证

所有需要认证的接口需要在请求头中携带 JWT Token：
```http
Authorization: Bearer <access_token>
```

#### 测试账号
数据库初始化后，可使用以下账号登录：

| 邮箱 | 密码 | 角色 | 权限 |
|------|------|------|------|
| partner@example.com | password123 | partner | 全部权限 |
| lawyer@example.com | password123 | lawyer | 案件管理、导出 |
| assistant@example.com | password123 | assistant | 数据录入、导出 |
| client@example.com | password123 | client | 仅查看授权数据 |

### 角色权限说明

| 功能 | partner | lawyer | assistant | client |
|------|---------|--------|-----------|--------|
| 查看仪表板 | ✅ | ✅ | ✅ | ✅ |
| 案件管理 | ✅ | ✅ | ❌ | ❌ |
| 数据导出 | ✅ | ✅ | ✅ | ❌ |
| 分享管理 | ✅ | ✅ | ❌ | ❌ |
| 数据同步 | ✅ | ✅ | ✅ | ❌ |
| 用户管理 | ✅ | ❌ | ❌ | ❌ |

---

## 数据库初始化步骤

### 1. 创建 PostgreSQL 数据库
```sql
-- 以 postgres 用户登录
psql -U postgres

-- 创建数据库
CREATE DATABASE solo_management;

-- （可选）创建专用用户
CREATE USER solo_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE solo_management TO solo_user;
```

### 2. 执行数据库迁移脚本
```bash
cd backend

# 执行初始化脚本
psql -U postgres -d solo_management -f migrations/001_init_schema.sql

# 执行测试数据脚本
psql -U postgres -d solo_management -f migrations/002_seed_data.sql

# 执行 DuckDB 视图脚本
psql -U postgres -d solo_management -f migrations/003_duckdb_views.sql
```

### 3. 脚本说明

#### `001_init_schema.sql`
创建所有数据表：
- `users` - 用户表
- `cases` - 案件表
- `invoices` - 发票表
- `invoice_items` - 发票明细表
- `contract_attachments` - 合同附件表
- `approval_nodes` - 审批节点表
- `payment_schedules` - 回款计划表
- `email_attachments` - 邮件附件表
- `share_links` - 分享链接表
- `data_sync_logs` - 数据同步日志表

#### `002_seed_data.sql`
插入测试数据：
- 4 个测试用户（不同角色）
- 示例案件数据
- 示例发票数据
- 示例审批节点数据
- 示例回款计划数据

#### `003_duckdb_views.sql`
创建 DuckDB 分析视图：
- 案件财务汇总视图
- 回款趋势视图
- 审批异常分析视图

### 4. 配置数据库连接
在 `backend/.env` 中配置数据库连接：
```dotenv
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/solo_management
SYNC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/solo_management
```

### 5. 初始化 DuckDB
首次启动后端服务时，系统会自动：
1. 创建 `data/` 目录
2. 初始化 `data/olap.duckdb` 数据库文件
3. 从 PostgreSQL 同步基础数据

如需手动同步，可调用接口：
```bash
curl -X POST http://localhost:8000/api/data-sync/duckdb \
  -H "Authorization: Bearer <token>"
```

---

## Mock 数据使用说明

### 前端 Mock

#### 启用/禁用 Mock
编辑 `.env.development`：
```dotenv
# 启用 Mock 数据
VITE_ENABLE_MOCK=true

# 禁用 Mock 数据（使用真实后端）
VITE_ENABLE_MOCK=false
```

#### Mock 数据来源
所有 Mock 数据定义在 `src/utils/mockData.ts`，包括：
- `mockUser` - 当前登录用户信息
- `mockTokens` - 认证 Token
- `mockDashboardData` - 仪表板统计数据
- `mockCases` - 案件列表数据
- `mockInvoices` - 发票数据
- `mockLawyers` - 律师列表
- `generateReconciliationTrendData()` - 生成回款趋势数据
- `generateInvoiceDetailData()` - 生成发票明细数据

#### 自定义 Mock 数据
如需修改或添加 Mock 数据，编辑 `src/utils/mockData.ts`：
```typescript
export const mockCases: Case[] = [
  {
    id: '1',
    case_no: '(2024)京民初字第000001号',
    name: '张某合同纠纷案',
    // ... 其他字段
  },
  // 更多数据...
];
```

### 后端 Mock

后端部分接口也支持 Mock 模式，主要用于外部系统集成测试：
- 邮件同步 Mock
- 日历同步 Mock
- 案件系统同步 Mock

在 `backend/app/integrations/` 中的客户端类支持 `use_mock` 参数。

---

## 常见问题解答

### 前端相关

#### Q: 启动前端时报 "Cannot find module '@/...'"
A: 确保 `tsconfig.json` 中正确配置了路径别名：
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Q: API 请求返回 404
A: 检查以下几点：
1. 后端服务是否启动（默认端口 8000）
2. `vite.config.ts` 中的代理配置是否正确
3. 环境变量 `VITE_API_BASE_URL` 是否正确

#### Q: 如何启用/禁用 Mock 数据
A: 修改 `.env.development` 中的 `VITE_ENABLE_MOCK` 值，然后重启开发服务器。

#### Q: TypeScript 类型检查失败
A: 运行 `npm run check` 查看具体错误，通常是类型不匹配或缺少类型定义。

### 后端相关

#### Q: 数据库连接失败
A: 检查以下几点：
1. PostgreSQL 服务是否启动
2. `.env` 中的 `DATABASE_URL` 配置是否正确
3. 数据库是否已创建，用户是否有权限

#### Q: 依赖安装失败
A: 尝试升级 pip 后重新安装：
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Q: mailparser 安装失败
A: `mailparser` 可能不支持最新的 Python 版本（如 3.14+）。可以：
1. 使用 Python 3.11 版本
2. 注释掉 `requirements.txt` 中的 `mailparser`（邮件解析功能将不可用）
3. 等待 mailparser 发布支持新版本 Python 的更新

#### Q: DuckDB 文件损坏
A: 删除 DuckDB 数据库文件并重新同步：
```bash
cd backend
rm -f data/olap.duckdb
# 重启后端服务或调用同步接口
```

#### Q: JWT Token 无效
A: 检查以下几点：
1. Token 是否已过期（默认 24 小时有效期）
2. 前后端的 `JWT_SECRET_KEY` 是否一致
3. 请求头格式是否正确：`Authorization: Bearer <token>`

### 通用问题

#### Q: 如何同时启动前后端
A: 打开两个终端窗口：

**终端 1 - 启动后端**:
```bash
cd backend
./start.sh
```

**终端 2 - 启动前端**:
```bash
npm run dev
```

#### Q: 如何修改端口
A: 
- 前端端口：修改 `vite.config.ts` 中的 `server.port`
- 后端端口：修改 `backend/start.sh` 中的 `PORT` 变量，或启动时指定：
  ```bash
  PORT=8080 ./start.sh
  ```

#### Q: 如何查看 API 文档
A: 启动后端服务后访问：
- Swagger UI (交互式): http://localhost:8000/docs
- ReDoc (文档格式): http://localhost:8000/redoc

#### Q: 如何重置数据库
A: 
```bash
# 删除数据库
psql -U postgres -c "DROP DATABASE solo_management;"

# 重新创建数据库
psql -U postgres -c "CREATE DATABASE solo_management;"

# 重新执行迁移脚本
cd backend
psql -U postgres -d solo_management -f migrations/001_init_schema.sql
psql -U postgres -d solo_management -f migrations/002_seed_data.sql

# 删除 DuckDB 文件
rm -f data/olap.duckdb
```

---

## 快速启动命令汇总

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 3. 数据库初始化（需要先创建数据库）
cd backend
psql -U postgres -d solo_management -f migrations/001_init_schema.sql
psql -U postgres -d solo_management -f migrations/002_seed_data.sql

# 4. 启动后端（新终端）
cd backend
./start.sh

# 5. 启动前端（新终端）
npm run dev

# 6. 访问应用
# 前端: http://localhost:5173
# 后端 API: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

---

## 开发工作流

1. **开发新功能**
   - 后端：在 `app/routers/` 添加路由，在 `app/services/` 实现业务逻辑
   - 前端：在 `src/pages/` 添加页面，在 `src/api/endpoints/` 添加 API 调用

2. **代码检查**
   ```bash
   npm run check  # TypeScript 检查
   npm run lint   # ESLint 检查
   ```

3. **提交代码前**
   - 确保所有测试通过
   - 运行类型检查和 lint 检查
   - 更新相关文档

---

如有其他问题，请查看各模块的 README 或提交 Issue。
