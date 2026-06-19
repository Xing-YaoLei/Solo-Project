class PerformanceSeat < ApplicationRecord
  enum :status, { available: 0, sold: 1, held: 2, complementary: 3, refunded: 4 }, default: :available

  belongs_to :performance

  validates :seat_number, presence: true
  validates :seat_number, uniqueness: { scope: :performance_id }

  scope :by_section, ->(section) { where(section: section) if section.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_row, ->(row) { where(row_number: row) if row.present? }

  monetize :price_cents, allow_nil: true

  def self.ransackable_attributes(auth_object = nil)
    %w[created_at id performance_id price_cents row_number section seat_number status updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[performance]
  end
end
