class InspectionCheckpoint < ApplicationRecord
  belongs_to :inspection_route

  validates :location, presence: true
  validates :checkpoint_order, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending checked issue_resolved issue_reported] }

  scope :ordered, -> { order(checkpoint_order: :asc) }
end
