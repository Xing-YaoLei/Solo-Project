# 青少年培训试听预约协同台

基于 Laravel 11 + Inertia + Vue 3 + MySQL + Horizon 构建的青少年培训试听预约管理系统。

## 功能特性

### 统一入口
- 工作台首页集成预约列表、状态筛选、快速操作
- 日历视图按日期和时段展示所有预约
- 预约详情页聚合所有相关信息

### 预约管理
- 新建/编辑预约，支持学员信息、来源渠道、责任人等
- **同一屏展示日历时段、容量规则、冲突检测**
- 容量预警和已满提示

### 冲突检测
- 时段容量冲突检测
- 手机号重复检测
- 学员姓名重复检测
- 冲突记录管理和解决追踪

### 状态管理
- **分离状态池**：待处理、补资料、升级复核、已完成、已关闭
- 状态流转校验，不允许非法状态变更
- 每一次状态变更都有审计日志

### 跟进与复盘
- 多种跟进方式（电话、微信、到访、其他）
- 跟进结果驱动状态变更
- 复盘标签和备注
- 记录关闭后仍可查看详情核对

### 复核流程
- 升级复核机制
- **同一页可追溯所有操作依据**（审计日志）
- 操作人、时间、变更内容完整记录

### 数据统计
- **到场率**统计
- **来源渠道**分布分析
- **责任人**绩效统计
- **复盘标签**分布
- 每日趋势和时段统计

### 系统管理
- 时段配置
- 容量规则（默认、特殊日期、节假日）
- Horizon 队列管理

## 技术栈

- **后端**: Laravel 11
- **前端**: Vue 3 + Inertia.js
- **UI**: Tailwind CSS
- **数据库**: MySQL
- **队列**: Laravel Horizon + Redis

## 项目结构

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php      # 工作台
│   │   ├── TrialBookingController.php   # 预约管理
│   │   ├── CalendarController.php       # 日历视图
│   │   ├── StatisticsController.php     # 数据统计
│   │   └── TimeSlotController.php       # 时段配置
│   └── Kernel.php
├── Models/
│   ├── TrialBooking.php        # 试听预约（核心）
│   ├── Course.php              # 课程
│   ├── TimeSlot.php            # 时段
│   ├── CapacityRule.php        # 容量规则
│   ├── BookingFollowUp.php     # 跟进记录
│   ├── BookingConflict.php     # 冲突记录
│   ├── AuditLog.php            # 审计日志
│   └── User.php
├── Services/
│   ├── BookingService.php      # 预约业务逻辑
│   ├── AuditService.php        # 审计服务
│   └── StatisticsService.php   # 统计服务
├── Jobs/
│   ├── DetectBookingConflicts.php   # 冲突检测任务
│   └── SendBookingReminder.php      # 预约提醒任务
└── Console/
    └── Kernel.php               # 调度任务

resources/
├── js/
│   ├── Pages/
│   │   ├── Dashboard/Index.vue       # 工作台
│   │   ├── Bookings/
│   │   │   ├── Index.vue             # 预约列表
│   │   │   ├── Create.vue            # 新建预约
│   │   │   ├── Edit.vue              # 编辑预约
│   │   │   └── Show.vue              # 预约详情
│   │   ├── Calendar/Index.vue        # 日历视图
│   │   ├── Statistics/Index.vue      # 数据统计
│   │   └── TimeSlots/
│   │       ├── Index.vue             # 时段列表
│   │       ├── Create.vue            # 新建时段
│   │       └── Edit.vue              # 编辑时段
│   └── Layouts/AppLayout.vue
└── views/app.blade.php

database/
├── migrations/          # 数据库迁移
└── seeders/
    └── DatabaseSeeder.php   # 种子数据
```

## 状态设计

### 状态池分离
| 池子 | 包含状态 | 说明 |
|------|---------|------|
| 待处理 | pending, confirmed | 日常跟进处理 |
| 补资料 | need_info | 资料不全，单独池子 |
| 升级复核 | escalated | 需上级复核，单独池子 |
| 已完成 | completed, cancelled | 已处理完成 |
| 已关闭 | closed | 最终归档，不可编辑 |

### 状态流转
```
pending ──→ confirmed ──→ completed ──→ closed
   │           │              ↑
   │           ├─→ need_info ─┤
   │           │              │
   ├─→ escalated ────────────┤
   │           │
   └─→ cancelled ────────────→ closed
```

## 快速开始

### 环境要求
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 5.7+
- Redis

### 安装步骤

1. 安装后端依赖
```bash
composer install
```

2. 安装前端依赖
```bash
npm install
```

3. 配置环境
```bash
cp .env.example .env
php artisan key:generate
```

4. 配置数据库连接
编辑 `.env` 文件，设置数据库和 Redis 连接信息：
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=youth_training
DB_USERNAME=root
DB_PASSWORD=

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

QUEUE_CONNECTION=redis
```

5. 运行数据库迁移
```bash
php artisan migrate
php artisan db:seed
```

6. 编译前端资源
```bash
npm run dev
```

7. 启动队列（生产环境使用 Horizon）
```bash
php artisan horizon
```

8. 启动开发服务器
```bash
php artisan serve
```

### 默认账号
- 邮箱: admin@example.com
- 密码: password

## 核心功能演示

### 1. 新建预约
- 选择日期和时段，实时显示容量情况
- 填写学员信息时自动检测冲突
- 冲突会在右侧面板高亮显示

### 2. 预约详情
- 左侧：基本信息、时段容量、冲突检测、跟进记录、复盘
- 右侧：操作面板、到场情况、操作日志（复核依据）、创建信息

### 3. 跟进记录
- 支持多种跟进方式
- 跟进结果可自动触发状态变更（如"需补资料"→ need_info）

### 4. 升级复核
- 有疑问的预约可升级复核
- 升级的预约进入单独的"升级复核"池子
- 复核人可查看完整操作历史

### 5. 数据统计
- 按到场率、来源渠道、责任人、复盘标签多维度分析
- 支持自定义时间范围
- 每日趋势图表（数据表格形式）

## 队列任务

系统使用 Horizon 管理异步队列，主要任务包括：

- **冲突检测**：每小时自动检测近期预约的冲突情况
- **预约提醒**：提前24小时和当天早上发送提醒

## 安全说明

- 所有操作均有审计日志
- 关闭的记录不可编辑
- 状态流转有严格校验

## License

MIT
