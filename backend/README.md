# 二手车门店车源上架趋势看板 - 后端服务

## 1. 项目简介

本项目为 **二手车门店车源上架趋势看板** 的后端服务，对应前端契约（Vue 3 + TypeScript + Tailwind CSS）。系统核心目标是为车商老板提供一个可信赖的经营驾驶舱，用于：

- **车源上架趋势追踪**：按日/周/月聚合车源上架、下架、净增数据，支持分品牌、分门店、分来源下钻
- **检测报告质量监控**：接入第三方检测仪，实时展示检测合格率、不合格原因、事故/泡水/火烧车预警
- **整备效率管理**：统计整备周期、超期预警、整备分类，关联金融审批状态
- **试驾安全合规**：接入车载 IoT 设备，监控试驾异常（超速/偏移路线/超长试驾/事故车试驾）
- **库存周转健康度**：提供库存周转天数、周转率、快消/滞销车辆口径统计，支持导出审计
- **筛选视图与分享**：保存常用筛选口径（默认视图），生成带权限和过期时间的分享链接，保障跨团队数据口径一致

所有筛选结果支持 **PDF / Excel 一键导出**，导出文件与页面数据严格一致，确保「看板即证据」。

---

## 2. 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.2.5 | 核心框架（Web + Validation + Data Redis） |
| MyBatis | 3.0.3（Spring Boot Starter） | ORM 持久层，手写 SQL 聚合 |
| MySQL | 8.0+ | 主数据库，存储车源/检测/整备/试驾/金融等核心业务表 |
| Redis | 7.0+ | 看板数据缓存（TTL 5 分钟），按 shareToken 做权限隔离 |
| iText (core/layout/io/kernel) | 8.0.4 | PDF 报表导出引擎 |
| Apache POI | 5.2.5 | Excel (.xlsx) 导出引擎 |
| Jackson | 内置 | JSON 序列化，支持 JSR310 日期类型 |
| Lombok | 内置 | POJO 简化注解（@Data/@Builder 等） |

---

## 3. 环境要求

- **JDK**：17 及以上（Spring Boot 3.x 强制要求）
- **MySQL**：8.0 及以上（需要 utf8mb4 字符集支持）
- **Redis**：7.0 及以上（可选，但关闭缓存后响应会变慢）
- **Maven**：3.8 及以上
- **操作系统**：macOS / Linux / Windows 均可

验证命令：
```bash
java -version     # 应输出 17.x.x
mvn -v            # 应输出 3.8.x 以上
mysql --version   # 应输出 8.0.x 以上
redis-cli ping    # 应返回 PONG（若启动了 Redis）
```

---

## 4. 快速启动

### 4.1 创建数据库与表结构

```bash
# 登录 MySQL
mysql -u root -p

# 执行建表脚本
SOURCE /your-project-path/backend/src/main/resources/sql/schema.sql;
```

脚本会自动创建 `usedcar_dashboard` 数据库和全部 10 张业务表。

### 4.2 导入示例数据

```bash
# 在 MySQL 命令行中继续执行
SOURCE /your-project-path/backend/src/main/resources/sql/init-data.sql;
```

脚本会通过存储过程批量生成：
- 10 家门店（覆盖北京/上海/广州/深圳/杭州/成都/武汉/西安/南京/重庆）
- 500 辆车源明细（最近 60 天上架）
- 450 份检测报告（合格/不合格/未检测按合理比例）
- 1000+ 条整备清单（钣金/喷漆/机电/美容/其他）
- 1000 条试驾记录（含 ~3% 异常样本）
- 200 条金融审批记录
- 3 个筛选视图（含「早会默认口径」is_default=1）
- 1 条分享链接（token=`share_abc123def456`，权限 `[view,export]`）
- 600 条库存周转日统计快照（60 天 × 10 店）
- 3 条数据源同步日志（inspection/finance 在线，inventory 延迟）

### 4.3 修改配置文件

编辑 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/usedcar_dashboard?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: root           # 改为你的 MySQL 用户名
    password: your_password  # 改为你的 MySQL 密码

  data:
    redis:
      host: localhost        # 改为你的 Redis 地址
      port: 6379             # 改为你的 Redis 端口
      # password: your_redis_password  # 若需要密码则取消注释
```

### 4.4 启动后端服务

```bash
cd backend

# 方式一：Maven 直接运行
mvn spring-boot:run

