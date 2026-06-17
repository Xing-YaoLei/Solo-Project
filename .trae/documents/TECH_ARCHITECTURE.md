## 1. 架构设计

```mermaid
flowchart TB
    subgraph "客户端层"
        A["Next.js 前端应用"]
        A1["趋势看板页面"]
        A2["数据对比页面"]
        A3["路线总览页面"]
        A4["司机轨迹页面"]
        A5["装载清单页面"]
    end

    subgraph "服务层"
        B["Next.js API Routes"]
        B1["派单数据 API"]
        B2["差异对比 API"]
        B3["路线管理 API"]
        B4["司机签到 API"]
        B5["装载清单 API"]
    end

    subgraph "数据访问层"
        C["Prisma ORM"]
    end

    subgraph "数据层"
        D["PostgreSQL / Supabase"]
        D1["维修派单表"]
        D2["CRM 数据表"]
        D3["支付流水表"]
        D4["抄表数据表"]
        D5["路线计划表"]
        D6["司机签到表"]
        D7["轨迹数据表"]
        D8["装载清单表"]
    end

    subgraph "数据可视化"
        E["Recharts 图表库"]
    end

    A --> A1 & A2 & A3 & A4 & A5
    A1 & A2 & A3 & A4 & A5 --> E
    A --> B
    B --> B1 & B2 & B3 & B4 & B5
    B1 & B2 & B3 & B4 & B5 --> C
    C --> D
    D --> D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8
```

## 2. 技术描述

- **前端框架**：Next.js 14 (App Router) + TypeScript
- **样式方案**：Tailwind CSS 3
- **图表库**：Recharts 2
- **状态管理**：Zustand
- **图标库**：Lucide React
- **ORM**：Prisma 5
- **数据库**：PostgreSQL（Supabase 托管）
- **包管理器**：pnpm

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| `/` | 维修派单趋势看板首页 |
| `/data-compare` | 数据口径差异对比页 |
| `/routes` | 路线计划与执行总览页 |
| `/driver-tracking` | 司机签到与轨迹回放页 |
| `/loading-list` | 装载清单与异常追溯页 |
| `/api/dispatch/trend` | 获取派单趋势数据 |
| `/api/dispatch/kpi` | 获取 KPI 指标数据 |
| `/api/data-compare/differences` | 获取 CRM 与抄表差异明细 |
| `/api/data-compare/payments` | 获取支付流水版本历史 |
| `/api/routes/list` | 获取路线列表 |
| `/api/routes/:id/details` | 获取路线详情与样本明细 |
| `/api/drivers/checkin` | 获取司机签到状态 |
| `/api/drivers/:id/track` | 获取司机轨迹数据 |
| `/api/loading-list` | 获取装载清单列表 |
| `/api/loading-list/:id/original` | 获取原始录入记录 |

## 4. API 接口定义

```typescript
// 派单趋势数据
interface DispatchTrendPoint {
  date: string;
  totalOrders: number;
  onTimeOrders: number;
  delayedOrders: number;
  onTimeRate: number;
  anomalyOrders: number;
}

// KPI 指标
interface KPIData {
  todayOrders: number;
  todayOrdersYoY: number;
  todayOrdersMoM: number;
  onTimeRate: number;
  onTimeRateYoY: number;
  onTimeRateMoM: number;
  delayedCount: number;
  anomalyCount: number;
}

// 数据差异记录
interface DataDifference {
  id: string;
  orderId: string;
  crmValue: Record<string, unknown>;
  meterValue: Record<string, unknown>;
  diffFields: string[];
  diffAmount?: number;
  createdAt: string;
}

// 支付流水版本
interface PaymentVersion {
  id: string;
  orderId: string;
  version: number;
  amount: number;
  status: string;
  operator: string;
  changedAt: string;
  changeReason: string;
}

// 路线计划
interface RoutePlan {
  id: string;
  routeName: string;
  driverName: string;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  plannedOrderCount: number;
  completedOrderCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  delayMinutes?: number;
}

// 司机签到记录
interface DriverCheckin {
  id: string;
  driverId: string;
  driverName: string;
  routeId: string;
  checkinTime: string;
  checkinLocation: { lat: number; lng: number };
  status: 'checked_in' | 'not_checked_in' | 'abnormal';
}

// 轨迹点
interface TrackPoint {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  orderId?: string;
}

// 装载清单项
interface LoadingItem {
  id: string;
  routeId: string;
  orderId: string;
  materialName: string;
  quantity: number;
  unit: string;
  loadedQuantity?: number;
  status: 'normal' | 'abnormal' | 'missing';
  originalRecordId: string;
  remark?: string;
}
```

## 5. 服务端架构图

