class Question < ApplicationRecord
  enum :question_type, { single_choice: 0, multiple_choice: 1, true_false: 2, fill_blank: 3, essay: 4 }
  enum :difficulty, { easy: 0, medium: 1, hard: 2 }
  enum :status, { active: 0, inactive: 1 }

  belongs_to :question_bank
  has_many :practice_records

  validates :content, presence: true
  validates :question_type, presence: true
  validates :score, presence: true, numericality: { greater_than: 0 }
end
