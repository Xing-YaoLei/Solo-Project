# 职业教育学员社群结算台

基于 **Ruby on Rails 7.2 + Hotwire + PostgreSQL + Sidekiq** 构建的职业教育学员社群管理与结算系统。

---

## ✨ 核心功能模块

### 1. 🏠 结算台首页 (Dashboard)
- 学员/社群/核销/退款关键指标概览
- 近6个月考试通过率趋势图
- 社群学员分布统计
- 近期考试、抄袭告警、操作记录

### 2. 📂 **记录中心** (核心页面)
✅ **同页同时展示：**
- **💳 权益核销记录** — 学员、权益、核销码、时间、渠道、状态、操作员
- **↩️ 退款原因记录** — 金额、原因代码、详细原因、状态、支付方式、审批备注
- **🎫 会员档案** — 等级、入会/到期日期、剩余天数、积分、支付状态、累计消费
- **多维度筛选**：学员姓名/手机号、社群、会员等级、状态、退款原因、日期范围

### 3. 🎁 权益规则版本管理 (PaperTrail)
- 定义折扣、赠送、积分、服务等各类权益
- **每次修改自动保留前后值对比**
- 完整版本历史可追溯（创建/更新/删除）
- 适用会员等级、生效期、启用状态管理

### 4. 📅 **月底复盘 · 考试通过率**
- 按月份/社群/考试类型筛选
- 整体通过率 + 各场次明细
- 参考人数、通过/未通过人数、平均分统计
- **📥 报表导出（CSV）自动包含：**
  - ✅ 筛选条件
  - ✅ 生成时间
  - ✅ 操作人

### 5. 🚩 作业抄袭检测 + 负责人提醒
- 作业提交后 **自动异步执行抄袭检测**（Jaccard 相似度算法）
- 超阈值自动：`标记 + 创建告警日志 + 异步通知负责人`
- **抄袭日志完整记录：**
  - 📋 **原因**：相似片段说明 + 匹配详情
  - ⚡ **动作**：警告/零分/停课/劝退/再培训
  - 🚪 **关闭时间**：处理完成自动记录
- 处理流程：`开放 → 调查中 → 已解决 → 已关闭/已撤销`

### 6. ⚖️ 操作日志系统 (全量审计)
- **全量记录所有操作：** create/update/delete/approve/notify/export...
- 字段：操作人、动作类型、目标对象、**原因**、详情、IP地址
- **变更前/后数据对比** (JSON存储)
- **状态 + 关闭时间** 完整记录
- 多条件查询：操作人/动作/对象类型/时间范围

### 7. 👥 辅助功能
- **学员管理**：完整CRUD，个人+档案+核销+退款+考试+作业+抄袭六合一详情页
- **社群管理**：班级/课程/负责人/学员/考试/作业聚合
- **考试中心**：考试场次+成绩+排名+批阅记录
- **作业中心**：作业设置+提交批阅+抄袭检测开关
- **导出中心**：7类报表统一管理

---

## 🛠️ 技术选型

| 层次 | 技术 | 用途 |
|------|------|------|
| 框架 | **Ruby on Rails 7.2** | 全栈MVC框架 |
| 前端 | **Hotwire (Turbo + Stimulus)** | 无JS构建的现代交互 |
| 样式 | **Tailwind CSS 3** | 原子化CSS框架 |
| 数据库 | **PostgreSQL 14+** | JSONB存储、高并发 |
| 队列 | **Sidekiq 7 + Redis** | 抄袭检测、通知、报表导出异步处理 |
| 版本 | **PaperTrail 15** | 权益规则变更追踪 |
| 分页 | **Kaminari** | 统一分页 |
| 导出 | **CSV (标准库)** | Excel兼容报表生成 |

---

## 🚀 快速启动

### 前置依赖
```bash
Ruby >= 3.2.0        # ruby -v
Rails 7.2.1          # gem install rails -v 7.2.1
PostgreSQL >= 14     # psql --version
Redis >= 6.0         # redis-cli ping
Node.js >= 16        # node -v (TailwindCSS编译)
```

### 一键安装
```bash
cd MP0164
./bin/setup          # 安装依赖 → 创建数据库 → 迁移 → 种子数据
```

### 启动开发服务器
```bash
./bin/dev            # 同时启动 Rails + TailwindCSS + Sidekiq
                     # 访问 http://localhost:3000
```