# 方式二：先打包再运行（推荐生产环境）
mvn clean package -DskipTests
java -jar target/dashboard-service-1.0.0.jar
```

服务启动后默认监听 `http://localhost:8080`。

### 4.5 前端代理（自动转发）

前端项目（Vite）已在 `vite.config.ts` 中配置代理：

```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: env.VITE_API_BASE_URL || 'http://localhost:8080',
      changeOrigin: true,
      timeout: 30000,
    },
  },
}
```

启动前端（在项目根目录）：
```bash
npm run dev
```

访问 `http://localhost:5173`，Vite 会自动将所有 `/api/**` 请求转发到后端 `8080` 端口，**无需手动处理 CORS**。

---

## 5. API 接口速查表

> 所有接口统一返回 `ApiResponse<T>` 包装结构：`{ code: 0, message: "success", data: T }`。
>
> **viewId 覆盖规则**：若请求参数中同时传 `viewId` 和 `filters`，**后端强制以 viewId 对应视图的 filters 为准**，忽略前端传的 filters，避免口径不一致。

| # | URL | Method | 说明 | viewId 覆盖 |
|---|-----|--------|------|-------------|
| 1 | `/api/dashboard/overview` | GET | 获取看板总览（数据源状态/核心指标/库存周转） | ✅ 支持，按视图口径聚合 |
| 2 | `/api/dashboard/vehicle-trend` | GET | 获取车源上架趋势（30 天逐日 listed/delisted/netChange） | ✅ 支持，按视图筛选范围聚合 |
| 3 | `/api/dashboard/inspection-report` | GET | 获取检测报告组成（通过率/周趋势/不合格原因 Top） | ✅ 支持，按视图车辆范围统计 |
| 4 | `/api/dashboard/prep-list` | GET | 获取整备清单明细（状态分布/平均天数/超期预警） | ✅ 支持，超期车源关联金融审批状态 |
| 5 | `/api/dashboard/test-drive-anomaly` | GET | 获取试驾异常统计（30 天分布/异常列表） | ✅ 支持，按视图门店/品牌过滤 |
| 6 | `/api/filter-views` | GET | 获取筛选视图列表（含 is_default 默认视图） | —— 视图管理接口 |
| 7 | `/api/filter-views` | POST | 创建新筛选视图（name + filters JSON） | —— 视图管理接口 |
| 8 | `/api/filter-views/{viewId}` | DELETE | 删除筛选视图（默认视图不可删） | —— 视图管理接口 |
| 9 | `/api/share-links` | POST | 生成分享链接（可选关联 viewId，写入 permissions/expiresAt） | ✅ 生成时固化 viewId 对应 filters |
| 10 | `/api/share-links/{token}` | GET | 校验分享链接有效性，返回当时 filters 与权限 | ✅ 固化 filters，不受前端篡改 |
| 11 | `/api/export/pdf` | GET | 导出 PDF 报表（所有模块，与页面严格一致） | ✅ 强制按视图/分享链接口径 |
| 12 | `/api/export/excel` | GET | 导出 Excel 明细（车源/检测/整备/试驾 4 Sheet） | ✅ 强制按视图/分享链接口径 |

### 请求参数示例（以 overview 为例）

```
GET /api/dashboard/overview?viewId=VIEW_DEFAULT_001
    &storeIds=ST001,ST002
    &startDate=2026-05-21&endDate=2026-06-19
    &brands=宝马,奔驰,奥迪
    &sourceTypes=inspection,finance
    &vehicleCondition=优秀,良好
    &shareToken=share_abc123def456
    &includeTurnover=true
```

---

## 6. 关键设计

### 6.1 viewId 强制覆盖机制

**设计动机**：前端传 filters 可被用户在控制台随意篡改，导致「同一视图名称，实际数据口径不一致」的严重审计风险。

**实现逻辑**：
1. Controller 层接收 `DashboardFilter`，检测 `viewId != null && !blank`
2. 若存在，调用 `FilterViewMapper` 从数据库读取该视图的 `filters_json`
3. 用数据库中 JSON 反序列化后的 `DashboardFilter` **完全替换**请求对象
4. Mapper 层后续 SQL 一律使用被覆盖后的 filter 对象

```java
// 伪代码示意
if (filter.hasViewId()) {
    FilterView view = filterViewMapper.getByViewId(filter.getViewId());
    DashboardFilter saved = view.getFiltersJson();
    filter.setStoreIds(saved.getStoreIds());
    filter.setStartDate(saved.getStartDate());
    // ... 其他字段全部覆盖
}
```

