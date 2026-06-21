class ReviewRecord < ApplicationRecord
  belongs_to :legal_case

  validates :content, presence: true
  validates :review_date, presence: true
end
