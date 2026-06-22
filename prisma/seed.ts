import { PrismaClient, UserRole, TicketStatus, ReviewOpinion, ClosureReason, ImportType, RemarkPriority } from "@prisma/client";

const prisma = new PrismaClient();

const departments = ["信息技术部", "财务部", "人力资源部", "运营部", "合规部"];

const users = [
  { id: "u-001", email: "zhangwei@company.com", name: "张伟", role: UserRole.auditor, department: "合规部" },
  { id: "u-002", email: "lina@company.com", name: "李娜", role: UserRole.business_owner, department: "信息技术部" },
  { id: "u-003", email: "wangfang@company.com", name: "王芳", role: UserRole.compliance_officer, department: "合规部" },
  { id: "u-004", email: "liuqiang@company.com", name: "刘强", role: UserRole.management, department: "运营部" },
  { id: "u-005", email: "chenmin@company.com", name: "陈敏", role: UserRole.business_owner, department: "财务部" },
];

const tickets = [
  {
    id: "t-001",
    ticketNo: "AUD-2025-0001",
    title: "ERP系统权限分配未遵循最小权限原则",
    description: "审计发现ERP系统中多名员工拥有超出岗位职责的系统权限，存在权限过大风险，需按最小权限原则整改",
    status: TicketStatus.closed,
    department: "信息技术部",
    assigneeId: "u-002",
    auditorId: "u-001",
    dueDate: new Date("2025-04-15"),
    closureReason: ClosureReason.remediated,
    firstResolution: true,
    createdAt: new Date("2025-03-01"),
  },
  {
    id: "t-002",
    ticketNo: "AUD-2025-0002",
    title: "财务审批流程缺少双人复核机制",
    description: "财务报销审批流程中部分环节缺少双人复核，不符合SOX合规要求，需补充复核节点",
    status: TicketStatus.closed,
    department: "财务部",
    assigneeId: "u-005",
    auditorId: "u-001",
    dueDate: new Date("2025-05-01"),
    closureReason: ClosureReason.remediated,
    firstResolution: false,
    createdAt: new Date("2025-03-10"),
  },
  {
    id: "t-003",
    ticketNo: "AUD-2025-0003",
    title: "离职员工账号未及时停用",
    description: "发现3名离职员工账号在离职30天后仍处于激活状态，存在数据泄露风险",
    status: TicketStatus.pending_review,
    department: "信息技术部",
    assigneeId: "u-002",
    auditorId: "u-001",
    dueDate: new Date("2025-06-30"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-04-05"),
  },
  {
    id: "t-004",
    ticketNo: "AUD-2025-0004",
    title: "数据库访问日志保留期不足",
    description: "数据库访问日志仅保留30天，不满足合规要求的180天最低保留期限",
    status: TicketStatus.in_remediation,
    department: "信息技术部",
    assigneeId: "u-002",
    auditorId: "u-001",
    dueDate: new Date("2025-07-15"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-04-20"),
  },
  {
    id: "t-005",
    ticketNo: "AUD-2025-0005",
    title: "供应商准入审查缺失合规评估环节",
    description: "供应商准入流程中缺少合规风险评估步骤，可能导致与不合规供应商合作",
    status: TicketStatus.pending_remediation,
    department: "运营部",
    assigneeId: "u-004",
    auditorId: "u-003",
    dueDate: new Date("2025-08-01"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-05-01"),
  },
  {
    id: "t-006",
    ticketNo: "AUD-2025-0006",
    title: "员工培训记录未纳入合规档案",
    description: "年度合规培训参与记录未统一归档管理，无法证明员工完成必修合规培训",
    status: TicketStatus.in_remediation,
    department: "人力资源部",
    assigneeId: "u-004",
    auditorId: "u-003",
    dueDate: new Date("2025-07-30"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-05-10"),
  },
  {
    id: "t-007",
    ticketNo: "AUD-2025-0007",
    title: "客户敏感数据加密存储不合规",
    description: "客户个人信息存储未采用AES-256加密标准，不符合《个人信息保护法》要求",
    status: TicketStatus.closed,
    department: "信息技术部",
    assigneeId: "u-002",
    auditorId: "u-001",
    dueDate: new Date("2025-05-20"),
    closureReason: ClosureReason.risk_accepted,
    firstResolution: false,
    createdAt: new Date("2025-03-15"),
  },
  {
    id: "t-008",
    ticketNo: "AUD-2025-0008",
    title: "内部沟通邮件缺少合规免责声明",
    description: "对外沟通邮件模板中缺少法定合规免责声明和保密提示",
    status: TicketStatus.closed,
    department: "合规部",
    assigneeId: "u-003",
    auditorId: "u-001",
    dueDate: new Date("2025-04-30"),
    closureReason: ClosureReason.remediated,
    firstResolution: true,
    createdAt: new Date("2025-03-20"),
  },
  {
    id: "t-009",
    ticketNo: "AUD-2025-0009",
    title: "办公区域门禁系统访问记录缺失",
    description: "机房和档案室门禁系统近3个月未记录访问日志，无法追溯非授权访问",
    status: TicketStatus.pending_remediation,
    department: "运营部",
    assigneeId: "u-004",
    auditorId: "u-003",
    dueDate: new Date("2025-09-01"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-05-25"),
  },
  {
    id: "t-010",
    ticketNo: "AUD-2025-0010",
    title: "财务报表系统接口缺少审计追踪",
    description: "财务报表系统的数据导入接口未记录操作审计日志，不满足SOX审计追踪要求",
    status: TicketStatus.pending_review,
    department: "财务部",
    assigneeId: "u-005",
    auditorId: "u-003",
    dueDate: new Date("2025-07-01"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-04-25"),
  },
  {
    id: "t-011",
    ticketNo: "AUD-2025-0011",
    title: "远程办公VPN连接缺少多因素认证",
    description: "远程办公人员通过VPN接入内网时仅需密码认证，未启用MFA，存在账户被盗用风险",
    status: TicketStatus.in_remediation,
    department: "信息技术部",
    assigneeId: "u-002",
    auditorId: "u-001",
    dueDate: new Date("2025-08-15"),
    closureReason: null,
    firstResolution: false,
    createdAt: new Date("2025-06-01"),
  },
  {
    id: "t-012",
    ticketNo: "AUD-2025-0012",
    title: "合同归档流程未与审批系统对接",
    description: "已签署合同仍依赖人工归档，未与OA审批系统自动关联，存在归档遗漏风险",
    status: TicketStatus.closed,
    department: "财务部",
    assigneeId: "u-005",
    auditorId: "u-003",
    dueDate: new Date("2025-05-15"),
    closureReason: ClosureReason.no_longer_applicable,
    firstResolution: true,
    createdAt: new Date("2025-04-01"),
  },
];

const importRecords = [
  {
    id: "imp-001",
    type: ImportType.erp_export,
    fileName: "ERP_Audit_Export_2025Q1.xlsx",
    fileUrl: "https://storage.supabase.co/compliance/imports/ERP_Audit_Export_2025Q1.xlsx",
    totalRows: 156,
    successRows: 152,
    errorRows: 4,
    operatorId: "u-001",
    createdAt: new Date("2025-03-01T09:30:00"),
  },
  {
    id: "imp-002",
    type: ImportType.permission_log,
    fileName: "Permission_Log_March_2025.csv",
    fileUrl: "https://storage.supabase.co/compliance/imports/Permission_Log_March_2025.csv",
    totalRows: 2300,
    successRows: 2287,
    errorRows: 13,
    operatorId: "u-001",
    createdAt: new Date("2025-03-02T14:15:00"),
  },
  {
    id: "imp-003",
    type: ImportType.erp_export,
    fileName: "ERP_Audit_Export_2025Q2.xlsx",
    fileUrl: "https://storage.supabase.co/compliance/imports/ERP_Audit_Export_2025Q2.xlsx",
    totalRows: 203,
    successRows: 201,
    errorRows: 2,
    operatorId: "u-003",
    createdAt: new Date("2025-06-01T10:00:00"),
  },
  {
    id: "imp-004",
    type: ImportType.permission_log,
    fileName: "Permission_Log_April_2025.json",
    fileUrl: "https://storage.supabase.co/compliance/imports/Permission_Log_April_2025.json",
    totalRows: 1890,
    successRows: 1885,
    errorRows: 5,
    operatorId: "u-003",
    createdAt: new Date("2025-05-05T11:20:00"),
  },
];

const remediationLogs = [
  {
    id: "rl-001",
    ticketId: "t-001",
    action: "权限回收",
    description: "已回收ERP系统中5名员工超出岗位职责的权限，调整为最小权限集",
    operatorId: "u-002",
    createdAt: new Date("2025-03-20T16:00:00"),
  },
  {
    id: "rl-002",
    ticketId: "t-001",
    action: "权限矩阵更新",
    description: "更新ERP权限矩阵文档，新增岗位-权限对应关系表",
    operatorId: "u-002",
    createdAt: new Date("2025-04-01T10:30:00"),
  },
  {
    id: "rl-003",
    ticketId: "t-002",
    action: "审批流程配置",
    description: "在OA系统中为财务报销流程增加双人复核节点，涉及金额>5000元需部门经理+财务总监双签",
    operatorId: "u-005",
    createdAt: new Date("2025-03-25T14:00:00"),
  },
  {
    id: "rl-004",
    ticketId: "t-002",
    action: "制度修订",
    description: "修订《财务报销管理制度》，新增第4.3条双人复核要求",
    operatorId: "u-005",
    createdAt: new Date("2025-04-10T09:15:00"),
  },
  {
    id: "rl-005",
    ticketId: "t-003",
    action: "账号停用",
    description: "已停用3名离职员工账号：zhangxiao@company.com, wuming@company.com, zhaojia@company.com",
    operatorId: "u-002",
    createdAt: new Date("2025-04-20T11:00:00"),
  },
  {
    id: "rl-006",
    ticketId: "t-004",
    action: "日志策略调整",
    description: "将数据库访问日志保留策略从30天调整为180天，已提交DBA团队执行",
    operatorId: "u-002",
    createdAt: new Date("2025-05-05T15:45:00"),
  },
  {
    id: "rl-007",
    ticketId: "t-006",
    action: "培训档案系统对接",
    description: "已启动HR培训系统与合规档案系统的数据对接开发，预计6月底完成",
    operatorId: "u-004",
    createdAt: new Date("2025-05-25T10:00:00"),
  },
  {
    id: "rl-008",
    ticketId: "t-008",
    action: "邮件模板更新",
    description: "已为所有对外沟通邮件模板添加合规免责声明和保密提示条款",
    operatorId: "u-003",
    createdAt: new Date("2025-04-15T09:30:00"),
  },
  {
    id: "rl-009",
    ticketId: "t-011",
    action: "MFA方案评估",
    description: "完成远程VPN多因素认证方案评估，选定基于TOTP的MFA方案，准备实施部署",
    operatorId: "u-002",
    createdAt: new Date("2025-06-10T14:00:00"),
  },
  {
    id: "rl-010",
    ticketId: "t-010",
    action: "审计日志模块开发",
    description: "财务报表系统接口审计日志模块开发完成，正在集成测试中",
    operatorId: "u-005",
    createdAt: new Date("2025-06-15T16:30:00"),
  },
];

const reviewRecords = [
  {
    id: "rv-001",
    ticketId: "t-001",
    reviewerId: "u-003",
    opinion: ReviewOpinion.approved,
    comment: "权限回收完成，矩阵文档已更新，整改符合要求，同意关闭",
    createdAt: new Date("2025-04-10T14:00:00"),
  },
  {
    id: "rv-002",
    ticketId: "t-002",
    reviewerId: "u-003",
    opinion: ReviewOpinion.rejected,
    comment: "复核节点仅覆盖>5000元场景，需将所有金额段纳入双人复核范围",
    createdAt: new Date("2025-04-15T11:00:00"),
  },
  {
    id: "rv-003",
    ticketId: "t-002",
    reviewerId: "u-003",
    opinion: ReviewOpinion.approved,
    comment: "制度修订完善，双人复核已覆盖全金额段，整改到位",
    createdAt: new Date("2025-04-25T10:00:00"),
  },
  {
    id: "rv-004",
    ticketId: "t-007",
    reviewerId: "u-003",
    opinion: ReviewOpinion.approved,
    comment: "经评估当前加密方案在风险可控范围内，管理层决定接受风险，关闭工单",
    createdAt: new Date("2025-05-10T09:30:00"),
  },
  {
    id: "rv-005",
    ticketId: "t-008",
    reviewerId: "u-001",
    opinion: ReviewOpinion.approved,
    comment: "邮件模板已全部更新，抽样检查10封邮件均含免责声明，整改合格",
    createdAt: new Date("2025-04-20T15:00:00"),
  },
  {
    id: "rv-006",
    ticketId: "t-003",
    reviewerId: "u-003",
    opinion: ReviewOpinion.returned_for_modification,
    comment: "仅停用账号不够，需补充离职账号定期巡检机制和自动化告警",
    createdAt: new Date("2025-05-10T11:30:00"),
  },
  {
    id: "rv-007",
    ticketId: "t-012",
    reviewerId: "u-003",
    opinion: ReviewOpinion.approved,
    comment: "该合同归档问题已在新的OA系统升级中统一解决，工单不再适用",
    createdAt: new Date("2025-05-12T10:00:00"),
  },
  {
    id: "rv-008",
    ticketId: "t-010",
    reviewerId: "u-001",
    opinion: ReviewOpinion.returned_for_modification,
    comment: "审计日志模块需增加操作人IP记录和异常操作自动告警功能",
    createdAt: new Date("2025-06-18T14:30:00"),
  },
];

const emailMaterials = [
  {
    id: "em-001",
    ticketId: "t-001",
    subject: "ERP权限整改通知 - 信息技术部",
    sender: "zhangwei@company.com",
    recipients: "lina@company.com; it-permission@company.com",
    sentAt: new Date("2025-03-05T09:00:00"),
    bodyPreview: "关于ERP系统权限分配审计发现，请信息技术部于4月15日前完成权限回收和矩阵更新...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/ERP_Permission_Audit_Report.pdf",
    storagePath: "/compliance/emails/t-001/em-001",
    createdAt: new Date("2025-03-05T09:00:00"),
  },
  {
    id: "em-002",
    ticketId: "t-001",
    subject: "RE: ERP权限整改通知 - 权限回收完成",
    sender: "lina@company.com",
    recipients: "zhangwei@company.com; wangfang@company.com",
    sentAt: new Date("2025-03-20T16:30:00"),
    bodyPreview: "已完成5名员工权限回收，详见附件权限变更记录。矩阵文档同步更新...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/Permission_Change_Log.xlsx;https://storage.supabase.co/compliance/attachments/Permission_Matrix_v2.xlsx",
    storagePath: "/compliance/emails/t-001/em-002",
    createdAt: new Date("2025-03-20T16:30:00"),
  },
  {
    id: "em-003",
    ticketId: "t-002",
    subject: "财务审批流程整改要求",
    sender: "zhangwei@company.com",
    recipients: "chenmin@company.com; finance@company.com",
    sentAt: new Date("2025-03-12T10:00:00"),
    bodyPreview: "根据SOX合规审计发现，财务报销审批缺少双人复核机制，请财务部限期整改...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/SOX_Audit_Finding.pdf",
    storagePath: "/compliance/emails/t-002/em-003",
    createdAt: new Date("2025-03-12T10:00:00"),
  },
  {
    id: "em-004",
    ticketId: "t-002",
    subject: "RE: 财务审批流程整改要求 - 复核节点已上线",
    sender: "chenmin@company.com",
    recipients: "zhangwei@company.com; wangfang@company.com",
    sentAt: new Date("2025-04-02T11:00:00"),
    bodyPreview: "双人复核节点已在OA系统中配置完成，请审核。制度修订稿见附件...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/Approval_Workflow_Config.docx;https://storage.supabase.co/compliance/attachments/Expense_Policy_Rev4.3.pdf",
    storagePath: "/compliance/emails/t-002/em-004",
    createdAt: new Date("2025-04-02T11:00:00"),
  },
  {
    id: "em-005",
    ticketId: "t-003",
    subject: "离职员工账号安全风险警示",
    sender: "zhangwei@company.com",
    recipients: "lina@company.com; security@company.com",
    sentAt: new Date("2025-04-06T08:45:00"),
    bodyPreview: "审计发现3名离职员工账号仍处于激活状态，请立即停用并排查原因...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/Inactive_Account_Report.pdf",
    storagePath: "/compliance/emails/t-003/em-005",
    createdAt: new Date("2025-04-06T08:45:00"),
  },
  {
    id: "em-006",
    ticketId: "t-004",
    subject: "数据库日志保留期合规整改通知",
    sender: "zhangwei@company.com",
    recipients: "lina@company.com; dba@company.com",
    sentAt: new Date("2025-04-22T09:15:00"),
    bodyPreview: "数据库访问日志保留期仅30天，不满足180天合规要求，请调整日志保留策略...",
    attachmentUrls: "",
    storagePath: "/compliance/emails/t-004/em-006",
    createdAt: new Date("2025-04-22T09:15:00"),
  },
  {
    id: "em-007",
    ticketId: "t-007",
    subject: "客户数据加密合规评估结论",
    sender: "wangfang@company.com",
    recipients: "zhangwei@company.com; liuqiang@company.com; management@company.com",
    sentAt: new Date("2025-05-08T14:00:00"),
    bodyPreview: "经管理层评估，当前客户数据加密方案风险可控，建议接受风险并关闭工单...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/Data_Encryption_Risk_Assessment.pdf",
    storagePath: "/compliance/emails/t-007/em-007",
    createdAt: new Date("2025-05-08T14:00:00"),
  },
  {
    id: "em-008",
    ticketId: "t-008",
    subject: "邮件合规免责声明更新完成通知",
    sender: "wangfang@company.com",
    recipients: "all-staff@company.com",
    sentAt: new Date("2025-04-18T10:00:00"),
    bodyPreview: "所有对外沟通邮件模板已更新合规免责声明，请各部门确认使用新版模板...",
    attachmentUrls: "",
    storagePath: "/compliance/emails/t-008/em-008",
    createdAt: new Date("2025-04-18T10:00:00"),
  },
  {
    id: "em-009",
    ticketId: "t-011",
    subject: "VPN多因素认证实施方案",
    sender: "lina@company.com",
    recipients: "zhangwei@company.com; wangfang@company.com",
    sentAt: new Date("2025-06-05T15:30:00"),
    bodyPreview: "VPN MFA实施方案已完成评估，建议采用TOTP方案，预计7月中旬部署完成...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/VPN_MFA_Proposal.pdf",
    storagePath: "/compliance/emails/t-011/em-009",
    createdAt: new Date("2025-06-05T15:30:00"),
  },
  {
    id: "em-010",
    ticketId: "t-010",
    subject: "财务报表系统审计追踪功能开发进度",
    sender: "chenmin@company.com",
    recipients: "zhangwei@company.com; wangfang@company.com",
    sentAt: new Date("2025-06-12T11:00:00"),
    bodyPreview: "审计日志模块开发完成，正在进行集成测试，预计6月底上线...",
    attachmentUrls: "https://storage.supabase.co/compliance/attachments/Audit_Trail_Spec_v2.docx",
    storagePath: "/compliance/emails/t-010/em-010",
    createdAt: new Date("2025-06-12T11:00:00"),
  },
];

const remarkTasks = [
  {
    id: "rt-001",
    ticketId: "t-002",
    reviewId: "rv-002",
    description: "补充全员金额段双人复核覆盖方案，更新OA审批流程配置",
    priority: RemarkPriority.high,
    dueDate: new Date("2025-04-20"),
    completed: true,
    completedById: "u-005",
    completedAt: new Date("2025-04-22T09:00:00"),
    createdAt: new Date("2025-04-15T11:00:00"),
  },
  {
    id: "rt-002",
    ticketId: "t-003",
    reviewId: "rv-006",
    description: "制定离职账号定期巡检机制，部署自动化停用告警",
    priority: RemarkPriority.high,
    dueDate: new Date("2025-06-15"),
    completed: false,
    completedById: null,
    completedAt: null,
    createdAt: new Date("2025-05-10T11:30:00"),
  },
  {
    id: "rt-003",
    ticketId: "t-010",
    reviewId: "rv-008",
    description: "为审计日志模块增加操作人IP记录功能和异常操作自动告警",
    priority: RemarkPriority.medium,
    dueDate: new Date("2025-07-10"),
    completed: false,
    completedById: null,
    completedAt: null,
    createdAt: new Date("2025-06-18T14:30:00"),
  },
];

const shareLinks = [
  {
    id: "sl-001",
    token: "share-a1b2c3d4e5",
    createdById: "u-003",
    page: "funnel",
    ticketId: null,
    allowedRoles: "auditor,compliance_officer,management",
    expiresAt: new Date("2025-07-31T23:59:59"),
    createdAt: new Date("2025-06-01T10:00:00"),
  },
  {
    id: "sl-002",
    token: "share-f6g7h8i9j0",
    createdById: "u-001",
    page: "ticket",
    ticketId: "t-001",
    allowedRoles: "auditor,business_owner",
    expiresAt: new Date("2025-08-15T23:59:59"),
    createdAt: new Date("2025-06-10T14:30:00"),
  },
  {
    id: "sl-003",
    token: "share-k1l2m3n4o5",
    createdById: "u-004",
    page: "board",
    ticketId: null,
    allowedRoles: "management,compliance_officer",
    expiresAt: new Date("2025-09-01T23:59:59"),
    createdAt: new Date("2025-06-15T09:00:00"),
  },
];

const auditLogs = [
  {
    id: "al-001",
    userId: "u-001",
    action: "import",
    resource: "ImportRecord",
    details: { importId: "imp-001", fileName: "ERP_Audit_Export_2025Q1.xlsx" },
    createdAt: new Date("2025-03-01T09:30:00"),
  },
  {
    id: "al-002",
    userId: "u-001",
    action: "import",
    resource: "ImportRecord",
    details: { importId: "imp-002", fileName: "Permission_Log_March_2025.csv" },
    createdAt: new Date("2025-03-02T14:15:00"),
  },
  {
    id: "al-003",
    userId: "u-003",
    action: "review",
    resource: "Ticket",
    details: { ticketId: "t-001", opinion: "approved" },
    createdAt: new Date("2025-04-10T14:00:00"),
  },
  {
    id: "al-004",
    userId: "u-003",
    action: "review",
    resource: "Ticket",
    details: { ticketId: "t-002", opinion: "rejected" },
    createdAt: new Date("2025-04-15T11:00:00"),
  },
  {
    id: "al-005",
    userId: "u-003",
    action: "review",
    resource: "Ticket",
    details: { ticketId: "t-002", opinion: "approved" },
    createdAt: new Date("2025-04-25T10:00:00"),
  },
  {
    id: "al-006",
    userId: "u-003",
    action: "create_share",
    resource: "ShareLink",
    details: { shareId: "sl-001", page: "funnel" },
    createdAt: new Date("2025-06-01T10:00:00"),
  },
  {
    id: "al-007",
    userId: "u-001",
    action: "create_share",
    resource: "ShareLink",
    details: { shareId: "sl-002", page: "ticket", ticketId: "t-001" },
    createdAt: new Date("2025-06-10T14:30:00"),
  },
  {
    id: "al-008",
    userId: "u-003",
    action: "import",
    resource: "ImportRecord",
    details: { importId: "imp-003", fileName: "ERP_Audit_Export_2025Q2.xlsx" },
    createdAt: new Date("2025-06-01T10:00:00"),
  },
  {
    id: "al-009",
    userId: "u-002",
    action: "remediation_update",
    resource: "Ticket",
    details: { ticketId: "t-004", action: "日志策略调整" },
    createdAt: new Date("2025-05-05T15:45:00"),
  },
  {
    id: "al-010",
    userId: "u-004",
    action: "remediation_update",
    resource: "Ticket",
    details: { ticketId: "t-006", action: "培训档案系统对接" },
    createdAt: new Date("2025-05-25T10:00:00"),
  },
  {
    id: "al-011",
    userId: "u-003",
    action: "review",
    resource: "Ticket",
    details: { ticketId: "t-003", opinion: "returned_for_modification" },
    createdAt: new Date("2025-05-10T11:30:00"),
  },
  {
    id: "al-012",
    userId: "u-004",
    action: "create_share",
    resource: "ShareLink",
    details: { shareId: "sl-003", page: "board" },
    createdAt: new Date("2025-06-15T09:00:00"),
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.auditLog.deleteMany();
  await prisma.remarkTask.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.reviewRecord.deleteMany();
  await prisma.emailMaterial.deleteMany();
  await prisma.remediationLog.deleteMany();
  await prisma.importRecord.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  console.log("Creating tickets...");
  for (const ticket of tickets) {
    await prisma.ticket.create({ data: ticket });
  }

  console.log("Creating import records...");
  for (const record of importRecords) {
    await prisma.importRecord.create({ data: record });
  }

  console.log("Creating remediation logs...");
  for (const log of remediationLogs) {
    await prisma.remediationLog.create({ data: log });
  }

  console.log("Creating review records...");
  for (const record of reviewRecords) {
    await prisma.reviewRecord.create({ data: record });
  }

  console.log("Creating email materials...");
  for (const material of emailMaterials) {
    await prisma.emailMaterial.create({ data: material });
  }

  console.log("Creating remark tasks...");
  for (const task of remarkTasks) {
    await prisma.remarkTask.create({ data: task });
  }

  console.log("Creating share links...");
  for (const link of shareLinks) {
    await prisma.shareLink.create({ data: link });
  }

  console.log("Creating audit logs...");
  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log("Seed completed!");
  console.log(`  Users: ${users.length}`);
  console.log(`  Tickets: ${tickets.length}`);
  console.log(`  ImportRecords: ${importRecords.length}`);
  console.log(`  RemediationLogs: ${remediationLogs.length}`);
  console.log(`  ReviewRecords: ${reviewRecords.length}`);
  console.log(`  EmailMaterials: ${emailMaterials.length}`);
  console.log(`  RemarkTasks: ${remarkTasks.length}`);
  console.log(`  ShareLinks: ${shareLinks.length}`);
  console.log(`  AuditLogs: ${auditLogs.length}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
