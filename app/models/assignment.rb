class Assignment < ApplicationRecord
  belongs_to :community, optional: true
  belongs_to :creator, class_name: "User", optional: true
  has_many :assignment_submissions, dependent: :destroy
  has_many :students, through: :assignment_submissions

  validates :title, presence: true
  validates :plagiarism_threshold, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  scope :due_soon, ->(days = 7) { where(due_date: Date.current..days.days.from_now) }
  scope :by_community, ->(community_id) { where(community_id: community_id) if community_id.present? }
  scope :past_due, -> { where("due_date < ?", Date.current) }

  def overdue?
    due_date.present? && due_date < Date.current
  end

  def submission_count
    assignment_submissions.count
  end

  def flagged_submissions
    assignment_submissions.where(plagiarism_flagged: true)
  end
end
