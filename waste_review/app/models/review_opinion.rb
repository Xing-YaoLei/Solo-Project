class ReviewOpinion < ApplicationRecord
  belongs_to :waste_report

  enum :result, { pending: 0, approved: 1, rejected: 2 }

  validates :reviewer, presence: true
end
