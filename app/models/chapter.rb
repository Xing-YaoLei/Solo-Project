class Chapter < ApplicationRecord
  enum :status, { active: 0, inactive: 1 }

  belongs_to :course
  has_many :lessons, -> { order(position: :asc) }, dependent: :destroy

  validates :title, presence: true
  validates :position, presence: true

  acts_as_list scope: :course if respond_to?(:acts_as_list)
end
