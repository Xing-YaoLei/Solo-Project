class RectificationRateCalculator < ApplicationService
  def initialize(scope = nil, period = nil, **options)
    super()
    @scope = scope
    @period = normalize_period(period)
    @options = options
    @group_by = options[:group_by]
    @include_details = options.fetch(:include_details, true)
  end

  def call
    return fail("无效的时间范围") unless valid_period?

    result = {
      overall: calculate_overall,
      period: period_description,
      caliber_note: generate_caliber_note,
      calculated_at: Time.current
    }

    result[:by_severity] = calculate_by_severity if @include_details
    result[:by_audit_type] = calculate_by_audit_type if @include_details
    result[:by_supplier] = calculate_by_supplier if @include_details && @group_by == :supplier
    result[:trend] = calculate_trend if @include_details && @group_by == :trend
    result[:details] = generate_details if @options[:include_records]

    succeed(result)
  rescue StandardError => e
    fail("整改率计算失败：#{e.message}", :calculation_error)
  end

  private

  def normalize_period(period)
    case period
    when :last_7_days then { start: 7.days.ago.to_date, end: Date.today }
    when :last_30_days then { start: 30.days.ago.to_date, end: Date.today }
    when :last_90_days then { start: 90.days.ago.to_date, end: Date.today }
    when :this_month then { start: Date.today.beginning_of_month, end: Date.today }
    when :last_month then { start: Date.today.last_month.beginning_of_month, end: Date.today.last_month.end_of_month }
    when :this_quarter then { start: Date.today.beginning_of_quarter, end: Date.today }
    when :this_year then { start: Date.today.beginning_of_year, end: Date.today }
    when Hash then { start: period[:start]&.to_date, end: period[:end]&.to_date }
    when Array then { start: period[0]&.to_date, end: period[1]&.to_date }
    else { start: 30.days.ago.to_date, end: Date.today }
    end
  end

  def valid_period?
    return false unless @period[:start] && @period[:end]
    @period[:start] <= @period[:end]
  end

  def period_description
    "从 #{I18n.l(@period[:start])} 至 #{I18n.l(@period[:end])}"
  end

  def base_scope
    scope = ExceptionOrder.includes(:audit).where("created_at <= ?", @period[:end].end_of_day)
    scope = scope.where(audit_id: @scope.pluck(:id)) if @scope.is_a?(ActiveRecord::Relation) && @scope.klass == Audit
    scope = scope.by_audit(@scope.id) if @scope.is_a?(Audit)
    scope
  end

  def period_scope
    base_scope.where(created_at: @period[:start].beginning_of_day..@period[:end].end_of_day)
  end

  def resolved_scope
    base_scope.where(status: %i[resolved closed])
      .where("resolved_at IS NOT NULL AND resolved_at <= ?", @period[:end].end_of_day)
  end

  def calculate_overall
    total_count = period_scope.count
    resolved_count = period_scope.where(status: %i[resolved closed])
      .where("resolved_at BETWEEN ? AND ?", @period[:start].beginning_of_day, @period[:end].end_of_day)
      .count

    rate = total_count.zero? ? 0.0 : (resolved_count.to_f / total_count * 100).round(1)

    {
      total_exceptions: total_count,
      resolved_count: resolved_count,
      in_progress_count: period_scope.where(status: %i[open assigned in_progress]).count,
      overdue_count: period_scope.overdue.count,
      rate: rate,
      target_rate: 90.0,
      target_met: rate >= 90.0,
      delta_vs_target: (rate - 90.0).round(1),
      avg_resolution_time: calculate_avg_resolution_time
    }
  end

  def calculate_avg_resolution_time
    resolved_in_period = resolved_scope.where(
      resolved_at: @period[:start].beginning_of_day..@period[:end].end_of_day
    )
    return nil if resolved_in_period.empty?

    total_hours = resolved_in_period.sum do |ex|
      next 0 unless ex.resolved_at.present?
      ((ex.resolved_at - ex.created_at) / 1.hour).round(1)
    end

    (total_hours.to_f / resolved_in_period.count).round(1)
  end

  def calculate_by_severity
    %i[critical high medium low].each_with_object({}) do |severity, hash|
      scope = period_scope.where(severity: severity)
      total = scope.count
      resolved = scope.where(status: %i[resolved closed])
        .where("resolved_at BETWEEN ? AND ?", @period[:start].beginning_of_day, @period[:end].end_of_day)
        .count

      hash[severity] = {
        count: total,
        resolved: resolved,
        rate: total.zero? ? 0.0 : (resolved.to_f / total * 100).round(1),
        overdue: scope.overdue.count
      }
    end
  end

  def calculate_by_audit_type
    Audit::AUDIT_TYPES.each_with_object({}) do |audit_type, hash|
      scope = period_scope.joins(:audit).where(audits: { audit_type: audit_type })
      total = scope.count
      next if total.zero?

      resolved = scope.where(status: %i[resolved closed])
        .where("resolved_at BETWEEN ? AND ?", @period[:start].beginning_of_day, @period[:end].end_of_day)
        .count

      hash[audit_type] = {
        count: total,
        resolved: resolved,
        rate: (resolved.to_f / total * 100).round(1),
        label: I18n.t("audit_types.#{audit_type}", default: audit_type.humanize)
      }
    end
  end

  def calculate_by_supplier
    scope = period_scope.joins(audit: :supplier)
      .group("suppliers.id", "suppliers.name")
      .select("suppliers.id, suppliers.name, COUNT(*) as total_count")

    supplier_ids = scope.map(&:id)
    resolved_counts = period_scope.where(status: %i[resolved closed])
      .where("resolved_at BETWEEN ? AND ?", @period[:start].beginning_of_day, @period[:end].end_of_day)
      .joins(audit: :supplier)
      .group("suppliers.id")
      .count

    scope.each_with_object({}) do |row, hash|
      id = row["id"] || row.id
      name = row["name"] || row.name
      total = row["total_count"] || row.total_count
      resolved = resolved_counts[id] || 0

      hash[id] = {
        name: name,
        count: total,
        resolved: resolved,
        rate: total.zero? ? 0.0 : (resolved.to_f / total * 100).round(1)
      }
    end
  end

  def calculate_trend
    days = (@period[:end] - @period[:start]).to_i + 1
    return [] if days > 90

    result = []
    (0...days).each do |offset|
      date = @period[:start] + offset.days
      day_scope = base_scope.where("DATE(created_at) = ?", date)
      total = day_scope.count
      resolved = day_scope.where(status: %i[resolved closed]).where("DATE(resolved_at) = ?", date).count

      result << {
        date: date,
        total: total,
        resolved: resolved,
        rate: total.zero? ? 0.0 : (resolved.to_f / total * 100).round(1),
        cumulative_rate: cumulative_rate_to(date)
      }
    end
    result
  end

  def cumulative_rate_to(date)
    scope = base_scope.where("created_at <= ?", date.end_of_day)
    total = scope.count
    return 0.0 if total.zero?

    resolved = scope.where(status: %i[resolved closed])
      .where("resolved_at IS NOT NULL AND resolved_at <= ?", date.end_of_day)
      .count
    (resolved.to_f / total * 100).round(1)
  end

  def generate_details
    {
      open_exceptions: period_scope.where(status: %i[open assigned in_progress])
        .order(created_at: :desc)
        .limit(50)
        .pluck(:id, :title, :severity, :status, :created_at),
      recently_resolved: period_scope.where(status: %i[resolved closed])
        .where("resolved_at BETWEEN ? AND ?", @period[:start].beginning_of_day, @period[:end].end_of_day)
        .order(resolved_at: :desc)
        .limit(50)
        .pluck(:id, :title, :severity, :status, :resolved_at)
    }
  end

  def generate_caliber_note
    <<~NOTE
      === 整改完成率计算口径说明 ===
      1. 统计周期：#{period_description}
      2. 计算公式：整改完成率 = 周期内已整改完成的异常单数 ÷ 周期内创建的异常单总数 × 100%
      3. 已完成定义：异常单状态为 resolved（已解决）或 closed（已关闭），且 resolved_at 在统计周期内
      4. 进行中定义：异常单状态为 open（待分派）、assigned（已分派）或 in_progress（处理中）
      5. 逾期定义：due_at 早于当前日期，且状态不为 resolved 或 closed
      6. 目标值：整改完成率 ≥ 90%（可根据团队实际情况调整）
      7. 平均解决时长：周期内已解决异常单的 resolved_at - created_at 的平均值
      8. 统计排除：已删除的异常单不计入统计
      9. 严重等级划分：
         - critical（严重）：缺失项≥5 或 证据完整度<50%
         - high（高）：缺失项≥3 或 证据完整度<70%
         - medium（中）：缺失项≥2
         - low（低）：缺失项=1
    NOTE
  end
end
