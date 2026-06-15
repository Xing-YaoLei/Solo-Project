class LessonProgress < ApplicationRecord
  enum :status, { not_started: 0, in_progress: 1, completed: 2 }

  belongs_to :enrollment
  belongs_to :lesson

  validates :enrollment_id, presence: true
  validates :lesson_id, presence: true

  after_save :update_enrollment_progress

  def start!
    return unless not_started?
    update(status: :in_progress, started_at: Time.current)
  end

  def complete!
    return if completed?
    update(status: :completed, completed_at: Time.current)
  end

  private

  def update_enrollment_progress
    enrollment.update_progress! if saved_change_to_status?
  end
end
