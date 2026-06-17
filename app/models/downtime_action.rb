class DowntimeAction < ApplicationRecord
  belongs_to :equipment_downtime

  validates :action_description, presence: true
  validates :performed_by, presence: true

  scope :chronological, -> { order(performed_at: :asc) }
end
