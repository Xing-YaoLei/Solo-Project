class ExportRecord < ApplicationRecord
  include Searchable

  belongs_to :user

  validates :export_type, presence: true, length: { maximum: 50 }
  validates :user_id, presence: true
  validates :status, presence: true, length: { maximum: 20 }

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_type, ->(export_type) { where(export_type: export_type) }
  scope :by_status, ->(status) { where(status: status) }
  scope :pending, -> { where(status: "pending") }
  scope :processing, -> { where(status: "processing") }
  scope :completed, -> { where(status: "completed") }
  scope :failed, -> { where(status: "failed") }
  scope :expired, -> { where("expired_at <= ?", Date.today) }
  scope :not_expired, -> { where("expired_at > ? OR expired_at IS NULL", Date.today) }
  scope :created_between, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :recent, -> { order(created_at: :desc).limit(50) }

  store_attribute :criteria, :start_date, :date
  store_attribute :criteria, :end_date, :date
  store_attribute :criteria, :supplier_ids, :string, array: true, default: []
  store_attribute :criteria, :audit_types, :string, array: true, default: []
  store_attribute :criteria, :statuses, :string, array: true, default: []
  store_attribute :criteria, :include_caliber_note, :boolean, default: true

  EXPORT_TYPES = %w[
    audit_summary
    exception_summary
    rectification_report
    supplier_audit
    full_audit_record
  ].freeze

  STATUS_OPTIONS = %w[pending processing completed failed].freeze

  CALIBER_NOTES = {
    rectification_rate: <<~NOTE,
      整改完成率计算公式：已完成整改的异常单数 ÷ 异常单总数 × 100%
      统计周期：从 #{Date.today - 30.days} 至 #{Date.today}
      异常单状态说明：
      - 已完成：状态为 resolved 或 closed
      - 进行中：状态为 open、assigned 或 in_progress
      - 统计包含所有已创建的异常单，不包含已删除的记录
    NOTE
    audit_completeness: <<~NOTE
      审计完成率计算公式：已完成的审计项目数 ÷ 审计项目总数 × 100%
      审计项目状态说明：
      - 已完成：状态为 approved 或 archived
      - 进行中：状态为 in_progress、pending_evidence、pending_checklist、pending_notification、pending_approval
      - 待处理：状态为 draft、pending_materials
      - 已拒绝：状态为 rejected
    NOTE
  }.freeze

  def self.export_type_options
    EXPORT_TYPES.map do |type|
      [I18n.t("export_types.#{type}", default: type.humanize), type]
    end
  end

  def pending?
    status == "pending"
  end

  def processing?
    status == "processing"
  end

  def completed?
    status == "completed"
  end

  def failed?
    status == "failed"
  end

  def expired?
    expired_at.present? && expired_at <= Date.today
  end

  def downloadable?
    completed? && !expired? && file_url.present?
  end

  def status_color
    case status
    when "completed" then "green"
    when "processing" then "blue"
    when "pending" then "yellow"
    when "failed" then "red"
    else "gray"
    end
  end

  def file_size_human
    return nil unless file_size.present?
    ActiveSupport::NumberHelper.number_to_human_size(file_size)
  end

  def mark_processing!
    update!(status: "processing")
  end

  def mark_completed!(file_url, file_size = nil, file_name = nil)
    update!(
      status: "completed",
      file_url: file_url,
      file_size: file_size,
      file_name: file_name,
      expired_at: 7.days.from_now
    )
  end

  def mark_failed!(error_message = nil)
    update!(
      status: "failed",
      caliber_note: error_message
    )
  end

  def generate_caliber_note
    return if caliber_note.present?

    notes = []

    if export_type == "rectification_report" || export_type == "exception_summary"
      notes << CALIBER_NOTES[:rectification_rate]
    end

    if export_type == "audit_summary" || export_type == "full_audit_record"
      notes << CALIBER_NOTES[:audit_completeness]
    end

    if criteria.present?
      criteria_notes = []
      criteria_notes << "供应商范围：#{supplier_ids.present? ? supplier_ids.join(', ') : '全部供应商'}" if criteria.keys.include?("supplier_ids") || criteria.keys.include?(:supplier_ids)
      criteria_notes << "审计类型：#{audit_types.present? ? audit_types.join(', ') : '全部类型'}" if criteria.keys.include?("audit_types") || criteria.keys.include?(:audit_types)
      criteria_notes << "时间范围：#{start_date} 至 #{end_date}" if start_date.present? && end_date.present?
      notes << criteria_notes.join("\n") if criteria_notes.any?
    end

    update!(caliber_note: notes.join("\n\n"))
  end

  def self.purge_expired
    expired.find_each do |record|
      record.destroy
    end
  end
end
