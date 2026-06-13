class Trainer < ApplicationRecord
  has_many :course_consumptions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :employee_no, presence: true, uniqueness: true

  scope :active, -> { where(active: true) }
end
