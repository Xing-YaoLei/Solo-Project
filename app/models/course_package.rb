class CoursePackage < ApplicationRecord
  has_many :course_consumptions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :total_sessions, presence: true, numericality: { greater_than: 0 }

  PACKAGE_TYPES = %w[personal_training group_training rehabilitation nutrition].freeze
end
