class StateTransitionLog < ApplicationRecord
  include Searchable

  belongs_to :audit, optional: true
  belongs_to :exception_order, foreign_key: "exception_id", optional: true
  belongs_to :operator, class_name: "User"

  validates :operator_id, presence: true
  validates :to_state, presence: true, length: { maximum: 50 }
  validates :from_state, length: { maximum: 50 }, allow_blank: true

  scope :by_audit, ->(audit_id) { where(audit_id: audit_id) }
  scope :by_exception, ->(exception_id) { where(exception_order_id: exception_id) }
  scope :by_operator, ->(operator_id) { where(operator_id: operator_id) }
  scope :by_state, ->(state) { where(to_state: state) }
  scope :latest, -> { order(created_at: :desc) }
  scope :oldest, -> { order(created_at: :asc) }
  scope :created_between, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }

  store_attribute :metadata, :action, :string
  store_attribute :metadata, :conclusion, :string
  store_attribute :metadata, :automated, :boolean, default: false
  store_attribute :metadata, :notification_sent, :boolean, default: false
  store_attribute :metadata, :changes, :json, default: {}

  def loggable
    audit || exception_order
  end

  def state_transition_text
    if from_state.present?
      "#{from_state.humanize} → #{to_state.humanize}"
    else
      "初始状态: #{to_state.humanize}"
    end
  end

  def operator_name
    operator&.name || "系统自动"
  end

  def time_ago
    I18n.l(created_at, format: :short)
  end

  def full_timestamp
    I18n.l(created_at, format: :long)
  end

  def icon
    case to_state
    when /approved|resolved|closed|completed/ then "check-circle"
    when /rejected|reopen/ then "x-circle"
    when /pending/ then "clock"
    when /in_progress|assigned/ then "play"
    else "arrow-right"
    end
  end

  def color
    case to_state
    when /approved|resolved|closed|completed/ then "green"
    when /rejected|reopen/ then "red"
    when /pending/ then "yellow"
    when /in_progress|assigned/ then "blue"
    else "gray"
    end
  end

  def self.timeline_for(loggable)
    where("audit_id = ? OR exception_order_id = ?", loggable.id, loggable.id)
      .order(created_at: :asc)
  end

  def self.recent_for_user(user, limit = 20)
    where(operator_id: user.id)
      .order(created_at: :desc)
      .limit(limit)
  end
end
