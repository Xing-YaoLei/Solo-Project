class PickupItem < ApplicationRecord
  STATUSES = %w[normal shortage damaged].freeze

  belongs_to :pickup_order
  has_many :shortage_records, dependent: :destroy
  has_many :after_sales_proofs, dependent: :nullify

  validates :product_name, presence: true
  validates :product_tag, presence: true
  validates :expected_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :actual_quantity, numericality: { greater_than_or_equal_to: 0 }
  validates :shortage_quantity, numericality: { greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: STATUSES }

  before_save :calculate_shortage
  after_save :update_order_shortage

  def calculate_shortage
    self.shortage_quantity = [expected_quantity - actual_quantity, 0].max
    self.total_amount = actual_quantity.to_i * unit_price.to_f
    self.status = shortage_quantity > 0 ? 'shortage' : 'normal'
  end

  def update_order_shortage
    pickup_order.calculate_shortage! if pickup_order
  end

  def status_display
    {
      'normal' => '正常',
      'shortage' => '短少',
      'damaged' => '破损'
    }[status] || status
  end
end