```mermaid
flowchart TD
    subgraph "Next.js API Routes"
        R1["/api/dispatch/*"]
        R2["/api/data-compare/*"]
        R3["/api/routes/*"]
        R4["/api/drivers/*"]
        R5["/api/loading-list/*"]
    end

    subgraph "Service Layer"
        S1["DispatchService"]
        S2["DataCompareService"]
        S3["RouteService"]
        S4["DriverService"]
        S5["LoadingListService"]
    end

    subgraph "Repository Layer (Prisma)"
        P1["DispatchRepository"]
        P2["CRMRepository"]
        P3["PaymentRepository"]
        P4["MeterRepository"]
        P5["RouteRepository"]
        P6["DriverRepository"]
        P7["TrackRepository"]
        P8["LoadingRepository"]
    end

    subgraph "Database"
        DB["PostgreSQL (Supabase)"]
    end

    R1 --> S1
    R2 --> S2
    R3 --> S3
    R4 --> S4
    R5 --> S5

    S1 --> P1
    S2 --> P2 & P3 & P4
    S3 --> P5
    S4 --> P6 & P7
    S5 --> P8

    P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 --> DB
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    DISPATCH_ORDER ||--o{ PAYMENT_RECORD : has
    DISPATCH_ORDER ||--o{ CRM_RECORD : synced_from
    DISPATCH_ORDER ||--o{ METER_READING : matched_with
    DISPATCH_ORDER }o--|| ROUTE_PLAN : assigned_to
    ROUTE_PLAN ||--o{ DRIVER_CHECKIN : has
    ROUTE_PLAN ||--o{ TRACK_POINT : contains
    ROUTE_PLAN ||--o{ LOADING_ITEM : includes
    DRIVER ||--o{ ROUTE_PLAN : assigned

    DISPATCH_ORDER {
        uuid id PK
        string order_no
        string apartment_id
        string repair_type
        string status
        datetime planned_time
        datetime actual_time
        uuid route_id FK
        decimal amount
        boolean is_on_time
        datetime created_at
    }

    CRM_RECORD {
        uuid id PK
        uuid order_id FK
        string source
        jsonb data
        string data_version
        datetime synced_at
    }

    PAYMENT_RECORD {
        uuid id PK
        uuid order_id FK
        int version
        decimal amount
        string status
        string operator
        string change_reason
        datetime changed_at
    }

    METER_READING {
        uuid id PK
        uuid order_id FK
        string meter_type
        decimal reading_value
        jsonb raw_data
        datetime recorded_at
    }

    ROUTE_PLAN {
        uuid id PK
        string route_name
        uuid driver_id FK
        datetime planned_start
        datetime planned_end
        datetime actual_start
        datetime actual_end
        int planned_orders
        int completed_orders
        string status
    }

    DRIVER {
        uuid id PK
        string name
        string phone
        string vehicle_no
    }

    DRIVER_CHECKIN {
        uuid id PK
        uuid driver_id FK
        uuid route_id FK
        datetime checkin_time
        decimal latitude
        decimal longitude
        string status
    }

    TRACK_POINT {
        uuid id PK
        uuid route_id FK
        datetime timestamp
        decimal latitude
        decimal longitude
        decimal speed
        uuid order_id FK
    }

    LOADING_ITEM {
        uuid id PK
        uuid route_id FK
        uuid order_id FK
        string material_name
        int quantity
        string unit
        int loaded_quantity
        string status
        string original_record_id
        string remark
    }
```

### 6.2 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model DispatchOrder {
  id            String          @id @default(uuid())
  orderNo       String          @unique
  apartmentId   String
  repairType    String
  status        String
  plannedTime   DateTime
  actualTime    DateTime?
  routeId       String?
  amount        Decimal         @db.Decimal(10, 2)
  isOnTime      Boolean
  createdAt     DateTime        @default(now())
  route         RoutePlan?      @relation(fields: [routeId], references: [id])
  crmRecords    CrmRecord[]
  payments      PaymentRecord[]
  meterReadings MeterReading[]
  loadingItems  LoadingItem[]
}

model CrmRecord {
  id        String   @id @default(uuid())
  orderId   String
  source    String
  data      Json
  dataVersion String
  syncedAt  DateTime @default(now())
  order     DispatchOrder @relation(fields: [orderId], references: [id])
}

model PaymentRecord {
  id           String   @id @default(uuid())
  orderId      String
  version      Int
  amount       Decimal  @db.Decimal(10, 2)
  status       String
  operator     String
  changeReason String
  changedAt    DateTime @default(now())
  order        DispatchOrder @relation(fields: [orderId], references: [id])
}

model MeterReading {
  id           String   @id @default(uuid())
  orderId      String
  meterType    String
  readingValue Decimal  @db.Decimal(10, 2)
  rawData      Json
  recordedAt   DateTime @default(now())
  order        DispatchOrder @relation(fields: [orderId], references: [id])
}

model RoutePlan {
  id              String           @id @default(uuid())
  routeName       String
  driverId        String
  plannedStart    DateTime
  plannedEnd      DateTime
  actualStart     DateTime?
  actualEnd       DateTime?
  plannedOrders   Int
  completedOrders Int              @default(0)
  status          String
  driver          Driver           @relation(fields: [driverId], references: [id])
  orders          DispatchOrder[]
  checkins        DriverCheckin[]
  trackPoints     TrackPoint[]
  loadingItems    LoadingItem[]
}

model Driver {
  id        String      @id @default(uuid())
  name      String
  phone     String
  vehicleNo String
  routes    RoutePlan[]
  checkins  DriverCheckin[]
}

model DriverCheckin {
  id             String     @id @default(uuid())
  driverId       String
  routeId        String
  checkinTime    DateTime
  latitude       Decimal    @db.Decimal(10, 6)
  longitude      Decimal    @db.Decimal(10, 6)
  status         String
  driver         Driver     @relation(fields: [driverId], references: [id])
  route          RoutePlan  @relation(fields: [routeId], references: [id])
}

model TrackPoint {
  id          String     @id @default(uuid())
  routeId     String
  timestamp   DateTime
  latitude    Decimal    @db.Decimal(10, 6)
  longitude   Decimal    @db.Decimal(10, 6)
  speed       Decimal    @db.Decimal(5, 2)
  orderId     String?
  route       RoutePlan  @relation(fields: [routeId], references: [id])
}

model LoadingItem {
  id               String     @id @default(uuid())
  routeId          String
  orderId          String
  materialName     String
  quantity         Int
  unit             String
  loadedQuantity   Int?
  status           String
  originalRecordId String
  remark           String?
  route            RoutePlan  @relation(fields: [routeId], references: [id])
  order            DispatchOrder @relation(fields: [orderId], references: [id])
}
```
