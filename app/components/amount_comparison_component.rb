class AmountComparisonComponent < ViewComponent::Base
  def initialize(settlement:)
    @settlement = settlement
  end

  def difference_percentage
    return 0 if @settlement.system_amount.zero?
    ((@settlement.difference_amount.abs / @settlement.system_amount) * 100).round(2)
  end

  def difference_color
    @settlement.difference_amount > 0 ? 'text-red-600' : 'text-green-600'
  end

  def difference_bg_color
    @settlement.difference_amount > 0 ? 'bg-red-100' : 'bg-green-100'
  end

  def system_bar_width
    100
  end

  def merchant_bar_width
    return 0 if @settlement.system_amount.zero?
    ((@settlement.merchant_amount / @settlement.system_amount) * 100).round
  end
end
