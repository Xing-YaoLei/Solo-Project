class RiskWordHit < ApplicationRecord
  belongs_to :document
  belongs_to :risk_word

  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
end
