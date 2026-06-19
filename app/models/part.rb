class Part < ApplicationRecord
  has_many :work_order_parts, dependent: :destroy

  validates :sku, :name, presence: true
  validates :sku, uniqueness: true

  scope :low_stock, -> { where("stock_quantity <= safety_stock") }
  scope :out_of_stock, -> { where(stock_quantity: 0) }

  def available?
    stock_quantity > 0
  end

  def low_stock?
    stock_quantity <= safety_stock
  end
end
