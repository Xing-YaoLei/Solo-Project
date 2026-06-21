# 二手车门店车辆收购任务分派台

> 技术栈: Vue 3 + Vite + Spring Boot 3 + MySQL 8 + Redis + MyBatis Plus + Element Plus + ECharts

把二手车门店从"车辆录入 → 评估报价 → 资料收集 → 异常处理 → 收购入库/关闭"的全流程沉淀在**一条业务链路**里,一线人员在同一屏就能完成「报价历史、金融资料、车辆档案」三项核心处理,无需在不同入口间来回切换。

---

## 一、项目结构

```
MP0325/
├── sql/                          # 数据库脚本(含测试数据)
│   └── schema.sql
├── backend/                      # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/usedcar/acquisition/
│       │   ├── AcquisitionApplication.java      # 启动类
│       │   ├── config/           # MyBatis Plus / Redis / WebMvc 配置
│       │   ├── common/           # Result / Page / 工具基类
│       │   ├── enums/            # 任务状态 / 来源 / 操作类型 枚举
│       │   ├── exception/        # 业务异常 + 全局异常处理
│       │   ├── entity/           # 7 个数据实体
│       │   ├── mapper/           # MyBatis Plus Mapper (含统计 SQL)
│       │   ├── service/          # Service 接口 + impl 实现
│       │   ├── controller/       # REST API 控制器
│       │   ├── dto/              # 请求 DTO
│       │   └── vo/               # 返回 VO
│       └── resources/
│           └── application.yml
└── frontend/                     # Vue 3 + Vite 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js / App.vue
        ├── api/                  # axios 封装 + 全部接口
        ├── router/               # 路由
        ├── store/                # Pinia 全局 store(字典/用户)
        ├── styles/global.scss    # 全局样式
        ├── utils/                # request 等工具
        ├── components/Layout.vue # 主布局(顶部导航)
        └── views/                # 5 个核心页面
            ├── Dashboard.vue     # 工作台(首页总览)
            ├── TaskList.vue      # 任务分派台(列表 + 新建)
            ├── TaskDetail.vue    # 任务详情(同屏三栏 ★)
            ├── Statistics.vue    # 汇总统计(4 张报表 + 2 张明细表)
            └── Inventory.vue     # 库存周转(周转分析 + 明细表)
```

---

## 二、核心业务链路 & 状态机

```
              ┌──────── 异常处理分支 ────────┐
              │                              │
  PENDING → ASSESSING → QUOTING ──→ MATERIAL_MISSING → SUPPLEMENTING
     │(录入)    │(评估)     │(报价)   ↑(标记缺失)      │(补料)
     │          │          │        │                │
     │          │          ├──→ ESCALATED ←─────────┘(仍复杂则升级)
     │          │          │(升级/经理介入)
     │          │          ↓
     │          └──→ DEALING (确认成交/待入库)
     │                 ↓
     └────→ NORMAL_CLOSED(正常收购成功,同步inventory)
            REJECT_CLOSED(放弃收购)
            CANCELLED(取消)
```

**三种关闭路径:**
1. **正常关闭 (`NORMAL_CLOSE`)** → 资料齐全、价格谈拢 → 写入 `inventory` 库存表、计算库存天数
2. **补充材料 (`MATERIAL_MISSING → SUPPLEMENTING`)** → 评估/报价中发现缺件 → 标出缺失项(前端勾选11类资料)→ 客户补料后继续推进
3. **升级处理 (`ESCALATED`)** → 车况复杂(事故/水泡/火烧等)或价格争议 → 指派经理介入,可由经理直接决策成交或放弃

**记录关闭后仍可通过「任务分派台」筛选「已关闭」继续查询**,通过 `is_active` 字段 + `close_time` 索引快速检索。

---

## 三、一屏式任务详情(核心交互)

`/tasks/:id` 页面采用**三栏同屏**布局(≥1400px 横向,≤1400px 自动纵向堆叠):

| 左栏: 🚗 车辆档案 | 中栏: 💰 报价历史 | 右栏: 📁 金融资料 |
|---|---|---|
| 品牌/车系/车型大卡片 | 第1轮: 初评价 ¥xxx → 客户还价 ¥yyy | 每项三态:缺失(黄)/已上传/已核验(绿) |
| VIN / 车牌 / 上牌 / 里程 / 排放 / 排量 | 第2轮: 经理还价 ¥xxx → 客户接受 | 上传按钮 / 核验按钮(按状态可用) |
| 保险 / 年检 / 原车主信息 | N 轮完整时间线 | 缺失项实时统计:「齐全 x/y 缺 z」 |
| 任务信息(客户/来源/负责团队/期望价) | — | — |
| 状态流转时间线(完整审计) | — | — |

顶部是**按当前状态智能启用**的操作条:
```
[开始评估] [发起报价] [标记资料缺失] [客户补料] [升级处理] [确认成交] [完成收购] [放弃收购] [取消] [上传资料]
```
每个按钮根据 `taskStatus` 自动启用/禁用,避免乱序操作(例如 `PENDING` 状态下「开始评估」可用,其他禁用;已关闭任务全禁用仅可查看)。

