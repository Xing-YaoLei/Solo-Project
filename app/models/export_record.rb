class ExportRecord < ApplicationRecord
  STATUSES = %w[processing completed failed cancelled].freeze
  EXPORT_TYPES = %w[
    exam_pass_rates
    redemption_records
    refund_records
    student_list
    plagiarism_logs
    operation_logs
    member_profiles
  ].freeze

  belongs_to :operator, class_name: "User", optional: true

  validates :export_type, presence: true, inclusion: { in: EXPORT_TYPES }
  validates :status, inclusion: { in: STATUSES }

  scope :by_type, ->(type) { where(export_type: type) if type.present? }
  scope :by_operator, ->(operator_id) { where(operator_id: operator_id) if operator_id.present? }
  scope :recent, -> { order(created_at: :desc) }

  def generate_csv(data, headers, operator_name = nil)
    csv_content = CSV.generate(headers: true) do |csv|
      csv << ["导出类型:", export_type_name]
      csv << ["生成时间:", Time.current.strftime("%Y-%m-%d %H:%M:%S")]
      csv << ["操作人:", operator_name || operator&.name || "系统"]
      csv << ["筛选条件:", format_filter_conditions]
      csv << []
      csv << headers
      data.each do |row|
        csv << row
      end
    end
    update(status: "completed", generated_at: Time.current)
    csv_content
  end

  def export_type_name
    I18n.t("export_types.#{export_type}", default: export_type.humanize)
  end

  private

  def format_filter_conditions
    return "无" if filter_conditions.blank? || filter_conditions.empty?
    filter_conditions.map { |k, v| "#{k}=#{v}" }.join(", ")
  end
end
