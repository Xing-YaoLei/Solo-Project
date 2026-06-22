require "faker"

puts "🌱 开始种子数据填充..."

admin_user = User.find_or_create_by!(email: "admin@example.com") do |u|
  u.name = "系统管理员"
  u.role = :admin
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
end
puts "✅ 管理员用户: admin@example.com / Password123!"

supervisor_user = User.find_or_create_by!(email: "supervisor@example.com") do |u|
  u.name = "李主管"
  u.role = :supervisor
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
end
puts "✅ 主管用户: supervisor@example.com / Password123!"

auditor1 = User.find_or_create_by!(email: "auditor1@example.com") do |u|
  u.name = "王审计"
  u.role = :auditor
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
end
auditor2 = User.find_or_create_by!(email: "auditor2@example.com") do |u|
  u.name = "张审核"
  u.role = :auditor
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
end
puts "✅ 审计专员用户 x2: auditor1@example.com / auditor2@example.com"

supplier_names = [
  "上海华信信息技术有限公司",
  "北京国科软件开发有限公司",
  "深圳智联电子科技有限公司",
  "广州恒通物流股份有限公司",
  "杭州云创数据服务有限公司",
  "南京锐驰网络科技有限公司",
  "成都蓝海通信技术有限公司",
  "武汉光谷智能制造有限公司"
]

suppliers = []
supplier_names.each_with_index do |name, idx|
  supplier = Supplier.find_or_create_by!(code: "SUP-#{format('%04d', idx + 1)}") do |s|
    s.name = name
    s.contact_person = Faker::Name.name
    s.phone = "1#{rand(3..9)}#{rand(100000000..999999999)}"
    s.email = Faker::Internet.email(domain: "company#{idx + 1}.com")
    s.status = :active
    s.description = Faker::Company.catch_phrase
    s.created_by = [admin_user, supervisor_user, auditor1, auditor2].sample
  end
  suppliers << supplier

  material_types = SupplierMaterial::MATERIAL_TYPES.sample(rand(3..6))
  material_types.each do |mt|
    status = %i[pending approved approved approved expired].sample
    expire_at = case status
                when :expired then rand(1..120).days.ago
                when :approved then rand(1..180).days.from_now
                else nil
                end

    SupplierMaterial.create!(
      supplier: supplier,
      material_type: mt,
      name: I18n.t("supplier_materials.types.#{mt}", default: mt.humanize),
      status: status,
      expire_at: expire_at,
      remark: status == :expired ? "已过期，请供应商重新提交" : nil,
      uploaded_by: [auditor1, auditor2, nil].sample
    )
  end

  PermissionConfig.create!(
    supplier: supplier,
    permission_type: %w[data_access audit_participation document_upload].sample,
    is_active: true,
    access_scope: {
      departments: %w[合规部 质量部 技术部].sample(rand(1..3)),
      systems: %w[ERP OA CRM].sample(rand(0..2)),
      data_range: %w[own department all].sample,
      features: %w[export download approve].sample(rand(0..3)),
      expires_at: 1.year.from_now
    },
    granted_by: supervisor_user
  )
end
puts "✅ 供应商 #{suppliers.count} 家，含材料与权限配置"

template1 = NotificationTemplate.find_or_create_by!(name: "供应商合规审计通报-通用版") do |t|
  t.creator = admin_user
  t.audit_type = "compliance_audit"
  t.content = <<~TEXT
    【供应商合规审计通报】

    尊敬的 {{supplier_name}}：

    现将本次「{{audit_title}}」审计情况通报如下：

    一、审计类型：{{audit_type}}
    二、审计周期：自 {{deadline}} 前提交整改材料
    三、对接人：{{handler}}

    请在规定时间内完成整改材料的补充。如有疑问，请及时与审计对接人联系。

    特此通报。

    合规审计部
  TEXT
  t.is_active = true
end

template2 = NotificationTemplate.find_or_create_by!(name: "质量审计通报-专项版") do |t|
  t.creator = supervisor_user
  t.audit_type = "quality_audit"
  t.content = <<~TEXT
    【质量审计专项通报】

    致：{{supplier_name}}

    根据 {{audit_type}} 工作安排，对「{{audit_title}}」项目进行质量审计。

    关键事项：
    1. 整改截止日期：{{deadline}}
    2. 对接负责人：{{handler}}
    3. 请按照检查清单逐项落实整改

    感谢配合！

    质量管理部
  TEXT
  t.is_active = true
end
puts "✅ 通报模板 x2 创建完成"

audit_titles = [
  "2026年Q2供应商合规审计",
  "信息安全专项审计",
  "年度质量体系复审",
  "财务合规检查",
  "新增供应商准入审计",
  "服务质量例行审计"
]

