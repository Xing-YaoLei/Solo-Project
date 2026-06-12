class AbnormalReport < ApplicationRecord
  belongs_to :waste_report

  enum :severity, { low: 0, medium: 1, high: 2 }

  validates :impact_scope, presence: true, on: :update
  validates :responsibility_attribution, presence: true, on: :update

  scope :unresolved, -> { where(resolved: false) }
  scope :resolved, -> { where(resolved: true) }
  scope :by_severity, ->(severity) { where(severity: severity) if severity.present? }
  scope :by_resolved, ->(resolved) { where(resolved: resolved) if [true, false].include?(resolved) }
  scope :recent, -> { order(created_at: :desc) }
  scope :this_month, -> { where(created_at: Time.current.all_month) }

  delegate :store_name, :report_date, :total_cost, :waste_rate, to: :waste_report, allow_nil: true

  before_save :set_resolved_at, if: :will_save_change_to_resolved?

  def resolve!(handling_result = nil, operator = "system")
    update!(
      handling_result: handling_result || self.handling_result || "已处理",
      resolved: true,
      resolved_at: Time.current
    )
  end

  def days_open
    return 0 if resolved_at.nil?

    ((resolved_at - created_at) / 1.day).round(1)
  end

  def days_pending
    ((Time.current - created_at) / 1.day).round(1)
  end

  def self.resolution_rate
    total = count
    return 0 if total.zero?

    (resolved.count.to_f / total * 100).round(1)
  end

  def self.avg_resolution_time
    resolved_with_time = resolved.where.not(resolved_at: nil)
    return 0 if resolved_with_time.empty?

    total_days = resolved_with_time.sum { |r| (r.resolved_at - r.created_at) / 1.day }
    (total_days / resolved_with_time.count).round(1)
  end

  def self.generate_from_waste_report(waste_report)
    return if waste_report.abnormal_report.present?
    return unless waste_report.abnormal?

    severity = waste_report.severity_level
    return if severity == :normal

    item_names = waste_report.waste_items.pluck(:product_name).join('、')
    reasons = waste_report.waste_items.pluck(:waste_reason).uniq.join('、')

    create!(
      waste_report: waste_report,
      severity: severity,
      impact_scope: "涉及产品: #{item_names}，损耗原因: #{reasons}，总成本: ¥#{sprintf('%.2f', waste_report.total_cost)}",
      responsibility_attribution: "#{waste_report.store_name} - #{waste_report.store_region || '未分配区域'}"
    )
  end

  private

  def set_resolved_at
    self.resolved_at = Time.current if resolved? && resolved_at.nil?
  end
end
