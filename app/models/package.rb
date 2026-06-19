class Package < ApplicationRecord
  has_many :price_rules, dependent: :destroy
  has_many :orders, dependent: :nullify

  enum :status, { active: "active", inactive: "inactive" }

  validates :name, :base_price, :total_inventory, :available_inventory, presence: true
  validates :base_price, numericality: { greater_than_or_equal_to: 0 }
  validates :total_inventory, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :available_inventory, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where(status: :active) }
  scope :low_stock, -> { where("available_inventory <= ?", 10) }
  scope :out_of_stock, -> { where(available_inventory: 0) }

  def decrease_inventory(quantity = 1)
    return false if available_inventory < quantity

    decrement!(:available_inventory, quantity)
    increment!(:sold_count, quantity)
  end

  def increase_inventory(quantity = 1)
    increment!(:available_inventory, quantity)
    decrement!(:sold_count, quantity) if sold_count >= quantity
  end

  def conversion_rate
    return 0 if total_inventory.zero?

    (sold_count.to_f / total_inventory.to_f * 100).round(2)
  end

  def oversold?
    sold_count > total_inventory
  end
end
