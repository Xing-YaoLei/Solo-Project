class PerformanceFeedback < ApplicationRecord
  belongs_to :course_consumption
  belongs_to :course_chapter, optional: true

  validates :score, numericality: { in: 0..100 }, allow_nil: true

  PERFORMANCE_LEVELS = %w[excellent good average needs_improvement poor].freeze
end
