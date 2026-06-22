class EvidenceMissingDetectionService < ApplicationService
  def initialize(audit, **options)
    super()
    @audit = audit
    @options = options
    @auto_create_exception = options.fetch(:auto_create_exception, true)
    @severity_threshold = options.fetch(:severity_threshold, 3)
  end

  def call
    return fail("审计项目不存在") unless @audit

    missing_items = detect_missing_evidence
    severity = calculate_severity(missing_items)

    result = {
      missing_items: missing_items,
      severity: severity,
      total_required: total_required_items,
      uploaded_count: @audit.evidence_attachments.count,
      completeness_rate: calculate_completeness_rate(missing_items),
      checked_at: Time.current
    }

    if missing_items.any? && @auto_create_exception && severity_requires_exception?(severity)
      exception_service = ExceptionOrderGenerationService.call(
        @audit,
        missing_items,
        nil,
        auto_generated: true,
        severity: severity
      )
      result[:exception_order] = exception_service.result if exception_service.success?
    end

    succeed(result)
  rescue StandardError => e
    fail("证据缺失检测失败：#{e.message}", :detection_error)
  end

  private

  def detect_missing_evidence
    checklist_items = @audit.checklist_items.requiring_evidence.where.not(status: "not_applicable")
    uploaded_types = @audit.evidence_attachments.pluck(:evidence_type, :name).flatten.compact.map(&:to_s)

    checklist_items.map do |item|
      next if evidence_matched_for_item?(item, uploaded_types)

      {
        checklist_item_id: item.id,
        item_code: item.item_code,
        content: item.content,
        evidence_required: item.evidence_required,
        status: item.status,
        required_type: infer_evidence_type(item.evidence_required)
      }
    end.compact
  end

  def evidence_matched_for_item?(item, uploaded_types)
    evidence_desc = item.evidence_required.to_s.downcase
    uploaded_files = @audit.evidence_attachments

    uploaded_files.any? do |attachment|
      attachment_name = attachment.name.to_s.downcase
      attachment_type = attachment.evidence_type.to_s.downcase

      matches_keyword?(evidence_desc, attachment_name) ||
        matches_keyword?(evidence_desc, attachment_type) ||
        related_by_description?(evidence_desc, attachment.description.to_s.downcase)
    end
  end

  def matches_keyword?(required, uploaded)
    return false if required.blank? || uploaded.blank?

    keywords = extract_keywords(required)
    keywords.any? { |kw| uploaded.include?(kw) }
  end

  def related_by_description?(required, desc)
    return false if required.blank? || desc.blank?
    (extract_keywords(required) & extract_keywords(desc)).any?
  end

  def extract_keywords(text)
    text.to_s.downcase.scan(/[\u4e00-\u9fa5a-zA-Z0-9]+/).reject do |word|
      word.length < 2 || STOP_WORDS.include?(word)
    end.uniq
  end

  def infer_evidence_type(evidence_required)
    desc = evidence_required.to_s
    case desc
    when /营业执照|经营许可/ then "business_license"
    when /资质|证书|认证/ then "certificate"
    when /合同|协议/ then "contract"
    when /发票|财务|凭证/ then "invoice"
    when /报告|检测|验收/ then "report"
    when /邮件|截图/ then "screenshot"
    when /会议|纪要/ then "meeting_minutes"
    else "other"
    end
  end

  def total_required_items
    @audit.checklist_items.requiring_evidence.where.not(status: "not_applicable").count
  end

  def calculate_completeness_rate(missing_items)
    required = total_required_items
    return 100.0 if required.zero?

    uploaded = [required - missing_items.count, 0].max
    (uploaded.to_f / required * 100).round(1)
  end

  def calculate_severity(missing_items)
    count = missing_items.count
    return :none if count.zero?

    rate = calculate_completeness_rate(missing_items)

    if count >= @severity_threshold || rate < 50
      :critical
    elsif count >= 2 || rate < 70
      :high
    elsif count >= 1 || rate < 90
      :medium
    else
      :low
    end
  end

  def severity_requires_exception?(severity)
    %i[medium high critical].include?(severity)
  end

  STOP_WORDS = %w[
    的 了 和 是 在 有 我 他 她 它 这 那 些 什么 一个 一些 以及
    需要 提供 上传 提交 扫描 复印 照片 原件 副本 或 与 及 等
    the a an and or of in on at to for with is are was were be been
    have has had do does did will would could should may might must
  ].freeze
end
