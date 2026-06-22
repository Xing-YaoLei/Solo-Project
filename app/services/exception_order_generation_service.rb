class ExceptionOrderGenerationService < ApplicationService
  def initialize(audit, missing_items, user = nil, **options)
    super()
    @audit = audit
    @missing_items = Array(missing_items)
    @user = user
    @options = options
    @auto_generated = options.fetch(:auto_generated, false)
    @severity = options[:severity]
    @custom_title = options[:title]
    @custom_handler_id = options[:handler_id]
  end

  def call
    return fail("审计项目不存在") unless @audit
    return fail("缺失证据项列表不能为空") if @missing_items.empty?

    transaction do
      exception_order = build_exception_order
      exception_order.save!

      update_audit_reference(exception_order)

      if @user.present?
        exception_order.log_transition(
          @user,
          nil,
          exception_order.status,
          generation_remark,
          generation_metadata(exception_order)
        )
      end

      trigger_auto_assignment(exception_order)

      notify_stakeholders(exception_order)

      succeed(exception_order)
    end
  rescue ActiveRecord::RecordInvalid => e
    fail("异常单创建失败：#{e.message}", :record_invalid)
  rescue StandardError => e
    fail("异常单生成异常：#{e.message}", :system_error)
  end

  private

  def build_exception_order
    ExceptionOrder.new(
      audit: @audit,
      title: generate_title,
      severity: determine_severity,
      status: :open,
      impact_scope: generate_impact_scope,
      responsibility: generate_responsibility,
      missing_items: @missing_items,
      auto_generated: @auto_generated,
      due_at: default_due_date
    )
  end

  def generate_title
    return @custom_title if @custom_title.present?

    count = @missing_items.count
    prefix = @auto_generated ? "[系统自动生成]" : ""
    audit_title = @audit.title.truncate(30, omission: "...")
    "#{prefix}「#{audit_title}」证据缺失异常（#{count}项）"
  end

  def determine_severity
    return @severity if @severity.present? && ExceptionOrder.severity.values.include?(@severity.to_sym)

    count = @missing_items.count
    rate = completeness_rate

    if count >= 5 || rate < 50
      :critical
    elsif count >= 3 || rate < 70
      :high
    elsif count >= 2
      :medium
    else
      :low
    end
  end

  def completeness_rate
    required = @audit.checklist_items.requiring_evidence.where.not(status: "not_applicable").count
    return 100.0 if required.zero?

    uploaded = [required - @missing_items.count, 0].max
    (uploaded.to_f / required * 100).round(1)
  end

  def generate_impact_scope
    parts = []

    parts << "异常类型：审计证据缺失"
    parts << "涉及审计项目：#{@audit.title}（ID: #{@audit.id}）"
    parts << "供应商：#{@audit.supplier&.name || '未关联'}"

    code_list = @missing_items.map { |item| item[:item_code] || item["item_code"] }.compact
    parts << "涉及检查项：#{code_list.join('、')}" unless code_list.empty?

    content_list = @missing_items.map { |item| item[:content] || item["content"] }.compact.uniq
    parts << "问题描述：共 #{@missing_items.count} 项要求的证据材料未上传"
    content_list.first(3).each { |c| parts << "  - #{c.truncate(50)}" }
    parts << "  - ...共 #{content_list.count} 项" if content_list.count > 3

    parts << "审计类型：#{I18n.t("audit_types.#{@audit.audit_type}", default: @audit.audit_type.humanize)}" if @audit.audit_type.present?
    parts << "证据完整度：#{completeness_rate}%"

    parts.join("\n")
  end

  def generate_responsibility
    parts = []

    parts << "审计专员：#{@audit.creator&.name || '待指定'}（负责补充缺失证据）"

    if @audit.supplier.present?
      parts << "供应商对接人：#{@audit.supplier.contact_person || '待确认'}"
      parts << "供应商联系电话：#{@audit.supplier.phone || '待确认'}" if @audit.supplier.phone.present?
    end

    parts << "审计主管：待分派（负责审批整改方案和验收）"
    parts << "\n责任说明："
    parts << "1. 审计专员需在整改期限前协调供应商完成证据补充"
    parts << "2. 每完成一项证据补充，请及时更新相关检查项状态"
    parts << "3. 如有不可抗力因素导致无法按时完成，请提前向主管说明"

    parts.join("\n")
  end

  def generation_remark
    if @auto_generated
      "系统检测到证据缺失自动生成异常单，检测时间：#{I18n.l(Time.current, format: :long)}"
    else
      "手动创建异常单，创建人：#{@user&.name || '系统'}"
    end
  end

  def generation_metadata(exception_order)
    {
      action: "create",
      auto_generated: @auto_generated,
      missing_items_count: @missing_items.count,
      severity: exception_order.severity,
      completeness_rate: completeness_rate,
      creator_id: @user&.id
    }
  end

  def default_due_date
    case determine_severity
    when :critical then 3.business_days.from_now
    when :high then 5.business_days.from_now
    when :medium then 7.business_days.from_now
    else 10.business_days.from_now
    end
  rescue
    case determine_severity
    when :critical then 3.days.from_now
    when :high then 5.days.from_now
    when :medium then 7.days.from_now
    else 10.days.from_now
    end
  end

  def update_audit_reference(exception_order)
    return unless @audit.respond_to?(:latest_exception_order_id=)
  end

  def trigger_auto_assignment(exception_order)
    if @custom_handler_id.present?
      handler = User.find_by(id: @custom_handler_id)
      exception_order.assign_to(handler, "创建时指定分派") if handler.present?
    elsif @auto_generated
      exception_order.auto_detect_impact_scope
      exception_order.auto_assign_handler
    end
  end

  def notify_stakeholders(exception_order)
    if @user.present?
      NotificationJob.perform_later(
        :exception_created,
        exception_order_id: exception_order.id,
        creator_id: @user.id
      )
    end

    if exception_order.handler.present? && exception_order.assigned?
      NotificationJob.perform_later(
        :exception_assigned,
        exception_order_id: exception_order.id,
        assignor_id: @user&.id || exception_order.handler_id
      )
    end
  end
end
