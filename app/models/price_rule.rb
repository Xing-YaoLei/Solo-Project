class PriceRule < ApplicationRecord
  belongs_to :package
  belongs_to :channel, optional: true

  enum :rule_type, { percentage_discount: "percentage_discount",
                    fixed_discount: "fixed_discount",
                    fixed_price: "fixed_price",
                    markup: "markup" }

  enum :status, { active: "active", inactive: "inactive" }

  validates :name, :rule_type, :value, presence: true
  validates :value, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(status: :active) }
  scope :for_channel, ->(channel_id) { where(channel_id: [nil, channel_id]) }
  scope :applicable_on, ->(date) { where("(start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)", date, date) }
  scope :for_quantity, ->(quantity) { where("min_quantity <= ?", quantity) }

  def apply(base_price)
    case rule_type
    when "percentage_discount"
      base_price * (1 - value / 100)
    when "fixed_discount"
      [base_price - value, 0].max
    when "fixed_price"
      value
    when "markup"
      base_price + value
    else
      base_price
    end.round(2)
  end

  def applicable?(channel = nil, date = Date.today, quantity = 1)
    return false if status != "active"
    return false if channel.present? && channel_id.present? && channel_id != channel.id
    return false if start_date.present? && start_date > date
    return false if end_date.present? && end_date < date
    return false if min_quantity.present? && min_quantity > quantity

    true
  end
end
