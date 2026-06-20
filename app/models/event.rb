class Event < ApplicationRecord
  has_many :ticket_types, dependent: :destroy
  has_many :sponsors, dependent: :destroy
  has_many :ticket_orders, dependent: :destroy
  has_many :check_in_records, dependent: :destroy
  has_many :refund_disputes, through: :ticket_orders

  validates :name, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :status, presence: true, inclusion: { in: %w[draft active completed cancelled] }

  scope :active, -> { where(status: "active") }
  scope :recent, -> { order(start_time: :desc) }

  def check_in_rate
    return 0 if ticket_orders.where(status: "paid").count.zero?
    check_in_records.distinct.count(:ticket_order_id).to_f / ticket_orders.where(status: "paid").count * 100
  end

  def check_in_count
    check_in_records.distinct.count(:ticket_order_id)
  end

  def paid_order_count
    ticket_orders.where(status: "paid").count
  end
end
