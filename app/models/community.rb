class Community < ApplicationRecord
  STATUSES = %w[active inactive completed].freeze

  belongs_to :manager, class_name: "User", optional: true
  has_many :students, dependent: :nullify
  has_many :exams, dependent: :destroy
  has_many :assignments, dependent: :destroy

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: "active") }

  def active_students_count
    students.where(status: "active").count
  end
end
