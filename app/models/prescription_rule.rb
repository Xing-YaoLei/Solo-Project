class PrescriptionRule < ApplicationRecord
  has_many :training_prescriptions, foreign_key: :rule_id

  scope :active, -> { where(active: true) }
end
