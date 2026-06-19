class PriceCalculator
  attr_reader :package, :channel, :quantity, :date

  def initialize(package, channel = nil, quantity = 1, date = Date.today)
    @package = package
    @channel = channel
    @quantity = quantity
    @date = date
  end

  def calculate_unit_price
    base_price = package.base_price
    applicable_rules = find_applicable_rules

    return base_price if applicable_rules.empty?

    best_rule = applicable_rules.max_by do |rule|
      discount_amount(rule, base_price)
    end

    best_rule.apply(base_price)
  end

  def channel_price
    return nil unless channel

    unit_price = calculate_unit_price
    commission = unit_price * (channel.commission_rate.to_f / 100)
    (unit_price - commission).round(2)
  end

  def applicable_rules
    find_applicable_rules
  end

  private

  def find_applicable_rules
    rules = package.price_rules.active
    rules = rules.where("channel_id = ? OR channel_id IS NULL", channel&.id) if channel
    rules = rules.where("(start_date IS NULL OR start_date <= ?)", date)
    rules = rules.where("(end_date IS NULL OR end_date >= ?)", date)
    rules = rules.where("min_quantity <= ?", quantity)
    rules.order(value: :desc)
  end

  def discount_amount(rule, base_price)
    case rule.rule_type
    when "percentage_discount"
      base_price * (rule.value / 100)
    when "fixed_discount"
      rule.value
    when "fixed_price"
      base_price - rule.value
    when "markup"
      -rule.value
    else
      0
    end
  end
end
