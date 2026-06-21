class SupplementMaterial < ApplicationRecord
  belongs_to :discrepancy
  belongs_to :uploader, class_name: 'User'

  validates :description, presence: true

  scope :by_discrepancy, ->(discrepancy_id) { where(discrepancy_id: discrepancy_id) }
  scope :by_uploader, ->(uploader_id) { where(uploader_id: uploader_id) }
  scope :recent, -> { order(created_at: :desc) }
end
