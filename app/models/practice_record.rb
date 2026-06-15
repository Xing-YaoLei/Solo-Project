class PracticeRecord < ApplicationRecord
  belongs_to :enrollment
  belongs_to :question_bank
  belongs_to :question

  validates :enrollment_id, presence: true
  validates :question_bank_id, presence: true
  validates :question_id, presence: true

  scope :correct, -> { where(is_correct: true) }
  scope :wrong, -> { where(is_correct: false) }

  def correct?
    is_correct == true
  end
end
