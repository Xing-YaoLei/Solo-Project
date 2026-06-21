class FollowUp < ApplicationRecord
  belongs_to :legal_case

  validates :content, presence: true
  validates :follow_date, presence: true
end
