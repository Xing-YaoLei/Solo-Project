class ExamRecord < ApplicationRecord
  enum :status, { in_progress: 0, submitted: 1, graded: 2 }

  belongs_to :enrollment
  belongs_to :exam
  belongs_to :user

  validates :enrollment_id, presence: true
  validates :exam_id, presence: true
  validates :user_id, presence: true

  scope :passed, -> { where(is_passed: true) }
  scope :failed, -> { where(is_passed: false) }

  def score_percentage
    return 0 if total_score.to_f == 0
    (score.to_f / total_score.to_f * 100).round(1)
  end

  def passed?
    is_passed == true
  end

  def submit!
    return unless in_progress?
    update(status: :submitted, end_time: Time.current)
  end

  def grade!(final_score)
    return unless submitted?
    passed = final_score >= exam.passing_score
    update(
      status: :graded,
      score: final_score,
      is_passed: passed
    )
  end
end
