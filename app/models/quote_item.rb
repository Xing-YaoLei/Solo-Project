class QuoteItem < ApplicationRecord
  ITEM_TYPES = %w[service part].freeze

  belongs_to :quote

  enum :item_type, ITEM_TYPES.zip(ITEM_TYPES).to_h

  def subtotal
    quantity * unit_price * (1 - discount_rate / 100.0)
  end
end
