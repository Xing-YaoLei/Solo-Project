class Course < ApplicationRecord
  enum :status, { draft: 0, published: 1, archived: 2 }

  belongs_to :channel
  belongs_to :teacher, class_name: "User"

  has_many :chapters, -> { order(position: :asc) }, dependent: :destroy
  has_many :lessons, through: :chapters
  has_many :question_banks, dependent: :destroy
  has_many :exams, dependent: :destroy
  has_many :live_sessions, -> { order(start_time: :desc) }, dependent: :destroy
  has_many :certificates, dependent: :destroy
  has_many :orders
  has_many :enrollments

  validates :title, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :channel_id, presence: true
  validates :teacher_id, presence: true

  def total_lessons_count
    lessons.count
  end

  def total_duration
    lessons.sum(:duration)
  end

  def published?
    status == "published"
  end
end