### 手动分步启动
```bash
# 1. 安装依赖（如未运行 bin/setup）
bundle install

# 2. 创建数据库 + 迁移 + 种子
rails db:create
rails db:migrate
rails db:seed

# 3. 启动 Sidekiq（另一个终端）
bundle exec sidekiq -q exports -q mailers -q default

# 4. 启动 Rails 服务器
bin/rails s          # 访问 http://localhost:3000
```

---

## 📊 数据模型总览 (15张表)

```
User ───────────┐ (操作人/负责人/班主任)
  │             │
  ├── manager → Community ──→ Student ──→ MemberProfile
  │                 │            │
  ├── creator → Assignment ──→ AssignmentSubmission
  │                 │            │
  ├── creator → BenefitRule     └─→ PlagiarismLog ←── responsible_user
  │                 │                            ↑
  │    ┌────────────┘                            │
  │    ↓                                         │
  └─→ Exam → ExamResult                     OperationLog
       │
       └→ RedemptionRecord ←─ benefit_rule
            RefundRecord ←──── member_profile
                            ↑
                  Version (PaperTrail) ← BenefitRule
```

---

## 📋 主要路由速查

| 路径 | 说明 |
|------|------|
| `/` | 结算台首页 |
| `/records` | **记录中心**（核销+退款+档案三合一） |
| `/students` | 学员管理 |
| `/students/:id` | 学员详情六合一视图 |
| `/communities` | 社群管理 |
| `/benefit_rules` | 权益规则列表 |
| `/benefit_rules/:id/versions` | **规则版本历史（前后值对比）** |
| `/exams/monthly_review` | **月底复盘·考试通过率** |
| `/exams/monthly_review?year=2026&month=6` | 复盘+导出 |
| `/plagiarism_logs` | **抄袭告警中心**（原因/动作/关闭时间） |
| `/operation_logs` | **全量操作日志审计** |
| `/export_records` | 导出报表中心（含筛选条件/生成时间/操作人） |
| `/sidekiq` | Sidekiq 后台任务面板 |

---

## ⚙️ Sidekiq 队列说明

三个队列（优先级递减）：

| 队列 | 任务 | 说明 |
|------|------|------|
| `exports` | `ExportReportJob` | 报表导出（CSV生成） |
| `mailers` | `PlagiarismNotificationJob` | 抄袭告警推送 |
| `default` | `PlagiarismCheckJob` | 作业相似度检测 |

启动 Sidekiq 时会自动并行处理所有队列：
```bash
bundle exec sidekiq -q exports -q mailers -q default
```

---

## 📥 导出报表格式说明

所有CSV报表**文件头部固定包含四行元数据**（满足需求）：
```
导出类型:     考试通过率报表
生成时间:     2026-06-30 15:30:45
操作人:       张老师
筛选条件:     year=2026, month=6, community_id=1
[空行]
[表头]
[数据行...]
```

---

## 🔒 安全提示

- `config/database.yml` 中的数据库连接信息请使用环境变量覆盖
- 生产环境务必配置正确的 `PGUSER` / `PGPASSWORD` / `REDIS_URL`
- Sidekiq Web 面板建议在生产环境加认证（Gemfile 中可添加 `sidekiq-auth`）
- 所有用户提交的参数都经过 Strong Parameters 白名单过滤

---

## 📁 项目结构亮点

```
app/
├── controllers/
│   ├── records_controller.rb          # 记录中心（核销+退款+档案）
│   ├── benefit_rules_controller.rb    # 权益规则+版本管理
│   ├── exams_controller.rb            # 月底复盘考试通过率
│   ├── plagiarism_logs_controller.rb  # 抄袭告警与处理
│   ├── operation_logs_controller.rb   # 全量操作日志
│   └── export_records_controller.rb   # 报表导出(含筛选条件/时间/操作人)
├── jobs/
│   ├── plagiarism_check_job.rb        # 抄袭相似度检测算法
│   ├── plagiarism_notification_job.rb # 负责人异步提醒
│   └── export_report_job.rb           # 7类报表统一导出
├── models/
│   ├── benefit_rule.rb                # has_paper_trail 保留前后值
│   ├── plagiarism_log.rb              # 原因/动作/关闭时间完整流程
│   ├── operation_log.rb               # log! 类方法 + 前后数据
│   └── export_record.rb               # generate_csv 自动注入元数据
└── views/
    ├── records/index.html.erb         # 三栏Tab：核销/退款/档案
    ├── exams/monthly_review.html.erb  # 月底复盘统计+导出
    ├── plagiarism_logs/               # 原因/动作/关闭时间全展示
    └── benefit_rule_versions/         # PaperTrail版本前后值对比
```

---

## 📄 License

本项目用于示例演示。
