class Exam < ApplicationRecord
  EXAM_TYPES = %w[quiz midterm final certification assignment_exam].freeze

  belongs_to :community, optional: true
  has_many :exam_results, dependent: :destroy
  has_many :students, through: :exam_results

  validates :name, presence: true
  validates :exam_type, inclusion: { in: EXAM_TYPES }

  scope :by_date_range, ->(start_date, end_date) { where(exam_date: start_date..end_date) if start_date && end_date }
  scope :by_community, ->(community_id) { where(community_id: community_id) if community_id.present? }
  scope :by_type, ->(type) { where(exam_type: type) if type.present? }

  def pass_rate
    return 0.0 if exam_results.empty?
    passed = exam_results.where(passed: true).count
    (passed.to_f / exam_results.count * 100).round(2)
  end

  def average_score
    return 0.0 if exam_results.empty?
    exam_results.average(:score).to_f.round(2)
  end

  def total_participants
    exam_results.count
  end

  def passed_count
    exam_results.where(passed: true).count
  end

  def failed_count
    exam_results.where(passed: false).count
  end

  def self.monthly_pass_rates(year, month)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month
    exams = by_date_range(start_date, end_date)
    exams.map do |exam|
      {
        exam_id: exam.id,
        exam_name: exam.name,
        exam_type: exam.exam_type,
        exam_date: exam.exam_date,
        community_name: exam.community&.name,
        total_participants: exam.total_participants,
        passed_count: exam.passed_count,
        failed_count: exam.failed_count,
        pass_rate: exam.pass_rate,
        average_score: exam.average_score
      }
    end
  end
end
