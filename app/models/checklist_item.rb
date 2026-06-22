class ChecklistItem < ApplicationRecord
  include Searchable

  belongs_to :audit
  belongs_to :checked_by, class_name: "User", optional: true

  has_paper_trail only: [:item_code, :content, :status, :evidence_required, :remark, :checked_at]

  validates :item_code, presence: true, length: { maximum: 50 }
  validates :content, presence: true
  validates :status, presence: true, length: { maximum: 20 }

  scope :by_status, ->(status) { where(status: status) }
  scope :pending, -> { where(status: "pending") }
  scope :completed, -> { where(status: "completed") }
  scope :rejected, -> { where(status: "rejected") }
  scope :not_applicable, -> { where(status: "not_applicable") }
  scope :requiring_evidence, -> { where.not(evidence_required: [nil, ""]) }
  scope :by_sort_order, -> { order(sort_order: :asc, created_at: :asc) }
  scope :checked_by, ->(user_id) { where(checked_by_id: user_id) }

  STATUS_OPTIONS = %w[pending completed rejected not_applicable].freeze

  def self.status_options
    STATUS_OPTIONS.map { |status| [I18n.t("checklist_statuses.#{status}", default: status.humanize), status] }
  end

  def pending?
    status == "pending"
  end

  def completed?
    status == "completed"
  end

  def rejected?
    status == "rejected"
  end

  def not_applicable?
    status == "not_applicable"
  end

  def requires_evidence?
    evidence_required.present?
  end

  def evidence_uploaded?
    audit.evidence_attachments.exists?
  end

  def status_color
    case status
    when "completed" then "green"
    when "rejected" then "red"
    when "not_applicable" then "gray"
    else "yellow"
    end
  end

  def mark_completed(user, remark = nil)
    update!(
      status: "completed",
      checked_by: user,
      checked_at: Time.current,
      remark: remark
    )
  end

  def mark_rejected(user, remark = nil)
    update!(
      status: "rejected",
      checked_by: user,
      checked_at: Time.current,
      remark: remark
    )
  end

  def mark_not_applicable(user, remark = nil)
    update!(
      status: "not_applicable",
      checked_by: user,
      checked_at: Time.current,
      remark: remark
    )
  end

  def reset(user = nil)
    update!(
      status: "pending",
      checked_by: nil,
      checked_at: nil,
      remark: nil
    )
  end
end
