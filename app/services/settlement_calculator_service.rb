class SettlementCalculatorService
  def initialize(merchant, period)
    @merchant = merchant
    @period = period
  end

  def call
    ActiveRecord::Base.transaction do
      system_amount = calculate_system_amount
      merchant_amount = fetch_merchant_amount
      difference_amount = system_amount - merchant_amount

      settlement = create_or_update_settlement(system_amount, merchant_amount, difference_amount)
      create_settlement_items(settlement)
      check_and_handle_discrepancy(settlement) if difference_amount != 0

      settlement
    end
  rescue StandardError => e
    Rails.logger.error "Settlement calculation failed for merchant #{@merchant.id} period #{@period}: #{e.message}"
    raise e
  end

  private

  def calculate_system_amount
    delivery_orders = @merchant.delivery_orders.completed.by_delivery_date(period_start, period_end)
    delivery_orders.sum(:amount)
  end

  def fetch_merchant_amount
    @merchant.settlements.by_period(@period).first&.merchant_amount || calculate_system_amount
  end

  def period_start
    @period_start ||= Date.parse("#{@period}-01")
  end

  def period_end
    @period_end ||= period_start.end_of_month
  end

  def create_or_update_settlement(system_amount, merchant_amount, difference_amount)
    settlement = @merchant.settlements.find_or_initialize_by(period: @period)

    settlement.assign_attributes(
      system_amount:,
      merchant_amount:,
      difference_amount:,
      status: :pending,
      payment_date: period_end + 7.days
    )

    settlement.save!
    settlement
  end

  def create_settlement_items(settlement)
    settlement.settlement_items.destroy_all

    delivery_orders = @merchant.delivery_orders.completed.by_delivery_date(period_start, period_end)
    delivery_orders.each do |order|
      settlement.settlement_items.create!(
        delivery_order_id: order.id,
        item_type: :delivery,
        amount: order.amount,
        description: "配送订单 #{order.order_no}"
      )
    end
  end

  def check_and_handle_discrepancy(settlement)
    discrepancy = settlement.discrepancies.create!(
      difference_amount: settlement.difference_amount,
      status: :pending,
      description: "系统计算金额与商家金额存在差异"
    )

    cs_users = User.by_role(:cs)
    cs_users.each do |cs_user|
      TodoItem.create!(
        settlement:,
        discrepancy:,
        assignee: cs_user,
        title: "处理结算单差异 - #{@merchant.name} #{@period}",
        description: "差异金额: #{sprintf("%.2f", settlement.difference_amount)}元",
        priority: discrepancy_priority(settlement.difference_amount),
        status: :pending,
        due_date: 3.business_days.from_now
      )
    end
  end

  def discrepancy_priority(amount)
    if amount.abs >= 10000
      :urgent
    elsif amount.abs >= 5000
      :high
    elsif amount.abs >= 1000
      :medium
    else
      :low
    end
  end
end
