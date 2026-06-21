class SettlementItem < ApplicationRecord
  belongs_to :settlement
  belongs_to :delivery_order, optional: true

  validates :amount, numericality: true

  scope :by_settlement, ->(settlement_id) { where(settlement_id: settlement_id) }
  scope :by_item_type, ->(item_type) { where(item_type: item_type) }
  scope :positive_amount, -> { where('amount > 0') }
  scope :negative_amount, -> { where('amount < 0') }
end
