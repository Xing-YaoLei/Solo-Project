# 二手车门店过户材料结算台

基于 Remix + Express + MongoDB + Redis + Mongoose 的二手车门店过户材料管理系统。

## 技术栈

- **前端**: Remix 2.x + React 18 + TypeScript + Tailwind CSS
- **后端**: Express 4.x
- **数据库**: MongoDB + Mongoose 8.x
- **缓存/消息队列**: Redis
- **其他**: Vite、xlsx、dayjs

## 功能模块

### 1. 记录页 (`/records`)
同时查看每辆车的：
- 整备清单：整备项目、费用、完成状态
- 试驾记录：客户信息、试驾时间、兴趣程度、反馈
- 报价历史：报价金额、优惠、付款方式、状态

### 2. 金融资料 (`/finance`)
- 管理车辆金融信息（采购价、整备成本、售价、利润等）
- **改动追踪**：所有字段修改都会保留前后值、修改人、修改时间、变更原因
- 查看完整的变更历史记录

### 3. 月底复盘 (`/review`)
- 库存周转统计：平均库龄、售出耗时、利润率
- 月度/季度销售数据
- 滞销车辆提醒（超30天、超60天）
- 月度趋势图表数据

### 4. 数据导出 (`/export`)
支持导出：
- 库存周转数据
- 过户材料数据
- 金融资料数据
- 操作日志数据

**导出特性**：
- 导出文件自动包含 **筛选范围**、**生成时间**、**操作人** 信息
- Excel 格式，带导出摘要页

### 5. 消息通知 (`/notifications`)
- 资料缺失时自动推送给相关处理人
- 支持优先级（低/中/高/紧急）
- 支持多渠道推送（站内信、短信、邮件、微信）
- 消息处理状态追踪

### 6. 操作日志 (`/logs`)
记录所有操作的：
- **原因**：操作的业务原因
- **动作**：创建/更新/删除/导出/同步等
- **关闭时间**：日志可手动关闭，记录关闭人和备注
- 修改前后值对比

## 项目结构

```
MP0324/
├── app/                          # Remix 前端代码
│   ├── entry.client.tsx         # 客户端入口
│   ├── entry.server.tsx         # 服务端入口
│   ├── root.tsx                 # 根组件
│   ├── tailwind.css             # Tailwind 样式
│   ├── global.d.ts              # 全局类型声明
│   └── routes/                  # 页面路由
│       ├── _index.tsx           # 首页
│       ├── records.tsx          # 记录页
│       ├── finance.tsx          # 金融资料
│       ├── review.tsx           # 月底复盘
│       ├── notifications.tsx    # 消息通知
│       ├── logs.tsx             # 操作日志
│       └── export.tsx           # 数据导出
├── server/                       # Express 后端代码
│   ├── index.js                 # 服务器入口
│   ├── db.js                    # MongoDB 连接
│   ├── redis.js                 # Redis 连接与缓存
│   ├── models/                  # Mongoose 数据模型
│   │   ├── User.js
│   │   ├── Car.js
│   │   ├── PreparationList.js   # 整备清单
│   │   ├── TestDriveRecord.js   # 试驾记录
│   │   ├── QuoteHistory.js      # 报价历史
│   │   ├── FinanceData.js       # 金融资料（含变更日志）
│   │   ├── TransferMaterial.js  # 过户材料
│   │   ├── Notification.js      # 消息通知
│   │   ├── OperationLog.js      # 操作日志
│   │   ├── InventoryTurnover.js # 库存周转
│   │   ├── ExportRecord.js      # 导出记录
│   │   └── index.js
│   ├── routes/                  # API 路由
│   │   ├── index.js
│   │   ├── car.routes.js
│   │   ├── records.routes.js
│   │   ├── finance.routes.js
│   │   ├── transferMaterial.routes.js
│   │   ├── review.routes.js
│   │   ├── notification.routes.js
│   │   ├── logs.routes.js
│   │   └── export.routes.js
│   ├── controllers/             # API 控制器
│   │   ├── car.controller.js
│   │   ├── records.controller.js
│   │   ├── finance.controller.js
│   │   ├── transferMaterial.controller.js
│   │   ├── review.controller.js
│   │   ├── notification.controller.js
│   │   ├── logs.controller.js
│   │   └── export.controller.js
│   └── utils/                   # 工具函数
│       ├── common.js
│       ├── operationLog.js      # 操作日志工具
│       └── notification.js      # 通知工具
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

配置内容：
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/used-car-transfer
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### 3. 启动 MongoDB 和 Redis

确保本地 MongoDB 和 Redis 服务已启动。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 生产构建

```bash
npm run build
npm start
```

## API 接口

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 车辆 | GET/POST/PUT/DELETE | `/api/cars` | 车辆 CRUD |
| 记录 | GET | `/api/records/car/:carId` | 获取车辆的整备/试驾/报价记录 |
| 整备 | GET/POST/PUT | `/api/records/preparations` | 整备清单管理 |
| 试驾 | GET/POST/PUT | `/api/records/test-drives` | 试驾记录管理 |
| 报价 | GET/POST/PUT | `/api/records/quotes` | 报价历史管理 |
| 金融 | GET/PUT | `/api/finance/:carId` | 金融资料（改动自动追踪） |
| 金融变更 | GET | `/api/finance/:carId/changes` | 获取金融资料变更历史 |
| 过户材料 | GET/POST/PUT | `/api/transfer-materials` | 过户材料管理 |
| 过户检查 | POST | `/api/transfer-materials/:carId/check-missing` | 检查并推送缺失资料通知 |
| 复盘 | GET | `/api/review/inventory-turnover` | 库存周转统计 |
| 复盘 | GET | `/api/review/monthly` | 月度复盘数据 |
| 复盘 | POST | `/api/review/sync` | 同步库存周转数据 |
| 通知 | GET/PUT | `/api/notifications` | 消息通知管理 |
| 日志 | GET/PUT | `/api/logs` | 操作日志管理 |
| 导出 | POST | `/api/export/*` | 各类数据导出 |
| 导出 | GET | `/api/export/records` | 导出记录列表 |

## 核心业务流程

### 过户材料结算流程
1. 车辆入库后自动创建过户材料清单（默认10项必备材料）
2. 逐项提交/审核材料，状态追踪（缺失/已提交/已审核/已驳回）
3. **资料缺失自动检测**，通过 Redis 发布消息通知相关处理人
4. 全部审核通过后状态变为"已通过"

### 金融资料变更追踪
```
修改金融资料 → 自动对比字段变化 → 生成 changeLogs（前值/后值/时间/人/原因）
           → 记录操作日志（原因/动作）
           → 结算状态变更时发送通知
```

### 月底复盘流程
1. 点击"同步数据"从车辆/金融/整备表汇总计算
2. 生成每辆车的库存周转记录（库龄、利润、成本）
3. 统计月度/季度数据，识别滞销车辆
4. 一键导出 Excel（包含筛选条件、生成时间、操作人）
