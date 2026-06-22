import { PrismaClient, UserRole, TicketStatus, ReviewOpinion, ClosureReason } from '@prisma/client'

const prisma = new PrismaClient()

const departments = ['信息技术部', '风控合规部', '运营管理部', '采购部', '财务部', '人力资源部']

const users = [
  { email: 'admin@company.com', name: '系统管理员', role: 'compliance_officer' as UserRole, department: '风控合规部' },
  { email: 'auditor1@company.com', name: '张明', role: 'auditor' as UserRole, department: '风控合规部' },
  { email: 'auditor2@company.com', name: '李华', role: 'auditor' as UserRole, department: '风控合规部' },
  { email: 'business1@company.com', name: '王强', role: 'business_owner' as UserRole, department: '信息技术部' },
  { email: 'business2@company.com', name: '赵丽', role: 'business_owner' as UserRole, department: '运营管理部' },
  { email: 'business3@company.com', name: '孙伟', role: 'business_owner' as UserRole, department: '采购部' },
  { email: 'management@company.com', name: '陈总', role: 'management' as UserRole, department: '管理层' },
  { email: 'compliance@company.com', name: '合规官', role: 'compliance_officer' as UserRole, department: '风控合规部' },
]

const ticketTitles = [
  { title: '财务系统权限异常访问', description: '发现未授权用户访问财务核心系统，存在数据泄露风险', department: '财务部', status: 'pending_review' as TicketStatus },
  { title: '采购审批流程违规', description: '多笔采购订单未按规定流程审批，存在合规风险', department: '采购部', status: 'in_remediation' as TicketStatus },
  { title: '敏感数据导出未记录', description: '运营部门导出客户敏感数据未留下操作日志', department: '运营管理部', status: 'pending_remediation' as TicketStatus },
  { title: '用户权限未及时清理', description: '15名离职员工账号未及时禁用，存在安全隐患', department: '信息技术部', status: 'closed' as TicketStatus, closureReason: 'remediated' as ClosureReason },
  { title: 'ERP系统登录异常', description: '发现异地IP批量尝试登录ERP系统', department: '信息技术部', status: 'in_remediation' as TicketStatus },
  { title: '合规培训未完成', description: '32名员工未完成年度合规培训', department: '人力资源部', status: 'pending_review' as TicketStatus },
  { title: '合同审批流程缺陷', description: '多份合同未经过法务审核即签署', department: '运营管理部', status: 'closed' as TicketStatus, closureReason: 'remediated' as ClosureReason },
  { title: '数据备份验证失败', description: '财务系统备份数据连续3次验证失败', department: '信息技术部', status: 'in_remediation' as TicketStatus },
  { title: '供应商准入不合规', description: '5家新增供应商未完成尽职调查', department: '采购部', status: 'pending_remediation' as TicketStatus },
  { title: '费用报销违规', description: '多笔差旅费报销不符合公司规定标准', department: '财务部', status: 'pending_review' as TicketStatus },
  { title: '网络访问控制不当', description: '开发环境与生产环境网络未有效隔离', department: '信息技术部', status: 'closed' as TicketStatus, closureReason: 'remediated' as ClosureReason },
  { title: '客户数据泄露风险', description: '客服系统存在SQL注入漏洞，可能泄露客户信息', department: '信息技术部', status: 'in_remediation' as TicketStatus },
  { title: '内部审计发现问题未整改', description: '上年内部审计发现的3项问题未按时整改', department: '风控合规部', status: 'pending_remediation' as TicketStatus },
  { title: '印章管理不规范', description: '公章使用登记不全，存在印章滥用风险', department: '运营管理部', status: 'closed' as TicketStatus, closureReason: 'risk_accepted' as ClosureReason },
  { title: '反洗钱监测异常', description: '3笔大额交易未按规定上报反洗钱系统', department: '财务部', status: 'pending_review' as TicketStatus },
  { title: '权限分级执行不到位', description: '运维人员拥有超越职责范围的系统权限', department: '信息技术部', status: 'in_remediation' as TicketStatus },
  { title: '数据保留期限不合规', description: '部分交易数据保留期限超出监管要求', department: '运营管理部', status: 'pending_remediation' as TicketStatus },
  { title: '第三方接入安全评估缺失', description: '8家第三方合作方未进行年度安全评估', department: '采购部', status: 'pending_review' as TicketStatus },
  { title: '密码策略不符合要求', description: '业务系统密码复杂度要求未达监管标准', department: '信息技术部', status: 'closed' as TicketStatus, closureReason: 'remediated' as ClosureReason },
  { title: '内控自评工作未完成', description: 'Q2内控自评工作进度滞后', department: '风控合规部', status: 'pending_remediation' as TicketStatus },
]

function generateTicketNo(index: number): string {
  const year = 2024
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const num = String(index + 1).padStart(4, '0')
  return `AUD-${year}${month}-${num}`
}

function randomDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date
}

