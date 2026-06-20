# 景区运营门票预约漏斗报表系统

面向景区运营管理的门票预约到场漏斗分析平台。管理层查看全局总览，一线人员按负责区域查看到场率明细。

## 技术栈

| 层次 | 技术选型 |
|------|---------|
| 展示层 | Python Dash 2.x + Dash Bootstrap Components + Plotly |
| 数据加工 | Pandas 2.x |
| 数据存储 | PostgreSQL + SQLAlchemy 2.x ORM |
| 异步任务 | Celery 5.x + Redis Broker |
| 权限控制 | Flask Session + werkzeug 密码哈希 |

## 功能模块

### 分析看板
- **到场状态分布**：正常 / 预警 / 严重 的时段占比（环形图）
- **提醒名单漏斗**：预约→提醒→确认→检票→到区域→消费（漏斗图）
- **日历时段排行**：区域×时段 到场人数热力图
- **容量规则变化**：按日期时段的容量上限趋势，区分 normal/holiday/weather/emergency

### 数据加工
- 三源数据独立导入 + 批次管理（记录批次号、来源、记录数、状态、刷新时间）
  1. 摄像头统计（行人、估算游客、密度）
  2. 闸机检票（预约、票种、进/出、状态）
  3. 商户流水（消费金额、类别、关联人数）
- 合并加工：按日期×时段×区域维度聚合，计算到场率、转化率、到达区域率
- 异常识别：容量预警、到场率偏低、时段冲突突增 → 写入 remark 注释字段

### 权限与视图
| 角色 | 视图 | 权限 |
|------|------|------|
| 管理层 (management) | 总览页 | 所有区域、8 大指标、批次日志 |
| 一线人员 (frontline) | 明细页 | 仅 assigned_zone 范围内的到场率、待提醒、明细表格（可导出 Excel） |

## 快速开始

### 1. 环境准备
- PostgreSQL 12+
- Redis 6+（Celery 消息代理）
- Python 3.10+

### 2. 安装与初始化

```bash
cp .env.example .env            # 修改数据库/Redis 连接
bash start.sh install           # 安装依赖
bash start.sh init-db           # 建表 + 创建默认用户
bash start.sh mock-data         # 生成 14 天模拟数据（可选）
```

### 3. 启动服务

```bash
# 终端 1: Celery Worker
bash start.sh worker

# 终端 2: Dash 仪表盘
bash start.sh dashboard
```

访问 http://localhost:8050

默认账号：
- 管理层：`admin` / `admin123`
- 一线人员：`staff` / `staff123`（主入口区,核心景区A）
- 一线人员：`staff2` / `staff123`（山顶观景区,湖滨休闲区）

## 项目结构

```
MP0391/
├── app/                          Dash 展示层
│   ├── app.py                    主入口、路由、回调
│   ├── auth.py                   登录/权限上下文
│   ├── data_service.py           数据聚合查询服务
│   ├── charts.py                 Plotly 图表封装
│   └── pages/
│       ├── login_view.py         登录页
│       ├── management_view.py    管理层总览页
│       ├── frontline_view.py     一线人员明细页
│       └── common.py             共用组件（筛选栏/KPI卡）
├── models/                       SQLAlchemy ORM 模型
│   ├── database.py               引擎/会话
│   ├── batch.py                  数据批次
│   ├── camera.py                 摄像头统计
│   ├── gate.py                   闸机记录
│   ├── merchant.py               商户流水
│   ├── funnel.py                 预约漏斗（核心宽表）
│   ├── capacity.py               容量规则
│   └── user.py                   用户账户
├── tasks/                        Celery 任务
│   ├── celery_app.py             应用实例
│   ├── utils.py                  批次号生成
│   └── data_import.py            三源导入 + 合并加工
├── scripts/
│   ├── init_db.py                初始化数据库
│   └── generate_mock_data.py     模拟数据生成
├── config.py                     全局配置
├── requirements.txt
├── .env.example
└── start.sh                      启动脚本
```

## 数据批次管理规范

每次数据导入都会在 `data_batches` 表写入一条记录：
- `batch_no`：`SOURCE-YYYYMMDDHHMMSS-uuid8`，例如 `CAMERA-20260620143000-a1b2c3d4`
- `source`：`camera` / `gate` / `merchant` / `merge`
- `status`：`pending` → `processing` → `completed` / `failed`
- `started_at` / `completed_at` / `refresh_time`：自动更新
- 明细记录通过 `batch_id` 外键关联，支持完整溯源

## 扩展建议

1. **定时调度**：在 `celery_app.conf.beat_schedule` 配置每小时/每日自动拉取摄像头、闸机、商户数据
2. **真实接入**：继承 `tasks.data_import` 中的三个 import 任务，对接景区实际 API / Kafka / 共享文件
3. **告警推送**：在 `merge_to_funnel` 中识别 `arrival_status=critical` 或 `remark` 非空时触发企业微信/短信
4. **角色扩展**：在 `UserAccount.role` 增加 `auditor`、`finance` 等，在 `data_service` 中按角色裁剪字段
