class ExceptionRecord < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  belongs_to :order
  belongs_to :ticket, optional: true

  validates :exception_type, presence: true
  validates :title, presence: true, length: { maximum: 200 }
  validates :description, presence: true
  validates :impact_scope, presence: true, length: { maximum: 1000 }
  validates :responsible_person, length: { maximum: 100 }, allow_nil: true
  validates :assignee, length: { maximum: 100 }, allow_nil: true
  validates :conclusion, length: { maximum: 2000 }, allow_nil: true

  enum :status, { open: "open", assigned: "assigned", resolving: "resolving", closed: "closed" }, default: :open

  enum :exception_type, { refund_dispute: "refund_dispute", duplicate_ticket: "duplicate_ticket", checkin_error: "checkin_error", payment_mismatch: "payment_mismatch", other: "other" }

  aasm column: :status, enum: true do
    state :open, initial: true
    state :assigned
    state :resolving
    state :closed

    event :assign do
      transitions from: :open, to: :assigned, after: :set_assignee
    end

    event :start_resolve do
      transitions from: :assigned, to: :resolving
    end

    event :resolve do
      transitions from: :resolving, to: :closed, after: :record_closure
    end

    event :close do
      transitions from: %i[open assigned resolving], to: :closed, after: :record_closure
    end
  end

  def self.export_scope_description
    "按异常类型与状态筛选，包含影响范围与责任人信息，关闭结论完整保留"
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[exception_type title status assignee responsible_person created_at closed_at]
  end

  private

  def set_assignee
    self.responsible_person ||= assignee
  end

  def record_closure
    update_column(:closed_at, Time.current)
  end
end
