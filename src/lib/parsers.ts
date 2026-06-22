import type { RiskLevel } from './utils';

const HIGH_RISK_KEYWORDS = [
  'admin', '管理员', 'root', '越权', '敏感', '批量导出', '下载', '薪酬', '定价',
  'delete', '删除', '修改', 'update', '关审计', '审计关闭', 'turn off',
  '举报', '回扣', '利益关联', '异常', 'expired', '过期', '未通过', 'reject',
  '越级', '跳过', 'bypass', '500万', '5,000,000', '百万',
];

const MEDIUM_RISK_KEYWORDS = [
  '访问', 'access', '导出', 'export', '修改', 'modify', '采购', 'purchase',
  '合同', 'contract', '审批', 'approve', 'review', '法务', 'legal',
  '准入', 'onboarding', '资质', 'qualification', '归档', 'archive',
];

export function classifyRisk(text: string): RiskLevel {
  const lower = text.toLowerCase();
  if (HIGH_RISK_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return 'HIGH';
  if (MEDIUM_RISK_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return 'MEDIUM';
  return 'LOW';
}

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes('|')) return '|';
  if (line.includes(',')) return ',';
  if (line.includes(';')) return ';';
  return /\s{2,}/.test(line) ? /\s{2,}/.source : ',';
}

function splitLine(line: string, delimiter: string): string[] {
  return line
    .split(new RegExp(delimiter))
    .map((c) => c.trim().replace(/^"|"$/g, ''))
    .filter((c) => c.length > 0);
}

function detectColumns(header: string[]): Record<string, number> {
  const cols: Record<string, number> = {};
  header.forEach((h, i) => {
    const lower = h.toLowerCase();
    if (/\buser(id|name)?\b/.test(lower) || lower.includes('用户') || lower.includes('员工')) cols.userId = i;
    if (lower.includes('name') || lower.includes('姓名') || lower.includes('用户名')) cols.userName = i;
    if (lower.includes('action') || lower.includes('操作') || lower.includes('行为')) cols.action = i;
    if (lower.includes('resource') || lower.includes('资源') || lower.includes('路径') || lower.includes('url')) cols.resource = i;
    if (lower.includes('ip') || lower.includes('地址')) cols.ipAddress = i;
    if (lower.includes('time') || lower.includes('时间') || lower.includes('date') || lower.includes('日期')) cols.happenedAt = i;
    if (lower.includes('risk') || lower.includes('风险') || lower.includes('级别')) cols.riskLevel = i;
    if (lower.includes('doc') || lower.includes('单据') || lower.includes('编号') || lower.includes('no.')) cols.documentNo = i;
    if (lower.includes('type') || lower.includes('类型') || lower.includes('类别')) cols.documentType = i;
    if (lower.includes('amount') || lower.includes('金额') || lower.includes('price') || lower.includes('¥')) cols.amount = i;
    if (lower.includes('dept') || lower.includes('部门')) cols.department = i;
    if (lower.includes('operator') || lower.includes('操作人') || lower.includes('申请人')) cols.operator = i;
    if (lower.includes('approver') || lower.includes('审批人') || lower.includes('审核')) cols.approver = i;
    if (lower.includes('from') || lower.includes('发件人') || lower.includes('发送者')) cols.sender = i;
    if (lower.includes('to') || lower.includes('收件人') || lower.includes('接收者')) cols.recipients = i;
    if (lower.includes('subject') || lower.includes('主题') || lower.includes('标题')) cols.subject = i;
    if (lower.includes('summary') || lower.includes('摘要') || lower.includes('内容') || lower.includes('正文')) cols.summary = i;
    if (lower.includes('sent') || lower.includes('发送') || lower.includes('接收时间')) cols.sentAt = i;
  });
  return cols;
}

