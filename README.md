# 法律服务文书归档跟进台

基于 **React + TanStack Router + FastAPI + PostgreSQL + Celery** 的全栈法律文书管理平台。

## 功能特性

### 按日常处理节奏的工作流

**流程：草稿 → 互动中 → 风险检测完成 → 版本核对完成 → 待审核 → 已通过/已退回**

### 核心模块

| 模块 | 说明 |
|------|------|
| 💬 **互动记录** | 客户电话/邮件/会议、内部讨论、修改备注等全量记录，时间线展示 |
| ⚠️ **风险词检测** | 自动扫描27个风险关键词，标注严重等级和处理建议 |
| 📑 **版本管理** | 每次编辑自动创建新版本，支持版本对比和一致性核对 |
| 🏷️ **素材标签** | 审核环节自动沉淀标签建议，后续追踪 |
| ✅ **审核流程** | 审核通过/退回，保留完整审核意见及沟通过程 |
| 📈 **管理统计** | 内容转化趋势漏斗、类型分布、处理人工作量、风险分布 |

### 角色权限控制

- **admin/manager 管理员/经理**：全部权限 + 统计报表 + 指派处理人
- **lawyer/assistant 律师/助理**：仅查看/处理自己负责的文书
- **auditor 审核员**：审核台 + 审核权限
- 列表按角色自动过滤各自的待办范围

### 审核退回处理

- 列表中退回文书 **红色高亮 + 闪烁徽标
- 顶部醒目标注「已被退回N次」+ 最后审核意见
- 详情页保留完整沟通过程时间线和复核意见

## 快速开始

### 一键启动（推荐）

```bash
docker-compose up -d --build
```

访问 http://localhost:3000

### 预置账号（点击登录页快速登录）

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 经理 | manager | manager123 |
| 律师 | lawyer | lawyer123 |
| 助理 | assistant | assistant123 |
| 审核员 | auditor | auditor123 |

### 本地开发

**后端：**

```bash
cd backend
pip install -r requirements.txt
export POSTGRES_SERVER=localhost
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Celery Worker：**

```bash
cd backend
celery -A app.services.celery_app worker --loglevel=info --pool=solo
```

**前端：**

```bash
cd frontend
npm install
npm run dev
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite |
| 路由 | TanStack Router (文件路由+强类型 |
| 状态 | Zustand |
| 图表 | ECharts |
| 后端 | FastAPI + Pydantic V2 |
| ORM | SQLAlchemy 2.0 |
| 数据库 | PostgreSQL 16 |
| 异步任务 | Celery + Redis |
| 部署 | Docker Compose |
