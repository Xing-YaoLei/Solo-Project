class Exam < ApplicationRecord
  enum :status, { draft: 0, published: 1, archived: 2 }

  belongs_to :course
  belongs_to :question_bank
  has_many :exam_records, dependent: :destroy
  has_many :makeup_exams, dependent: :destroy

  validates :title, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }
  validates :passing_score, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_score, presence: true, numericality: { greater_than: 0 }
  validates :attempt_limit, presence: true, numericality: { greater_than: 0 }

  def passing_score_percentage
    (passing_score / total_score * 100).round(1)
  end
end
