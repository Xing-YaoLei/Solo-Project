class ReportDownload < ApplicationRecord
  REPORT_TYPES = %w[monthly_occupancy order_statistics cleaning_summary conflict_summary].freeze

  belongs_to :reporter, class_name: "User"

  validates :report_type, inclusion: { in: REPORT_TYPES }
  validates :generated_at, presence: true
  validates :file_name, presence: true

  scope :for_reporter, ->(user_id) { where(reporter_id: user_id) }
  scope :recent, -> { order(generated_at: :desc) }

  before_validation :set_generated_at, on: :create

  def report_type_i18n
    I18n.t("report_types.#{report_type}", default: report_type)
  end

  def filters_display
    return "无筛选条件" if filters.blank? || filters.empty?
    filters.map { |k, v| "#{I18n.t("filter_fields.#{k}", default: k.to_s.humanize)}: #{v}" }.join("; ")
  end

  private

  def set_generated_at
    self.generated_at ||= Time.current
  end
end
