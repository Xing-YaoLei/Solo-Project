class ReviewTag < ApplicationRecord
  has_many :course_consumption_review_tags, dependent: :destroy
  has_many :course_consumptions, through: :course_consumption_review_tags

  validates :name, presence: true, uniqueness: true
end
