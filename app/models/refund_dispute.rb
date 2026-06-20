class RefundDispute < ApplicationRecord
  belongs_to :ticket_order
  belongs_to :handler, class_name: "User"
  has_many :dispute_logs, dependent: :destroy

  validates :reason, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending processing resolved rejected cancelled] }
  validates :reporter_name, presence: true

  scope :pending, -> { where(status: "pending") }
  scope :processing, -> { where(status: "processing") }
  scope :resolved, -> { where(status: "resolved") }
  scope :by_event, ->(event_id) { joins(:ticket_order).where(ticket_orders: { event_id: event_id }) }
  scope :recent, -> { order(created_at: :desc) }

  after_create :notify_handler
  after_create :log_creation

  def resolve!(handler_action, handler_remark, operator)
    closed_at = Time.current
    update!(status: "resolved", handler_action: handler_action, handler_remark: handler_remark, closed_at: closed_at)
    dispute_logs.create!(
      operator: operator,
      action_type: "resolved",
      handler_action: handler_action,
      reason: handler_remark,
      closed_at: closed_at
    )
  end

  def reject!(handler_action, handler_remark, operator)
    closed_at = Time.current
    update!(status: "rejected", handler_action: handler_action, handler_remark: handler_remark, closed_at: closed_at)
    dispute_logs.create!(
      operator: operator,
      action_type: "rejected",
      handler_action: handler_action,
      reason: handler_remark,
      closed_at: closed_at
    )
  end

  def start_processing!(operator)
    update!(status: "processing")
    dispute_logs.create!(operator: operator, action_type: "processing", reason: "开始处理退票争议")
  end

  private

  def notify_handler
    RefundDisputeNotificationJob.perform_later(id)
  end

  def log_creation
    dispute_logs.create!(operator: handler, action_type: "created", reason: reason)
  end
end
