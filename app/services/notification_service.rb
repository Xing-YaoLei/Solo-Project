class NotificationService < ApplicationService
  def initialize(notification_type, **params)
    super()
    @notification_type = notification_type.to_s
    @params = params
  end

  def call
    case @notification_type
    when "audit_status_changed" then handle_audit_status_changed
    when "exception_created" then handle_exception_created
    when "exception_assigned" then handle_exception_assigned
    when "exception_resolved" then handle_exception_resolved
    when "exception_overdue" then handle_exception_overdue
    when "evidence_missing" then handle_evidence_missing
    when "export_completed" then handle_export_completed
    when "export_failed" then handle_export_failed
    when "material_expiring" then handle_material_expiring
    when "system_announcement" then handle_system_announcement
    else
      fail("不支持的通知类型：#{@notification_type}")
    end
  end

  private

  def handle_audit_status_changed
    audit_id = @params[:audit_id]
    operator_id = @params[:operator_id]
    from_state = @params[:from_state]
    to_state = @params[:to_state]
    remark = @params[:remark]

    audit = Audit.find_by(id: audit_id)
    return fail("审计项目不存在") unless audit

    operator = User.find_by(id: operator_id)
    return fail("操作人不存在") unless operator

    recipients = collect_audit_recipients(audit, operator)
    title = build_audit_status_title(audit, to_state)
    content = build_audit_status_content(audit, operator, from_state, to_state, remark)

    create_notifications(recipients, audit, title, content)
    send_email_notifications(recipients, title, content) if should_send_email?

    succeed(notification_count: recipients.uniq.size)
  end

  def handle_exception_created
    exception_id = @params[:exception_order_id]
    creator_id = @params[:creator_id]

    exception = ExceptionOrder.find_by(id: exception_id)
    return fail("异常单不存在") unless exception

    creator = creator_id ? User.find_by(id: creator_id) : nil

    recipients = collect_exception_recipients(exception)
    title = "新异常单创建：#{exception.title}"
    content = if creator
                "#{creator.name} 创建了异常单「#{exception.title}」（严重等级：#{I18n.t("severities.#{exception.severity}")}），请及时处理。"
              else
                "系统自动检测到证据缺失，生成异常单「#{exception.title}」，严重等级：#{I18n.t("severities.#{exception.severity}")}。"
              end
    content += " 影响范围：#{exception.impact_scope}" if exception.impact_scope.present?

    create_notifications(recipients, exception, title, content)
    send_email_notifications(recipients, title, content) if should_send_email?

    succeed(notification_count: recipients.uniq.size)
  end

  def handle_exception_assigned
    exception_id = @params[:exception_order_id]
    assignor_id = @params[:assignor_id]

    exception = ExceptionOrder.find_by(id: exception_id)
    return fail("异常单不存在") unless exception
    return fail("异常单未分派处理人") unless exception.handler

    assignor = User.find_by(id: assignor_id)
    recipient = exception.handler

    title = "异常单分派通知"
    content = if assignor && assignor != recipient
                "#{assignor.name} 将异常单「#{exception.title}」分派给您处理，截止时间：#{I18n.l(exception.due_at, format: :long)}"
              else
                "系统已将异常单「#{exception.title}」分派给您处理，请及时跟进，截止时间：#{I18n.l(exception.due_at, format: :long)}"
              end

    create_notifications([recipient], exception, title, content)
    send_email_notifications([recipient], title, content) if should_send_email?

    succeed(notification_count: 1)
  end

  def handle_exception_resolved
    exception_id = @params[:exception_order_id]
    resolver_id = @params[:resolver_id]

    exception = ExceptionOrder.find_by(id: exception_id)
    return fail("异常单不存在") unless exception

    resolver = User.find_by(id: resolver_id)
    recipients = collect_resolved_recipients(exception, resolver)

    title = "异常单已解决：#{exception.title}"
    resolver_name = resolver&.name || "系统"
    content = "#{resolver_name} 已将异常单「#{exception.title}」标记为已解决。"
    content += " 处理结论：#{exception.conclusion}" if exception.conclusion.present?

    create_notifications(recipients, exception, title, content)
    send_email_notifications(recipients, title, content) if should_send_email?

    succeed(notification_count: recipients.uniq.size)
  end

  def handle_exception_overdue
    exception_id = @params[:exception_order_id]

    exception = ExceptionOrder.find_by(id: exception_id)
    return fail("异常单不存在") unless exception

    recipients = collect_overdue_recipients(exception)

    title = "⚠️ 异常单已逾期：#{exception.title}"
    content = "异常单「#{exception.title}」已超过截止时间（#{I18n.l(exception.due_at, format: :long)}），请尽快处理。"
    content += " 当前处理人：#{exception.handler&.name || '待分派'}"

    create_notifications(recipients, exception, title, content)
    send_email_notifications(recipients, title, content) if should_send_email?

    succeed(notification_count: recipients.uniq.size)
  end

  def handle_evidence_missing
    audit_id = @params[:audit_id]
    missing_count = @params[:missing_count] || 0

    audit = Audit.find_by(id: audit_id)
    return fail("审计项目不存在") unless audit

    recipients = [audit.creator] + User.supervisors.active.to_a

    title = "⚠️ 证据缺失提醒：#{audit.title}"
    content = "审计项目「#{audit.title}」检测到 #{missing_count} 项证据缺失，请及时补充后再推进流程。"

    create_notifications(recipients.uniq, audit, title, content)
    succeed(notification_count: recipients.uniq.size)
  end

  def handle_export_completed
    export_id = @params[:export_id]

    export_record = ExportRecord.find_by(id: export_id)
    return fail("导出记录不存在") unless export_record

    recipient = export_record.user

    title = "✅ 导出完成"
    content = "您的导出任务「#{I18n.t("export_types.#{export_record.export_type}")}」已完成，文件有效期至 #{I18n.l(export_record.expired_at, format: :long)}，请及时下载。"

    create_notifications([recipient], export_record, title, content)
    send_email_notifications([recipient], title, content) if should_send_email?

    succeed(notification_count: 1)
  end

  def handle_export_failed
    export_id = @params[:export_id]
    error_message = @params[:error_message] || "未知错误"

    export_record = ExportRecord.find_by(id: export_id)
    return fail("导出记录不存在") unless export_record

    recipient = export_record.user

    title = "❌ 导出失败"
    content = "您的导出任务失败：#{error_message}，请重新尝试或联系管理员。"

    create_notifications([recipient], export_record, title, content)
    send_email_notifications([recipient], title, content) if should_send_email?

    succeed(notification_count: 1)
  end

  def handle_material_expiring
    supplier_material_ids = @params[:supplier_material_ids] || []
    return succeed(notification_count: 0) if supplier_material_ids.empty?

    materials = SupplierMaterial.where(id: supplier_material_ids).includes(:supplier)
    return fail("材料记录不存在") if materials.empty?

    recipients = User.supervisors.active.to_a + User.admins.active.to_a
    materials.each do |material|
      material_supplier = material.supplier
      if material_supplier&.created_by
        recipients << material_supplier.created_by
      end
    end
    recipients.uniq!

    expiring_count = materials.expiring_soon.count
    expired_count = materials.expired.count

    title = "⚠️ 供应商材料到期提醒"
    parts = []
    parts << "有 #{expiring_count} 份材料即将到期" if expiring_count > 0
    parts << "有 #{expired_count} 份材料已过期" if expired_count > 0
    content = parts.join("，") + "，请及时处理。"

    create_notifications(recipients, nil, title, content)
    send_email_notifications(recipients, title, content) if should_send_email?

    succeed(notification_count: recipients.size)
  end

  def handle_system_announcement
    title = @params[:title]
    content = @params[:content]
    target_role = @params[:target_role]

    return fail("公告标题不能为空") if title.blank?
    return fail("公告内容不能为空") if content.blank?

    recipients = case target_role&.to_s
                 when "auditor" then User.auditors.active
                 when "supervisor" then User.supervisors.active
                 when "admin" then User.admins.active
                 when "all" then User.active
                 else User.active
                 end

    create_notifications(recipients.to_a, nil, title, content)
    send_email_notifications(recipients.to_a, title, content) if should_send_email?

    succeed(notification_count: recipients.size)
  end

  def collect_audit_recipients(audit, operator)
    recipients = []
    recipients << audit.creator if audit.creator
    recipients += User.supervisors.active.to_a
    recipients << audit.supplier&.created_by if audit.supplier&.created_by
    recipients -= [operator] if operator
    recipients.uniq.compact
  end

  def collect_exception_recipients(exception)
    recipients = []
    recipients << exception.audit&.creator if exception.audit&.creator
    recipients += User.supervisors.active.to_a
    recipients << exception.handler if exception.handler
    recipients.uniq.compact
  end

  def collect_resolved_recipients(exception, resolver)
    recipients = []
    recipients << exception.audit&.creator if exception.audit&.creator
    recipients += User.supervisors.active.to_a
    recipients << exception.handler if exception.handler
    recipients -= [resolver] if resolver
    recipients.uniq.compact
  end

  def collect_overdue_recipients(exception)
    recipients = []
    recipients << exception.handler if exception.handler
    recipients += User.supervisors.active.to_a
    recipients << exception.audit&.creator if exception.audit&.creator
    recipients.uniq.compact
  end

  def build_audit_status_title(audit, to_state)
    case to_state
    when "pending_approval" then "审计待审批：#{audit.title}"
    when "approved" then "✅ 审计已通过：#{audit.title}"
    when "rejected" then "❌ 审计被拒绝：#{audit.title}"
    when "archived" then "📦 审计已归档：#{audit.title}"
    else
      "审计状态变更：#{audit.title}"
    end
  end

  def build_audit_status_content(audit, operator, from_state, to_state, remark)
    from_text = I18n.t("audit_statuses.#{from_state}", default: from_state.to_s.humanize)
    to_text = I18n.t("audit_statuses.#{to_state}", default: to_state.to_s.humanize)
    content = "#{operator.name} 将审计项目「#{audit.title}」的状态从「#{from_text}」变更为「#{to_text}」。"
    content += " 备注：#{remark}" if remark.present?
    content
  end

  def create_notifications(recipients, notifiable, title, content)
    recipients.uniq.compact.each do |user|
      Notification.create!(
        user: user,
        notifiable: notifiable,
        notification_type: @notification_type,
        title: title,
        content: content
      )
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error("通知创建失败 user=#{user.id} error=#{e.message}")
    end
  end

  def send_email_notifications(recipients, title, content)
    recipients.uniq.compact.each do |user|
      next unless user.email.present?
      NotificationMailer.with(user: user, title: title, content: content)
        .generic_notification.deliver_later
    rescue StandardError => e
      Rails.logger.error("邮件发送失败 user=#{user.id} error=#{e.message}")
    end
  end

  def should_send_email?
    Rails.application.config.respond_to?(:enable_email_notifications) &&
      Rails.application.config.enable_email_notifications
  rescue
    false
  end
end
