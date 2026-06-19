# 景区运营导览跟进台 API

## 技术栈
- 后端：FastAPI + SQLAlchemy + PostgreSQL + Celery + Redis
- 前端：React + TanStack Router

## 后端启动

### 1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 环境变量
复制 `.env.example` 为 `.env`，修改配置
```bash
cp .env.example .env
```

### 3. 启动服务
```bash
# 开发模式
uvicorn app.main:app --reload --port 8000
```

### 4. 启动 Celery
```bash
# Worker
celery -A app.core.celery_app.celery_app worker --loglevel=info -P solo

# Flower 监控（可选）
celery -A app.core.celery_app.celery_app flower
```

### 5. 文档
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 权限角色
| 角色 | 值 | 说明 |
|---|---|---|
| 游客 | tourist | 查看公开信息 |
| 票务员 | ticket_clerk | 票务、座位核对 |
| 巡场员 | patrol | 热力点位核对、异常上报 |
| 运营 | operation | 所有运营管理 |
| 管理员 | admin | 系统管理 |

## 功能模块
1. **导览路线**
2. **热力点位** - 支持批量更新、CSV导入
3. **导览内容** - 文本/音频/视频，支持复核
4. **演出管理** - 演出+场次+座位
5. **商户合同** - 支持附件
6. **票务** - 票务+二消
7. **异常记录** - 演出取消等，可回原始记录
8. **统计分析** - 二消转化追踪到具体单据
9. **审计日志** - 全操作留痕，处理痕迹可溯