---

## 四、数据模型(7 张表)

| 表 | 作用 | 关键字段 |
|---|---|---|
| `sys_user` | 用户(4 种角色) | `role`: ADMIN / MANAGER / ASSESSOR / SALES |
| `vehicle_archive` | 车辆档案(唯一 VIN) | VIN 唯一,支持任务间复用 |
| `acquisition_task` | 任务单主表 | `task_status` 状态机、`is_active`、`missing_materials` JSON |
| `quote_history` | 报价历史 | `quote_round` 轮次、客户回应/还价 |
| `finance_material` | 金融资料 | 11 种类型、`is_missing` / `is_verified` 双状态 |
| `status_log` | 状态流转日志 | 全链路审计: from→to / 操作人 / 备注 / 时间 |
| `inventory` | 库存表(正常关闭写入) | 关联任务 + 车辆,`days_in_stock` 供周转统计 |

索引重点:任务号、车辆 ID、状态、来源、负责人、创建时间、关闭时间、是否活跃。

---

## 五、汇总统计 4 大维度

| 维度 | 页面 | 图表 |
|---|---|---|
| **库存周转** | `/inventory` + `/statistics` | 饼图(周转结构分布)、横向柱状图(单车天数 TOP10)、明细表(毛利率) |
| **来源分析** | `/statistics` | 双柱图(任务数 vs 成功数)、来源明细表(成功率/占比进度条) |
| **负责人(业务员)** | `/statistics` | 组合图(任务数/成功数柱 + 成功率折线)、排行表(TOP1-3 金银铜) |
| **处理结论** | `/statistics` + 详情页 | 环形饼图(正常收购/放弃/取消占比) |

快速筛选:本月 / 上月 / 本季度 / 今年 / 全部 / 自定义日期范围。

工作台 `/dashboard` 一眼看到:总任务 / 进行中 / 成功收购 / 资料缺失 / 升级处理 / 平均库存天数 + 4 个图表 + 最新任务动态(可直接点入处理)。

---

## 六、启动步骤

### 1. 初始化数据库

```bash
mysql -uroot -p < sql/schema.sql
# 创建数据库 used_car_acquisition + 7 张表 + 8 个用户 + 5 条演示任务
```

### 2. 启动后端

```bash
cd backend
# 先修改 src/main/resources/application.yml 的数据库和 Redis 密码
mvn spring-boot:run
# 监听 http://localhost:8080/api
```

### 3. 启动前端

```bash
cd frontend
npm install   # pnpm install / yarn 也行
npm run dev   # 监听 http://localhost:5173  已经代理 /api → 8080
```

### 4. 演示账号(在 `sys_user` 表中)

| 账号 | 角色 | 姓名 | 典型场景 |
|---|---|---|---|
| `sales01` / `sales02` / `sales03` | SALES 业务员 | 陈/赵/孙销售 | 创建任务、跟进客户 |
| `assessor01` / `assessor02` | ASSESSOR 评估师 | 张/刘评估 | 车辆评估、发起报价、标记资料缺失 |
| `manager01` / `manager02` | MANAGER 经理 | 王/李经理 | 升级处理、审批、完成收购 |
| `admin` | ADMIN 管理员 | 系统管理员 | 全局配置 |

前端默认登录态为 `manager01` (王经理),可在 `frontend/src/store/app.js` 中修改 `currentUser`。

---

## 七、技术亮点

1. **Redis 加速**:任务单号按月份自增(原子 `INCR` + 35 天 TTL);任务详情 30 分钟缓存;全局字典/用户缓存。
2. **状态流转强约束**:Service 层每次操作前 `checkTaskNotClosed` + 各按钮按状态启用,后端再次校验。
3. **状态日志全链路审计**:每次状态变化写入 `status_log`,前端以时间线样式可视化。
4. **资料缺失闭环**:前端「标记资料缺失」弹窗 11 类资料多选 → 后端写入 `missing_materials` JSON + 对应 `finance_material` 缺失标记 → 补料后上传核验自动解除。
5. **前后端字段命名一致性**:MySQL `snake_case` → MyBatis Plus 自动驼峰 → 前端 `camelCase`。
6. **ECharts 数据可视化**:9 张图表(环形图、柱图、折线、旭日图),工作台、统计、库存各取所需。

---

## 八、演示数据一览(无需创建即可体验)

- 5 条任务:覆盖 `QUOTING` / `MATERIAL_MISSING` / `ASSESSING` / `ESCALATED` / `NORMAL_CLOSED` 5 种典型状态
- 7 条报价历史:包含 2 轮还价 + 最终成交
- 18 条金融资料:包含 3 项缺失(登记证/发票/保险)、其余已上传核验
- 16 条状态日志:完整展示创建→评估→报价→缺失/升级→成交→关闭的链路
- 1 条库存记录:可测试周转统计

打开前端 → 工作台即可看到概览 → 点「任务分派台」进入列表 → 点每行「处理」进入同屏三栏详情 → 体验完整操作。
