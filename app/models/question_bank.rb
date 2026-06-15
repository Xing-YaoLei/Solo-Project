class QuestionBank < ApplicationRecord
  enum :status, { active: 0, inactive: 1 }

  belongs_to :course
  has_many :questions, dependent: :destroy
  has_many :exams
  has_many :practice_records

  validates :title, presence: true

  def questions_count
    questions.count
  end
end