audits = []
5.times do |idx|
  supplier = suppliers[idx % suppliers.count]
  status = Audit.status.values[idx % Audit.status.values.count]
  creator = [auditor1, auditor2, auditor1, supervisor_user].sample

  audit = Audit.create!(
    supplier: supplier,
    creator: creator,
    template: [template1, template2, nil].sample,
    title: "#{supplier.name[0..8]} - #{audit_titles[idx]}",
    audit_type: Audit::AUDIT_TYPES[idx % Audit::AUDIT_TYPES.count],
    status: status,
    start_at: idx.days.ago,
    end_at: (idx + 14).days.from_now,
    conclusion: %w[approved archived].include?(status.to_s) ? "本次审计通过，各项指标符合要求。" : nil
  )
  audits << audit

  checklist_template = [
    { code: "CL-0001", content: "供应商营业执照核验", evidence: "营业执照扫描件或照片" },
    { code: "CL-0002", content: "供应商资质证书有效性核验", evidence: "资质证书扫描件" },
    { code: "CL-0003", content: "合同签署完整性检查", evidence: "合同扫描件（含签署页）" },
    { code: "CL-0004", content: "发票与财务记录核对", evidence: "发票复印件或财务凭证" },
    { code: "CL-0005", content: "质量验收报告检查", evidence: "质量验收单或检测报告" },
    { code: "CL-0006", content: "安全合规检查记录", evidence: "安全检查记录或证书" },
    { code: "CL-0007", content: "过往异常整改情况复核", evidence: "整改报告或关闭证明" },
    { code: "CL-0008", content: "供应商对接人权限确认", evidence: nil }
  ]

  checklist_template.each_with_index do |item, cidx|
    completed = cidx < rand(3..7)
    ChecklistItem.create!(
      audit: audit,
      item_code: item[:code],
      content: item[:content],
      status: completed ? %w[completed completed rejected].sample : "pending",
      evidence_required: item[:evidence],
      sort_order: cidx + 1,
      checked_by: completed ? creator : nil,
      checked_at: completed ? idx.days.ago + cidx.hours : nil,
      remark: completed && cidx == 2 ? "合同签署日期正确，盖章完整" : nil
    )
  end
end
puts "✅ 审计项目 #{audits.count} 个，含检查清单"

exception_count = 0
audits.first(3).each do |audit|
  next unless rand > 0.3

  missing = audit.checklist_items.where(status: "pending").where.not(evidence_required: nil).limit(rand(1..4)).to_a
  next if missing.empty?

  missing_items = missing.map do |item|
    {
      checklist_item_id: item.id,
      item_code: item.item_code,
      content: item.content,
      evidence_required: item.evidence_required
    }
  end

  severity = case missing_items.count
             when 4.. then :critical
             when 3 then :high
             when 2 then :medium
             else :low
             end
  statuses = %i[open assigned in_progress resolved closed]
  status = statuses[missing_items.count % statuses.count]
  handler = if %i[assigned in_progress resolved closed].include?(status)
              [auditor1, auditor2, supervisor_user].sample
            end

  ex = ExceptionOrder.create!(
    audit: audit,
    handler: handler,
    title: "[#{I18n.t('severities.' + severity.to_s)}]「#{audit.title[0..15]}」证据缺失异常（#{missing_items.count}项）",
    severity: severity,
    status: status,
    impact_scope: "涉及审计项目 #{audit.title}，关联供应商 #{audit.supplier.name}，共 #{missing_items.count} 项证据待补充。",
    responsibility: "审计专员：#{audit.creator.name}；供应商对接人：#{audit.supplier.contact_person}；审计主管：#{supervisor_user.name}。",
    conclusion: %i[resolved closed].include?(status) ? "供应商已补充相关证据，经验证符合要求，关闭此异常单。" : nil,
    missing_items: missing_items,
    due_at: case severity
            when :critical then 3.days.from_now
            when :high then 5.days.from_now
            when :medium then 7.days.from_now
            else 10.days.from_now
            end,
    resolved_at: %i[resolved closed].include?(status) ? Time.current : nil,
    auto_generated: true
  )
  exception_count += 1

  if ex.persisted? && auditor1 && ex.open?
    ex.log_transition(
      auditor1,
      nil,
      ex.status,
      "系统自动检测生成，严重等级：#{I18n.t('severities.' + ex.severity.to_s)}",
      { action: "create", auto_generated: true, missing_items_count: missing_items.count }
    )
  end

  if handler && ex.assigned?
    ex.log_transition(
      supervisor_user,
      :open,
      :assigned,
      "分派给 #{handler.name} 跟进处理",
      { action: "assign", handler_id: handler.id }
    )
  end

  if %i[resolved closed].include?(status) && handler
    ex.log_transition(
      supervisor_user,
      :in_progress,
      status,
      ex.conclusion,
      { action: status.to_s, conclusion: ex.conclusion }
    )
  end
end
puts "✅ 异常单 #{exception_count} 个（含状态流转日志）"

ExportRecord.create!(
  user: supervisor_user,
  export_type: "rectification_report",
  criteria: { start_date: 30.days.ago.to_date, end_date: Date.today, include_caliber_note: true },
  status: "completed",
  file_url: nil,
  caliber_note: "示例导出记录，可在报告导出页面创建新的导出任务。",
  expired_at: 7.days.from_now
)
puts "✅ 导出记录 x1 示例创建完成"

Notification.create!(
  user: auditor1,
  notification_type: "system_announcement",
  title: "欢迎使用合规审计供应商审计结算台",
  content: "系统已初始化完成，可在左侧菜单开始使用各项功能。",
  read: false
)
puts "✅ 系统通知 x1 创建完成"

puts ""
puts "🌿 种子数据填充完成！"
puts ""
puts "============================================"
puts "  登录账号说明（密码均为 Password123!）"
puts "============================================"
puts "  管理员:     admin@example.com       (全部权限)"
puts "  审计主管:   supervisor@example.com  (审批+配置)"
puts "  审计专员1:  auditor1@example.com    (日常操作)"
puts "  审计专员2:  auditor2@example.com    (日常操作)"
puts "============================================"
