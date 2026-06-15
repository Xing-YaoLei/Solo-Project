class FollowUp < ApplicationRecord
  enum :status, { pending: 0, contacted: 1, resolved: 2, closed: 3 }

  belongs_to :enrollment
  belongs_to :assistant, class_name: "User"

  validates :enrollment_id, presence: true
  validates :assistant_id, presence: true
  validates :reason, presence: true
  validates :next_follow_up_at, presence: true

  scope :due_today, -> { where(next_follow_up_at: Date.current.all_day) }
  scope :overdue, -> { where("next_follow_up_at < ?", Date.current.beginning_of_day) }
  scope :pending, -> { where(status: :pending) }

  delegate :user, :course, to: :enrollment, allow_nil: true

  def overdue?
    next_follow_up_at < Date.current.beginning_of_day && pending?
  end

  def days_behind
    return 0 unless enrollment&.behind_schedule?

    days_elapsed = (Date.current - enrollment.enrolled_at.to_date).to_i
    expected_daily_rate = enrollment.total_lessons_count.to_f / 30.0
    expected_progress = [days_elapsed * expected_daily_rate, enrollment.total_lessons_count].min
    actual_progress = enrollment.completed_lessons_count.to_i
    behind_lessons = (expected_progress - actual_progress).to_i
    [behind_lessons, 0].max
  end
end
