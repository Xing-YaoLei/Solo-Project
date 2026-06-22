class Audit < ApplicationRecord
  include Searchable
  include Trackable

  extend Enumerize
  enumerize :status, in: %i[
    draft
    pending_materials
    in_progress
    pending_evidence
    pending_checklist
    pending_notification
    pending_approval
    approved
    rejected
    archived
  ], default: :draft, predicates: true, scope: :shallow

  belongs_to :supplier
  belongs_to :creator, class_name: "User"
  belongs_to :template, class_name: "NotificationTemplate", optional: true

  has_many :evidence_attachments, dependent: :destroy
  has_many :checklist_items, dependent: :destroy
  has_many :exception_orders, dependent: :destroy
  has_many :state_transition_logs, dependent: :destroy

  has_paper_trail only: [:title, :audit_type, :status, :start_at, :end_at, :conclusion, :template_id]

  validates :title, presence: true, length: { maximum: 200 }
  validates :audit_type, presence: true, length: { maximum: 50 }
  validates :supplier_id, presence: true
  validates :creator_id, presence: true

  scope :active, -> { where.not(status: %i[archived rejected]) }
  scope :pending, -> { where(status: %i[pending_materials pending_evidence pending_checklist pending_notification pending_approval]) }
  scope :in_progress, -> { where(status: :in_progress) }
  scope :completed, -> { where(status: %i[approved archived]) }
  scope :by_audit_type, ->(type) { where(audit_type: type) }
  scope :by_supplier, ->(supplier_id) { where(supplier_id: supplier_id) }
  scope :by_creator, ->(creator_id) { where(creator_id: creator_id) }
  scope :created_between, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :due_soon, ->(days = 7) { where("end_at BETWEEN ? AND ?", Date.today, days.days.from_now) }
  scope :overdue, -> { where("end_at <= ? AND status NOT IN (?)", Date.today, %w[approved archived rejected]) }

  AUDIT_TYPES = %w[
    routine_audit
    special_audit
    compliance_audit
    quality_audit
    safety_audit
    financial_audit
  ].freeze

  STATUS_FLOW = {
    draft: %i[pending_materials],
    pending_materials: %i[in_progress rejected],
    in_progress: %i[pending_evidence rejected],
    pending_evidence: %i[pending_checklist in_progress rejected],
    pending_checklist: %i[pending_notification pending_evidence rejected],
    pending_notification: %i[pending_approval pending_checklist rejected],
    pending_approval: %i[approved rejected pending_notification],
    approved: %i[archived],
    rejected: %i[pending_materials],
    archived: []
  }.freeze

  def self.audit_type_options
    AUDIT_TYPES.map { |type| [I18n.t("audit_types.#{type}", default: type.humanize), type] }
  end

  def can_transition_to?(target_status)
    STATUS_FLOW[status.to_sym]&.include?(target_status.to_sym)
  end

  def available_transitions
    STATUS_FLOW[status.to_sym] || []
  end

  def evidence_completeness
    required = checklist_items.where.not(evidence_required: [nil, ""]).count
    return 100 if required.zero?
    uploaded = evidence_attachments.count
    [(uploaded.to_f / required * 100).round(1), 100].min
  end

  def checklist_progress
    return 0 if checklist_items.count.zero?
    (checklist_items.where(status: "completed").count.to_f / checklist_items.count * 100).round(1)
  end

  def pending_exceptions_count
    exception_orders.where(status: %i[open assigned in_progress]).count
  end

  def has_pending_exceptions?
    pending_exceptions_count > 0
  end

  def can_approve?(user)
    pending_approval? && user.can_approve_audits?
  end

  def overdue?
    end_at.present? && end_at <= Date.today && !approved? && !archived? && !rejected?
  end

  def days_remaining
    return nil unless end_at.present?
    (end_at.to_date - Date.today).to_i
  end

  def duration_days
    return nil unless start_at.present? && end_at.present?
    (end_at.to_date - start_at.to_date).to_i + 1
  end

  def generate_notification
    return nil unless template.present?
    template.render(
      supplier_name: supplier.name,
      audit_title: title,
      audit_type: audit_type,
      deadline: end_at&.strftime("%Y-%m-%d"),
      handler: creator.name
    )
  end

  def missing_evidence_items
    checklist_items.where(status: "pending").where.not(evidence_required: [nil, ""])
  end

  def has_missing_evidence?
    missing_evidence_items.exists?
  end
end
