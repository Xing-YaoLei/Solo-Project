class Todo < ApplicationRecord
  enum :status, { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }, default: :pending
  enum :priority, { low: 0, normal: 1, high: 2, urgent: 3 }, default: :normal

  belongs_to :assignee, class_name: "User", optional: true
  belongs_to :creator, class_name: "User", optional: true
  belongs_to :source, polymorphic: true, optional: true

  validates :title, presence: true

  scope :by_assignee, ->(assignee_id) { where(assignee_id: assignee_id) if assignee_id.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_priority, ->(priority) { where(priority: priority) if priority.present? }
  scope :overdue, -> { where("due_date < ? AND status != ?", Date.today, statuses[:completed]) }
  scope :due_today, -> { where(due_date: Date.today.beginning_of_day..Date.today.end_of_day, status: [:pending, :in_progress]) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_due_date, -> { order(Arel.sql("due_date IS NULL, due_date ASC")) }

  def self.ransackable_attributes(auth_object = nil)
    %w[assignee_id created_at creator_id description due_date id priority source_id source_type status title updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[assignee creator source]
  end

  def may_start?
    pending?
  end

  def may_complete?
    in_progress?
  end

  def may_cancel?
    pending? || in_progress?
  end

  def status_text
    I18n.t("enums.todo.status.#{status}", default: status.humanize)
  end

  def priority_text
    I18n.t("enums.todo.priority.#{priority}", default: priority.humanize)
  end
end
