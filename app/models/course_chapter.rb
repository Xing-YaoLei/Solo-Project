class CourseChapter < ApplicationRecord
  belongs_to :course_consumption
  has_many :performance_feedbacks, dependent: :nullify

  validates :title, presence: true
  validates :position, numericality: { greater_than_or_equal_to: 0 }

  CHAPTER_STATUSES = %w[pending in_progress completed skipped].freeze

  scope :ordered, -> { order(position: :asc) }

  before_create :set_position

  private

  def set_position
    return if position.present?
    max_pos = course_consumption.course_chapters.maximum(:position) || 0
    self.position = max_pos + 1
  end
end
