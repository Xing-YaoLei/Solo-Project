class ParkingSpot < ApplicationRecord
  has_many :tenant_contracts
  has_many :parking_bills, dependent: :destroy
  has_many :access_records, dependent: :destroy

  validates :spot_number, presence: true, uniqueness: true
  validates :zone, presence: true
  validates :spot_type, presence: true, inclusion: { in: %w[regular reserved disabled ev] }

  scope :occupied, -> { where(occupied: true) }
  scope :available, -> { where(occupied: false) }
  scope :by_zone, ->(zone) { where(zone: zone) if zone.present? }
  scope :by_spot_type, ->(spot_type) { where(spot_type: spot_type) if spot_type.present? }

  def turnover_rate(start_date:, end_date:)
    period_bills = parking_bills.where(check_out_at: start_date..end_date)
    days = (end_date - start_date).to_i + 1
    return 0 if days.zero?

    period_bills.count.to_f / days
  end
end
