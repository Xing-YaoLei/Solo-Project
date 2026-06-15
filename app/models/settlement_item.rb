class SettlementItem < ApplicationRecord
  enum :item_type, { enrollment: 0, course_completed: 1, full_completion: 2, refund: 3 }
  enum :status, { pending: 0, confirmed: 1, disputed: 2, adjusted: 3 }

  belongs_to :settlement
  belongs_to :order
  belongs_to :enrollment, optional: true

  validates :settlement_id, presence: true
  validates :order_id, presence: true
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :item_type, presence: true
end
