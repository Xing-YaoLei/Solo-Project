class TicketType < ApplicationRecord
  belongs_to :event
  has_many :ticket_orders, dependent: :restrict_with_error
  has_many :check_in_records, dependent: :restrict_with_error

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[on_sale sold_out disabled] }

  scope :on_sale, -> { where(status: "on_sale") }

  def sold_count
    ticket_orders.where(status: %w[paid checked_in]).sum(:quantity)
  end

  def remaining_count
    quantity - sold_count
  end

  def check_in_rate
    return 0 if ticket_orders.where(status: %w[paid checked_in]).count.zero?
    check_in_records.distinct.count(:ticket_order_id).to_f / ticket_orders.where(status: %w[paid checked_in]).count * 100
  end
end
