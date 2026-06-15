class Lesson < ApplicationRecord
  enum :lesson_type, { video: 0, article: 1, audio: 2, document: 3 }
  enum :status, { active: 0, inactive: 1 }

  belongs_to :chapter
  has_many :lesson_progresses, dependent: :destroy
  has_many :qa_threads, dependent: :destroy

  validates :title, presence: true
  validates :lesson_type, presence: true
  validates :position, presence: true

  delegate :course, to: :chapter
end
