class Certificate < ApplicationRecord
  enum :certificate_type, { completion: 0, achievement: 1, professional: 2 }
  enum :status, { active: 0, inactive: 1 }

  belongs_to :course
  has_many :certificate_issuances, dependent: :destroy

  validates :title, presence: true
  validates :certificate_type, presence: true
end
