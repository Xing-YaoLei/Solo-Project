class AssignmentSubmission < ApplicationRecord
  STATUSES = %w[draft submitted reviewed resubmitted].freeze

  belongs_to :assignment
  belongs_to :student
  belongs_to :reviewer, class_name: "User", optional: true
  has_many :plagiarism_logs, dependent: :destroy
  has_many :source_plagiarism_logs, class_name: "PlagiarismLog", foreign_key: "source_submission_id", dependent: :nullify

  validates :status, inclusion: { in: STATUSES }
  validates :student_id, uniqueness: { scope: :assignment_id }
  validates :plagiarism_score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true

  scope :flagged, -> { where(plagiarism_flagged: true) }
  scope :by_assignment, ->(assignment_id) { where(assignment_id: assignment_id) if assignment_id.present? }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :high_similarity, ->(threshold = 30) { where("plagiarism_score >= ?", threshold) }

  after_save :check_plagiarism, if: :plagiarism_check_needed?

  def on_time?
    return true unless assignment&.due_date && submitted_at
    submitted_at.to_date <= assignment.due_date
  end

  private

  def plagiarism_check_needed?
    assignment&.enable_plagiarism_check && saved_change_to_content? && content.present?
  end

  def check_plagiarism
    PlagiarismCheckJob.perform_later(id)
  end
end
