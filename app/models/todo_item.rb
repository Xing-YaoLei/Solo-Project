class TodoItem < ApplicationRecord
  belongs_to :settlement, optional: true
  belongs_to :discrepancy, optional: true
  belongs_to :assignee, class_name: 'User'
  belongs_to :assigner, class_name: 'User', optional: true

  enum :priority, { low: 0, medium: 1, high: 2, urgent: 3 }
  enum :status, { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }

  validates :title, presence: true
  validates :priority, presence: true
  validates :status, presence: true

  scope :by_assignee, ->(assignee_id) { where(assignee_id: assignee_id) }
  scope :by_assigner, ->(assigner_id) { where(assigner_id: assigner_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :by_settlement, ->(settlement_id) { where(settlement_id: settlement_id) }
  scope :by_discrepancy, ->(discrepancy_id) { where(discrepancy_id: discrepancy_id) }
  scope :overdue, -> { where('due_date < ? AND status != ?', Date.today, statuses[:completed]) }
  scope :due_soon, -> { where(due_date: Date.today..7.days.from_now) }
  scope :ordered_by_priority, -> { order(priority: :desc, due_date: :asc) }
  scope :incomplete, -> { where(status: [:pending, :in_progress]) }
end
