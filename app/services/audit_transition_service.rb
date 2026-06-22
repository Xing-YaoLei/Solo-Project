class AuditTransitionService < ApplicationService
  def initialize(audit, user, target_state, **options)
    super()
    @audit = audit
    @user = user
    @target_state = target_state.to_s
    @options = options
    @remark = options[:remark]
    @notify = options.fetch(:notify, true)
    @skip_evidence_check = options.fetch(:skip_evidence_check, false)
  end

  def call
    return fail("审计项目不存在") unless @audit
    return fail("无操作权限") unless can_transition?
    return fail("无法从 #{status_text(@audit.status)} 变更为 #{status_text(@target_state)}", :invalid_transition) unless valid_transition?

    if evidence_check_required? && !@skip_evidence_check
      missing_check_result = check_evidence_completeness
      return missing_check_result if missing_check_result.failure?
    end

    transaction do
      from_state = @audit.status
      @audit.update!(status: @target_state)

      @audit.log_transition(
        @user,
        from_state,
        @target_state,
        @remark,
        transition_metadata
      )

      trigger_business_logic(from_state)

      send_notifications if @notify

      succeed(@audit)
    end
  rescue ActiveRecord::RecordInvalid => e
    fail("状态变更失败：#{e.message}", :record_invalid)
  rescue Pundit::NotAuthorizedError
    fail("无操作权限", :unauthorized)
  end

  private

  def can_transition?
    Pundit.policy(@user, @audit).update?
  end

  def valid_transition?
    @audit.can_transition_to?(@target_state)
  end

  def status_text(state)
    I18n.t("audit_statuses.#{state}", default: state.to_s.humanize)
  end

  def transition_metadata
    {
      action: "status_transition",
      automated: false,
      notification_sent: @notify,
      previous_status: @audit.status_before_last_save || @audit.status,
      target_status: @target_state,
      options: @options.except(:notify, :remark, :skip_evidence_check).stringify_keys
    }
  end

  def evidence_check_required?
    %w[pending_notification pending_approval approved].include?(@target_state)
  end

  def check_evidence_completeness
    detection = EvidenceMissingDetectionService.call(@audit)
    if detection.failure?
      return fail("证据完整性检查失败：#{detection.errors.map { |e| e[:message] }.join('; ')}")
    end

    missing_items = detection.result[:missing_items]
    if missing_items.any?
      exception_service = ExceptionOrderGenerationService.call(
        @audit,
        missing_items,
        @user,
        auto_generated: true
      )
      if exception_service.success?
        fail("检测到 #{missing_items.count} 项证据缺失，已自动生成异常单，请先处理后再继续", :evidence_missing)
      else
        fail("证据缺失且自动生成异常单失败：#{exception_service.errors.map { |e| e[:message] }.join('; ')}")
      end
    else
      succeed(nil)
    end
  end

  def trigger_business_logic(from_state)
    case @target_state
    when "in_progress"
      initialize_checklist_if_needed
    when "pending_notification"
      generate_notification_content
    when "approved"
      archive_supplier_materials_if_needed
    when "archived"
      mark_related_exceptions_resolved
    when "rejected"
      record_rejection_reason
    end
  end

  def initialize_checklist_if_needed
    return if @audit.checklist_items.exists?

    template_checklist = default_checklist_template
    template_checklist.each_with_index do |item, index|
      @audit.checklist_items.create!(
        item_code: "CL-#{format('%04d', index + 1)}",
        content: item[:content],
        evidence_required: item[:evidence_required],
        status: "pending",
        sort_order: index + 1
      )
    end
  end

  def default_checklist_template
    [
      { content: "供应商营业执照核验", evidence_required: "营业执照扫描件或照片" },
      { content: "供应商资质证书有效性核验", evidence_required: "资质证书扫描件" },
      { content: "合同签署完整性检查", evidence_required: "合同扫描件（含签署页）" },
      { content: "发票与财务记录核对", evidence_required: "发票复印件或财务凭证" },
      { content: "质量验收报告检查", evidence_required: "质量验收单或检测报告" },
      { content: "安全合规检查记录", evidence_required: "安全检查记录或证书" },
      { content: "过往异常整改情况复核", evidence_required: "整改报告或关闭证明" },
      { content: "供应商对接人权限确认", evidence_required: nil }
    ]
  end

  def generate_notification_content
    return unless @audit.template.present?
    @audit.update!(
      notification_content: @audit.generate_notification,
      notification_generated_at: Time.current
    )
  end

  def archive_supplier_materials_if_needed
    supplier = @audit.supplier
    return unless supplier

    supplier.materials.where(status: :approved).find_each do |material|
      next unless material.expire_at.present? && material.expire_at <= Date.today
      material.update!(status: :expired)
    end
  end

  def mark_related_exceptions_resolved
    @audit.exception_orders.where(status: %i[open assigned in_progress]).find_each do |ex|
      ex.resolve(
        @user,
        "因审计项目归档自动关闭，原异常单状态：#{ex.status_text}",
        "审计项目已归档，关联异常单自动关闭"
      ) rescue nil
    end
  end

  def record_rejection_reason
    return unless @options[:rejection_reason].present?
    @audit.update!(rejection_reason: @options[:rejection_reason])
  end

  def send_notifications
    NotificationJob.perform_later(
      :audit_status_changed,
      audit_id: @audit.id,
      operator_id: @user.id,
      from_state: @audit.status_before_last_save,
      to_state: @target_state,
      remark: @remark
    )
  end
end