function parseDate(val: string | undefined, fallbackDaysAgo = 0): Date {
  if (!val) {
    const d = new Date();
    d.setDate(d.getDate() - fallbackDaysAgo);
    return d;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseAmount(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseRecipients(val: string | undefined): string {
  if (!val) return JSON.stringify(['management@company.com']);
  const list = val.split(/[,;，；]/).map((s) => s.trim()).filter(Boolean);
  return JSON.stringify(list.length ? list : ['management@company.com']);
}

const PERM_SAMPLE_ACTIONS = [
  '批量导出客户资料', '共享管理员账号登录', '越权审批付款',
  '访问敏感定价文档', '修改总账科目', '新增 IAM 管理员策略',
  '下载薪酬表', '关闭操作审计日志',
];

export interface ParsedPermissionLog {
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  riskLevel: RiskLevel;
  happenedAt: Date;
  _raw?: string;
}

export function parsePermissionLogs(
  raw: string,
  options?: { batchId?: string; idPrefix?: string },
): ParsedPermissionLog[] {
  const text = (raw ?? '').trim();
  if (!text) {
    return PERM_SAMPLE_ACTIONS.map((action, i) => ({
      userId: `u-sample-${i + 1}`,
      userName: ['钱进', '李华', '孙丽', '周凯', '陈伟', '刘洋', '赵敏', '王芳'][i % 8],
      action,
      resource: [
        '/api/customer/export', 'root@erp-node', 'FIN-PAY-*',
        '/confidential/pricing.xlsx', 'GL-ACCT-6601', 'IAM-POLICY-ADMIN',
        '/hr/salary/2026.xlsx', 'audit-log:switch-off',
      ][i],
      ipAddress: `10.10.${i + 1}.${20 + i}`,
      riskLevel: classifyRisk(action),
      happenedAt: parseDate(undefined, i),
    }));
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const delimiter = detectDelimiter(firstLine);
  const firstCells = splitLine(firstLine, delimiter);

  const hasHeader = firstCells.some((c) =>
    /(user|name|action|resource|ip|time|日期|操作|资源)/i.test(c),
  );

  let cols: Record<string, number> = {};
  let dataStart = 0;

  if (hasHeader) {
    cols = detectColumns(firstCells);
    dataStart = 1;
  } else {
    const sampleCells = firstCells.length >= 4 ? firstCells : splitLine(lines[0], ',');
    if (sampleCells.length >= 4) {
      cols = detectColumns(sampleCells);
    }
    if (Object.keys(cols).length < 2) {
      cols = { userId: 0, userName: 0, action: 1, resource: 2, ipAddress: 3, happenedAt: 4 };
    }
  }

  const results: ParsedPermissionLog[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    if (cells.length < 2) {
      const line = lines[i].trim();
      if (line.length < 10) continue;
      const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      const resourceMatch = line.match(/(\/\S+|\*[\w-]+\*|[\w-]+-\d+)/);
      const userMatch = line.match(/([\u4e00-\u9fa5]{2,4}|[a-zA-Z]+\s*[a-zA-Z]*)/);
      const actionDesc = line
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '')
        .replace(/(\/\S+|\*[\w-]+\*|[\w-]+-\d+)/g, '')
        .trim()
        .slice(0, 50) || PERM_SAMPLE_ACTIONS[i % PERM_SAMPLE_ACTIONS.length];

      results.push({
        userId: `u-gen-${i}`,
        userName: userMatch?.[1]?.trim() || `用户${String.fromCharCode(65 + (i % 26))}`,
        action: actionDesc,
        resource: resourceMatch?.[1] || '/misc/resource',
        ipAddress: ipMatch?.[0] || `10.0.0.${100 + i}`,
        riskLevel: classifyRisk(line),
        happenedAt: parseDate(undefined, i),
        _raw: line,
      });
      continue;
    }

    const get = (key: string, fallback = '') =>
      cols[key] !== undefined && cells[cols[key]] !== undefined ? cells[cols[key]] : fallback;

    const rawText = cells.join(' ');
    const action = get('action') || get('resource') || PERM_SAMPLE_ACTIONS[i % PERM_SAMPLE_ACTIONS.length];

    results.push({
      userId: get('userId') || `u-${i}`,
      userName: get('userName') || get('userId') || `用户${String.fromCharCode(65 + (i % 26))}`,
      action,
      resource: get('resource') || '/misc/resource',
      ipAddress: get('ipAddress') || `10.0.0.${100 + i}`,
      riskLevel: (get('riskLevel')?.toUpperCase() as RiskLevel) || classifyRisk(rawText),
      happenedAt: parseDate(get('happenedAt'), i),
    });
  }
  return results;
}

const ERP_SAMPLE_TYPES = [
  { no: 'PAY', type: 'PAYMENT', title: '付款审批流程越级操作' },
  { no: 'PO', type: 'PURCHASE', title: '供应商准入未通过合规评审' },
  { no: 'CT', type: 'CONTRACT', title: '合同条款缺失责任上限约定' },
];

export interface ParsedErpRecord {
  documentNo: string;
  documentType: string;
  amount: number | null;
  department: string;
  operator: string;
  approver: string;
  riskLevel: RiskLevel;
  happenedAt: Date;
  _title: string;
  _raw?: string;
}

export function parseErpRecords(raw: string): ParsedErpRecord[] {
  const text = (raw ?? '').trim();
  if (!text) {
    return ERP_SAMPLE_TYPES.map((t, i) => ({
      documentNo: `${t.no}-2026-${String(1000 + i * 7 + Math.floor(Math.random() * 100))}`,
      documentType: t.type,
      amount: 100000 + Math.floor(Math.random() * 5000000),
      department: ['采购部', '财务部', '市场部', '行政部', '法务部'][i % 5],
      operator: ['李华', '陈伟', '刘洋', '王磊', '周敏'][i % 5],
      approver: ['财务总监', 'CEO', '审计经理', '技术总监', '法务经理'][i % 5],
      riskLevel: classifyRisk(t.title),
      happenedAt: parseDate(undefined, i),
      _title: t.title,
    }));
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const delimiter = detectDelimiter(firstLine);
  const firstCells = splitLine(firstLine, delimiter);
  const hasHeader = firstCells.some((c) =>
    /(doc|no|type|amount|dept|operator|approver|单据|金额|部门|操作|审批)/i.test(c),
  );

  let cols: Record<string, number> = {};
  let dataStart = 0;
  if (hasHeader) {
    cols = detectColumns(firstCells);
    dataStart = 1;
  } else {
    cols = detectColumns(firstCells);
    if (Object.keys(cols).length < 2) {
      cols = { documentNo: 0, documentType: 1, amount: 2, department: 3, operator: 4, approver: 5 };
    }
  }

  const results: ParsedErpRecord[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    if (cells.length < 2) {
      const line = lines[i].trim();
      if (line.length < 10) continue;
      const amtMatch = line.match(/[¥$]?\s*([\d,]+(?:\.\d+)?)/);
      const docMatch = line.match(/([A-Z]{2,3}-[\d-]+|[\u4e00-\u9fa5]{2,6}(?:单据|合同))/);
      const deptMatch = line.match(/([\u4e00-\u9fa5]{2,4}(?:部|中心|室))/);
      const amt = parseAmount(amtMatch?.[1]);

      const sample = ERP_SAMPLE_TYPES[i % ERP_SAMPLE_TYPES.length];
      results.push({
        documentNo: docMatch?.[1] || `${sample.no}-2026-${1000 + i}`,
        documentType: sample.type,
        amount: amt ?? 200000 + Math.floor(Math.random() * 2000000),
        department: deptMatch?.[1] || ['采购部', '财务部', '市场部'][i % 3],
        operator: ['李华', '陈伟', '刘洋'][i % 3],
        approver: ['财务总监', 'CEO', '审计经理'][i % 3],
        riskLevel: classifyRisk(line),
        happenedAt: parseDate(undefined, i),
        _title: sample.title,
        _raw: line,
      });
      continue;
    }

    const get = (key: string, fallback = '') =>
      cols[key] !== undefined && cells[cols[key]] !== undefined ? cells[cols[key]] : fallback;

    const rawText = cells.join(' ');
    const sample = ERP_SAMPLE_TYPES[i % ERP_SAMPLE_TYPES.length];
    const docType = get('documentType') || sample.type;

    results.push({
      documentNo: get('documentNo') || `${sample.no}-2026-${1000 + i}`,
      documentType: docType,
      amount: parseAmount(get('amount')),
      department: get('department') || ['采购部', '财务部', '市场部'][i % 3],
      operator: get('operator') || ['李华', '陈伟', '刘洋'][i % 3],
      approver: get('approver') || ['财务总监', 'CEO', '审计经理'][i % 3],
      riskLevel: (get('riskLevel')?.toUpperCase() as RiskLevel) || classifyRisk(rawText),
      happenedAt: parseDate(get('happenedAt'), i),
      _title: get('summary') || get('documentType') || sample.title,
    });
  }
  return results;
}

const EMAIL_SAMPLE = [
  { subj: '【预警】批量导出敏感数据行为', sender: 'audit-alert@company.com', risk: 'HIGH' as RiskLevel, summary: '30 分钟内批量导出 1.2 万条客户信息，未走审批。' },
  { subj: '【法务】合同评审未通过反馈', sender: 'legal-review@company.com', risk: 'MEDIUM' as RiskLevel, summary: '合同未明确违约责任上限，建议退回重审。' },
  { subj: '供应商资质异常提醒', sender: 'vendor-risk@company.com', risk: 'HIGH' as RiskLevel, summary: '供应商资质已过期 47 天，仍在继续发生付款。' },
];

export interface ParsedEmail {
  subject: string;
  sender: string;
  recipients: string;
  summary: string;
  riskLevel: RiskLevel;
  sentAt: Date;
  _raw?: string;
}

export function parseEmailMaterials(raw: string): ParsedEmail[] {
  const text = (raw ?? '').trim();
  if (!text) {
    return EMAIL_SAMPLE.map((e, i) => ({
      subject: e.subj,
      sender: e.sender,
      recipients: JSON.stringify(['management@company.com', 'reviewer@company.com']),
      summary: e.summary,
      riskLevel: e.risk,
      sentAt: parseDate(undefined, i + 1),
    }));
  }

  const blocks = text
    .split(/\n\s*\n/)
    .filter((b) => b.trim().length > 10);

  if (blocks.length === 0) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    blocks.push(...lines);
  }

  const results: ParsedEmail[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();

    let subject = '';
    let sender = '';
    let recipients = '';
    let summary = '';
    let sentAt: Date | undefined;

    const subjectMatch = block.match(/(?:Subject|主题|标题)[:：]\s*(.+)/i);
    const fromMatch = block.match(/(?:From|发件人|来自)[:：]\s*([^\n<]+@[^\s>]+)/i);
    const toMatch = block.match(/(?:To|收件人|发送到)[:：]\s*(.+)/i);
    const dateMatch = block.match(/(?:Date|日期|时间|Sent)[:：]\s*(.+)/i);

    subject = subjectMatch?.[1]?.trim() || '';
    sender = fromMatch?.[1]?.trim() || '';
    recipients = toMatch ? parseRecipients(toMatch[1]) : '';
    if (dateMatch) sentAt = parseDate(dateMatch[1], i + 1);

    if (!subject) {
      const firstLine = block.split('\n')[0].trim();
      subject = firstLine.slice(0, 60) || EMAIL_SAMPLE[i % EMAIL_SAMPLE.length].subj;
    }
    if (!sender) {
      sender = EMAIL_SAMPLE[i % EMAIL_SAMPLE.length].sender;
    }
    if (!recipients) {
      recipients = JSON.stringify(['management@company.com', 'reviewer@company.com']);
    }

    const bodyStart = block.indexOf('\n\n');
    summary = bodyStart > 0
      ? block.slice(bodyStart).trim().slice(0, 200)
      : block.replace(/^(Subject|主题|From|发件人|To|收件人|Date|日期)[:：][^\n]*\n?/gim, '').trim().slice(0, 200);

    if (!summary) {
      summary = EMAIL_SAMPLE[i % EMAIL_SAMPLE.length].summary;
    }

    const fullText = subject + ' ' + summary;
    const risk = classifyRisk(fullText);

    results.push({
      subject,
      sender,
      recipients,
      summary,
      riskLevel: risk,
      sentAt: sentAt || parseDate(undefined, i + 1),
      _raw: block,
    });
  }

  return results.length > 0 ? results : EMAIL_SAMPLE.map((e, i) => ({
    subject: e.subj,
    sender: e.sender,
    recipients: JSON.stringify(['management@company.com', 'reviewer@company.com']),
    summary: e.summary,
    riskLevel: e.risk,
    sentAt: parseDate(undefined, i + 1),
  }));
}
