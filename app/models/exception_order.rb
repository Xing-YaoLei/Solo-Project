class ExceptionOrder < ApplicationRecord
  include Searchable
  include Trackable

  extend Enumerize
  enumerize :severity, in: %i[low medium high critical], default: :medium, predicates: true
  enumerize :status, in: %i[open assigned in_progress resolved closed], default: :open, predicates: true, scope: :shallow

  belongs_to :audit
  belongs_to :handler, class_name: "User", optional: true
  has_many :state_transition_logs, foreign_key: "exception_id", dependent: :destroy

  attribute :missing_items, :json, default: []

  has_paper_trail only: [:title, :severity, :status, :impact_scope, :responsibility, :conclusion, :handler_id, :due_at]

  validates :title, presence: true, length: { maximum: 200 }
  validates :audit_id, presence: true

  scope :open, -> { where(status: %i[open assigned in_progress]) }
  scope :resolved, -> { where(status: %i[resolved closed]) }
  scope :by_severity, ->(severity) { where(severity: severity) }
  scope :by_handler, ->(handler_id) { where(handler_id: handler_id) }
  scope :by_audit, ->(audit_id) { where(audit_id: audit_id) }
  scope :due_soon, ->(days = 7) { where("due_at BETWEEN ? AND ? AND status NOT IN (?)", Date.today, days.days.from_now, %w[resolved closed]) }
  scope :overdue, -> { where("due_at <= ? AND status NOT IN (?)", Date.today, %w[resolved closed]) }
  scope :created_between, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :resolved_between, ->(start_date, end_date) { where(resolved_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :critical, -> { where(severity: :critical) }
  scope :high, -> { where(severity: :high) }
  scope :medium, -> { where(severity: :medium) }
  scope :low, -> { where(severity: :low) }

  STATUS_FLOW = {
    open: %i[assigned closed],
    assigned: %i[in_progress closed],
    in_progress: %i[resolved closed],
    resolved: %i[closed in_progress],
    closed: []
  }.freeze

  def self.severity_options
    %i[critical high medium low].map { |s| [I18n.t("severities.#{s}", default: s.to_s.humanize), s] }
  end

  def self.status_options
    %i[open assigned in_progress resolved closed].map { |s| [I18n.t("exception_statuses.#{s}", default: s.to_s.humanize), s] }
  end

  def can_transition_to?(target_status)
    STATUS_FLOW[status.to_sym]&.include?(target_status.to_sym)
  end

  def available_transitions
    STATUS_FLOW[status.to_sym] || []
  end

  def assign_to(user, remark = nil)
    return false unless can_transition_to?(:assigned)
    update!(status: :assigned, handler: user)
    log_transition(user, status, :assigned, remark, { action: "assign" })
    true
  end

  def start_progress(user, remark = nil)
    return false unless can_transition_to?(:in_progress)
    update!(status: :in_progress)
    log_transition(user, status, :in_progress, remark, { action: "start_progress" })
    true
  end

  def resolve(user, conclusion, remark = nil)
    return false unless can_transition_to?(:resolved)
    update!(
      status: :resolved,
      conclusion: conclusion,
      resolved_at: Time.current
    )
    log_transition(user, status, :resolved, remark, { action: "resolve", conclusion: conclusion })
    true
  end

  def close(user, remark = nil)
    return false unless can_transition_to?(:closed)
    update!(status: :closed)
    log_transition(user, status, :closed, remark, { action: "close" })
    true
  end

  def reopen(user, remark = nil)
    return false unless closed?
    update!(status: :in_progress, resolved_at: nil)
    log_transition(user, :closed, :in_progress, remark, { action: "reopen" })
    true
  end

  def overdue?
    due_at.present? && due_at <= Date.today && !resolved? && !closed?
  end

  def days_remaining
    return nil unless due_at.present?
    (due_at.to_date - Date.today).to_i
  end

  def resolution_time
    return nil unless resolved_at.present?
    ((resolved_at - created_at) / 1.day).round(1)
  end

  def severity_color
    case severity.to_sym
    when :critical then "red"
    when :high then "orange"
    when :medium then "yellow"
    when :low then "blue"
    end
  end

  def status_color
    case status.to_sym
    when :open, :assigned then "red"
    when :in_progress then "yellow"
    when :resolved then "green"
    when :closed then "gray"
    end
  end

  def auto_detect_impact_scope
    items = missing_items || []
    return if items.empty?

    scope_parts = []
    scope_parts << "涉及 #{items.count} 项证据缺失"

    audit_impact = audit&.title
    scope_parts << "影响审计项目：#{audit_impact}" if audit_impact

    supplier_impact = audit&.supplier&.name
    scope_parts << "涉及供应商：#{supplier_impact}" if supplier_impact

    update(impact_scope: scope_parts.join("；")) if impact_scope.blank?
  end

  def auto_assign_handler
    return if handler.present?

    default_handler = User.supervisors.active.first || User.admins.active.first
    update(handler: default_handler) if default_handler
  end
end
