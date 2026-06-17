class AccessRecord < ApplicationRecord
  belongs_to :parking_spot, optional: true

  validates :plate_number, presence: true
  validates :direction, presence: true, inclusion: { in: %w[in out] }
  validates :access_type, presence: true, inclusion: { in: %w[vehicle pedestrian] }

  scope :recent, -> { order(accessed_at: :desc) }
  scope :by_date_range, ->(start_date, end_date) { where(accessed_at: start_date..end_date) }
  scope :by_direction, ->(dir) { where(direction: dir) if dir.present? }
end
