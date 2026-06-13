class CourseConsumptionReviewTag < ApplicationRecord
  belongs_to :course_consumption
  belongs_to :review_tag
end
