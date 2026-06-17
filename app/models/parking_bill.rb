class ParkingBill < ApplicationRecord
  belongs_to :parking_spot
  belongs_to :access_record, optional: true

  validates :plate_number, presence: true
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :bill_type, presence: true, inclusion: { in: %w[temporary monthly hourly daily] }
  validates :status, presence: true, inclusion: { in: %w[unpaid paid overdue refunded] }

  scope :by_month, ->(year, month) { where(check_in_at: Date.new(year, month, 1)..Date.new(year, month, -1)) }
  scope :paid, -> { where(status: :paid) }
  scope :unpaid, -> { where(status: :unpaid) }
  scope :overdue, -> { where(status: :overdue) }

  before_create :generate_bill_number

  def duration_minutes
    return 0 unless check_in_at && check_out_at

    ((check_out_at - check_in_at) / 60).round
  end

  private

  def generate_bill_number
    self.bill_number = "PB-#{Time.current.strftime('%Y%m%d%H%M%S')}-#{SecureRandom.hex(4).upcase}"
  end
end
