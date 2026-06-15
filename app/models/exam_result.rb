class ExamResult < ApplicationRecord
  belongs_to :exam
  belongs_to :student
  belongs_to :reviewer, class_name: "User", optional: true

  validates :score, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :student_id, uniqueness: { scope: :exam_id }

  scope :by_exam, ->(exam_id) { where(exam_id: exam_id) if exam_id.present? }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :passed, -> { where(passed: true) }
  scope :failed, -> { where(passed: false) }

  before_save :update_pass_status

  private

  def update_pass_status
    return unless score.present? && exam.present?
    self.passed = score >= exam.passing_score
  end
end