### 6.2 Redis 缓存策略

**TTL**：默认 5 分钟（`dashboard.cache.ttl-seconds=300`），避免 MySQL 聚合查询被高并发打爆。

**Key 隔离规则**（防止权限越权）：
- 普通内部访问：`dashboard:overview:{hash(filter)}`
- 分享链接访问：`dashboard:overview:share:{token}:{hash(filter)}`
- 导出接口：不命中缓存（强制实时查询，保证导出数据与此刻页面 100% 一致）

`hash(filter)` 使用 SHA-256 对序列化后的 filters 字节流计算，保证同一口径命中同一缓存。

### 6.3 分享链接权限模型

**生成时（POST /api/share-links）**：
- 前端传 `viewId`、`permissions`（如 `["view","export"]`）、`includesTurnoverMetrics`
- 后端**立即**将当时的 `filters_json`、`permissions_json`、`includesTurnoverMetrics` 写入 `t_share_link` 表
- 返回 `token` 给前端，URL 格式为 `{origin}/share/{token}`

**校验时（GET /api/share-links/{token} / 所有看板接口带 shareToken）**：
- 后端读取 `t_share_link`，校验：`is_valid=1`、`expires_at > now`、`revoked_at IS NULL`
- 从数据库中读出 `filters_json` 作为本次请求的强制 filters，**完全忽略前端 query 传参**
- `export` 入口二次校验：只有 `permissions_json` 包含 `export` 才允许生成下载流，否则返回 403

### 6.4 库存周转口径

`includeTurnover` 参数决定接口是否返回库存周转指标（`InventoryTurnoverMetrics`），用于：
- 某些基础看板不展示周转（前端 `ShareExportBar` 勾选状态同步）
- PDF / Excel 导出**严格读取接口同一标志**，确保「页面上有/没有周转指标」与「导出文件中有/没有」完全一致

**口径定义**（与前端 mock `definition` 字段一致）：
- 库存周转天数 = 统计期内平均库存量 / 统计期内日均出库量
- 周转率 = 统计期内出库总量 / 平均库存量
- 快消 = 周转天数 ≤ 30 天
- 滞销 = 周转天数 ≥ 60 天

---

## 7. 目录结构树

```
backend/
├── pom.xml                                 # Maven 依赖配置
├── README.md                               # 本文档
└── src/
    └── main/
        ├── java/com/usedcar/dashboard/
        │   ├── DashboardApplication.java           # Spring Boot 启动类
        │   ├── config/
        │   │   ├── RedisConfig.java                # Redis 序列化/Key 过期配置
        │   │   └── WebMvcConfig.java               # CORS / 拦截器配置
        │   ├── controller/                          # Controller 层（12 个接口）
        │   │   ├── DashboardController.java        # 看板查询（接口 1-5）
        │   │   ├── FilterViewController.java       # 视图管理（接口 6-8）
        │   │   ├── ShareLinkController.java        # 分享链接（接口 9-10）
        │   │   └── ExportController.java           # 导出接口（接口 11-12）
        │   ├── service/                             # 业务逻辑层
        │   │   ├── DashboardService.java
        │   │   ├── FilterViewService.java
        │   │   ├── ShareLinkService.java
        │   │   └── ExportService.java              # PDF + Excel 渲染
        │   ├── dto/                                 # 接口出入参（前端契约对应）
        │   │   ├── ApiResponse.java
        │   │   ├── DashboardFilter.java
        │   │   ├── DashboardOverview.java
        │   │   ├── VehicleArchiveTrend.java
        │   │   ├── DailyDriveDistribution.java
        │   │   ├── InspectionReportComposition.java
        │   │   ├── PrepListDetail.java
        │   │   ├── PrepOverdueItem.java
        │   │   ├── TestDriveAnomaly.java
        │   │   ├── AnomalyItem.java
        │   │   ├── FilterView.java
        │   │   ├── ShareLink.java
        │   │   └── ShareLinkValidation.java
        │   ├── entity/                              # 数据库表对应实体
        │   │   ├── VehicleSource.java
        │   │   ├── InspectionReport.java
        │   │   ├── PrepItem.java
        │   │   ├── TestDrive.java
        │   │   ├── FilterView.java
        │   │   ├── ShareLink.java
        │   │   ├── InventoryDailySnapshot.java
        │   │   └── DatasourceSyncLog.java
        │   ├── mapper/                              # MyBatis Mapper 接口
        │   │   ├── VehicleSourceMapper.java
        │   │   ├── InspectionReportMapper.java
        │   │   ├── PrepItemMapper.java
        │   │   ├── TestDriveMapper.java
        │   │   ├── FilterViewMapper.java
        │   │   ├── ShareLinkMapper.java
        │   │   ├── InventoryDailySnapshotMapper.java
        │   │   └── DatasourceSyncLogMapper.java
        │   └── handler/
        │       └── JacksonTypeHandler.java          # MyBatis JSON ↔ Java 对象转换
        └── resources/
            ├── application.yml                       # 应用配置
            ├── mapper/                                # MyBatis XML
            │   ├── VehicleSourceMapper.xml
            │   ├── InspectionReportMapper.xml
            │   ├── PrepItemMapper.xml
            │   ├── TestDriveMapper.xml
            │   ├── FilterViewMapper.xml
            │   ├── ShareLinkMapper.xml
            │   ├── InventoryDailySnapshotMapper.xml
            │   └── DatasourceSyncLogMapper.xml
            └── sql/
                ├── schema.sql                        # 建表脚本
                └── init-data.sql                     # 示例数据脚本
```

