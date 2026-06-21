class DeliveryOrder < ApplicationRecord
  belongs_to :rider, class_name: 'User', optional: true
  belongs_to :merchant
  has_many :settlement_items

  enum :status, { pending: 0, assigned: 1, picked_up: 2, delivered: 3, cancelled: 4 }

  validates :order_no, presence: true, uniqueness: true
  validates :amount, numericality: true
  validates :status, presence: true

  scope :by_rider, ->(rider_id) { where(rider_id: rider_id) }
  scope :by_merchant, ->(merchant_id) { where(merchant_id: merchant_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_order_no, ->(order_no) { where(order_no: order_no) }
  scope :by_delivery_date, ->(start_date, end_date) { where(delivery_time: start_date..end_date) }
  scope :recent, -> { order(created_at: :desc) }
  scope :completed, -> { where(status: :delivered) }
end