async function main() {
  console.log('开始种子数据初始化...')

  for (const userData of users) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          passwordHash: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        },
      })
      console.log(`创建用户: ${userData.name} (${userData.email})`)
    }
  }

  const createdUsers = await prisma.user.findMany()
  const auditors = createdUsers.filter((u) => u.role === 'auditor' || u.role === 'compliance_officer')
  const businessOwners = createdUsers.filter((u) => u.role === 'business_owner')

  const existingTickets = await prisma.ticket.count()
  if (existingTickets === 0) {
    for (let i = 0; i < ticketTitles.length; i++) {
      const ticketData = ticketTitles[i]
      const auditor = auditors[Math.floor(Math.random() * auditors.length)]
      const assignee = businessOwners.find((u) => u.department === ticketData.department) ||
        businessOwners[Math.floor(Math.random() * businessOwners.length)]

      const createdAt = randomDate(60)
      const ticket = await prisma.ticket.create({
        data: {
          ticketNo: generateTicketNo(i),
          title: ticketData.title,
          description: ticketData.description,
          department: ticketData.department,
          status: ticketData.status,
          closureReason: ticketData.closureReason || null,
          assigneeId: assignee.id,
          auditorId: auditor.id,
          dueDate: randomDate(30),
          createdAt,
          updatedAt: createdAt,
          firstResolution: ticketData.status === 'closed' && ticketData.closureReason === 'remediated' && Math.random() > 0.3,
        },
      })

      console.log(`创建工单: ${ticket.ticketNo} - ${ticket.title}`)

      await prisma.remediationLog.create({
        data: {
          ticketId: ticket.id,
          action: '创建工单',
          description: '系统自动创建审计整改工单',
          operatorId: auditor.id,
          createdAt,
        },
      })

      if (ticketData.status === 'in_remediation') {
        await prisma.remediationLog.create({
          data: {
            ticketId: ticket.id,
            action: '开始整改',
            description: `${assignee.name}已启动整改工作`,
            operatorId: assignee.id,
            createdAt: new Date(createdAt.getTime() + 86400000),
          },
        })
      }

      if (ticketData.status === 'pending_review') {
        await prisma.remediationLog.create({
          data: {
            ticketId: ticket.id,
            action: '提交复核',
            description: '整改完成，提交合规部门复核',
            operatorId: assignee.id,
            createdAt: new Date(createdAt.getTime() + 172800000),
          },
        })
      }

      if (ticketData.status === 'closed') {
        const reviewDate = new Date(createdAt.getTime() + 259200000)
        const opinion: ReviewOpinion = ticketData.closureReason === 'remediated' ? 'approved' : 'approved'

        await prisma.reviewRecord.create({
          data: {
            ticketId: ticket.id,
            opinion,
            comment: ticketData.closureReason === 'remediated'
              ? '整改措施到位，风险已消除，同意关闭。'
              : '经评估，该风险在可接受范围内，同意风险接受。',
            reviewerId: auditor.id,
            createdAt: reviewDate,
          },
        })

        await prisma.remediationLog.create({
          data: {
            ticketId: ticket.id,
            action: '复核通过',
            description: '合规部门复核通过，工单关闭。',
            operatorId: auditor.id,
            createdAt: reviewDate,
          },
        })
      }

      if (Math.random() > 0.4) {
        await prisma.emailMaterial.create({
          data: {
            ticketId: ticket.id,
            subject: `关于【${ticket.title}】的整改说明邮件`,
            sender: assignee.email,
            recipients: auditor.email,
            sentAt: new Date(createdAt.getTime() + 43200000),
            bodyPreview: `尊敬的${auditor.name}：\n\n关于审计发现的"${ticket.title}"问题，我们已经进行了详细调查并制定了整改方案。\n\n具体措施如下：\n1. 成立专项整改小组\n2. 制定详细整改计划\n3. 明确责任人和时间节点\n\n预计在${ticket.dueDate ? ticket.dueDate.toLocaleDateString() : '规定时间'}内完成全部整改工作。\n\n此致\n${assignee.name}`,
            storagePath: `/emails/${ticket.id}/evidence_${i}.eml`,
          },
        })
        console.log(`  └─ 创建关联邮件材料`)
      }
    }

    const tickets = await prisma.ticket.findMany({ take: 5, where: { status: 'pending_review' } })
    for (const ticket of tickets) {
      const reviewer = auditors[Math.floor(Math.random() * auditors.length)]
      const opinion = Math.random() > 0.5 ? 'rejected' as ReviewOpinion : 'returned_for_modification' as ReviewOpinion
      const comment = opinion === 'rejected'
        ? '整改措施不充分，未能从根本上解决问题，需要重新制定整改方案。'
        : '整改材料不够完整，请补充相关证明材料后再次提交。'

      const review = await prisma.reviewRecord.create({
        data: {
          ticketId: ticket.id,
          opinion,
          comment,
          reviewerId: reviewer.id,
        },
      })

      await prisma.remarkTask.create({
        data: {
          ticketId: ticket.id,
          reviewId: review.id,
          description: `复核${opinion === 'rejected' ? '不通过' : '退回修改'}：${comment.substring(0, 80)}...`,
          priority: opinion === 'rejected' ? 'high' : 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      await prisma.remarkTask.create({
        data: {
          ticketId: ticket.id,
          reviewId: review.id,
          description: opinion === 'rejected' ? '重新制定整改方案并提交审核' : '按照复核意见补充整改材料',
          priority: opinion === 'rejected' ? 'high' : 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      console.log(`创建复核记录: ${ticket.ticketNo} - ${REVIEW_OPINION_LABELS[opinion]}`)
    }
  }

  console.log('\n种子数据初始化完成！')
  console.log(`用户数量: ${await prisma.user.count()}`)
  console.log(`工单数量: ${await prisma.ticket.count()}`)
  console.log(`邮件材料数量: ${await prisma.emailMaterial.count()}`)
  console.log(`复核记录数量: ${await prisma.reviewRecord.count()}`)
  console.log(`备注任务数量: ${await prisma.remarkTask.count()}`)
  console.log('\n测试账号密码: password123')
  console.log('管理员账号: admin@company.com')
  console.log('合规官账号: compliance@company.com')
  console.log('审计员账号: auditor1@company.com, auditor2@company.com')
  console.log('业务负责人账号: business1@company.com, business2@company.com, business3@company.com')
  console.log('管理层账号: management@company.com')
}

const REVIEW_OPINION_LABELS: Record<ReviewOpinion, string> = {
  approved: '复核通过',
  rejected: '复核不通过',
  returned_for_modification: '退回修改',
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