---

## 8. 常见问题（FAQ）

### Q1：启动后数据库中文乱码 / 前端展示 `???`

**原因**：MySQL 连接未指定 utf8mb4，或数据库/表级字符集不正确。

**解决**：
1. 确认 `schema.sql` 已执行，数据库是 `DEFAULT CHARACTER SET utf8mb4`
2. `application.yml` 中 JDBC URL 必须带参数：
   ```
   jdbc:mysql://localhost:3306/usedcar_dashboard?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai
   ```
3. 若仍乱码，执行：
   ```sql
   ALTER DATABASE usedcar_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Q2：浏览器控制台 CORS 跨域错误

**开发环境**：通过 Vite 代理访问（`http://localhost:5173`），不应出现 CORS。若直接访问后端 `8080`：

**解决**（`WebMvcConfig.java` 已配置，确认未被覆盖）：
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### Q3：Redis 连接失败 / `Unable to connect to Redis`

**场景 1：未启动 Redis**
```bash
# macOS（Homebrew）
brew services start redis
# 或 Linux
redis-server /etc/redis/redis.conf
```

**场景 2：Redis 有密码**
修改 `application.yml`：
```yaml
spring:
  data:
    redis:
      host: your-host
      port: 6379
      password: your_redis_password   # 添加这一行
```

**场景 3：临时没有 Redis 但想先跑起来**

在 `pom.xml` 中暂时排除 `spring-boot-starter-data-redis`（**不推荐**，会失去缓存，导出会变慢），或在本地启动一个 Redis Docker：
```bash
docker run -d --name redis-dashboard -p 6379:6379 redis:7-alpine
```

### Q4：`init-data.sql` 执行时报存储过程语法错

**原因**：客户端默认分号 `;` 会截断 `CREATE PROCEDURE` 块。

**解决**：确保使用 `DELIMITER //` 切换分隔符（脚本已内置），若仍失败：
```bash
# 命令行执行时加参数，禁用分号截断
mysql -u root -p --delimiter=// < init-data.sql
```

### Q5：导出 PDF 中文显示方块 / 乱码

**原因**：iText 默认字体不支持 CJK。

**解决**：`ExportService` 中注册中文字体（使用系统自带 `PingFang SC` / `Microsoft YaHei` / `Noto Sans CJK SC`）：
```java
FontProgram fontProgram = FontProgramFactory.createFont("/System/Library/Fonts/PingFang.ttc", 0, true);
PdfFont chineseFont = PdfFontFactory.createFont(fontProgram, PdfEncodings.IDENTITY_H);
```
若在 Linux 部署，确保安装了 `fonts-noto-cjk` 包。

### Q6：mvn spring-boot:run 端口被占用

```bash
# 查看占用 8080 的进程
lsof -i :8080          # macOS / Linux
# netstat -ano | findstr 8080  # Windows

# 或临时改端口启动
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

---

## 附录：分享链接测试

执行完 `init-data.sql` 后，可直接访问以下分享链接验证权限隔离：

```
# Token：share_abc123def456
# 关联视图：早会默认口径（最近30天、所有门店、所有品牌）
# 权限：[view, export]，30 天后过期

http://localhost:5173/share/share_abc123def456
```
