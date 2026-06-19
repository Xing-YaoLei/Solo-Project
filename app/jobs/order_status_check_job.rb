class OrderStatusCheckJob < ApplicationJob
  queue_as :orders

  def perform
    check_pending_orders
    check_overdue_check_ins
  end

  private

  def check_pending_orders
    pending_orders = Order.pending.where("created_at < ?", 24.hours.ago)
    pending_orders.find_each do |order|
      Rails.logger.info "Order #{order.order_number} has been pending for over 24 hours"
      order.oversell_communications.create!(
        direction: :internal,
        communication_type: :note,
        content: "系统提醒：订单已待确认超过24小时，请及时处理"
      )
    end
  end

  def check_overdue_check_ins
    today = Date.today
    overdue_orders = Order.confirmed.where("check_in_date < ?", today)

    overdue_orders.find_each do |order|
      Rails.logger.info "Order #{order.order_number} check-in date has passed"
      order.oversell_communications.create!(
        direction: :internal,
        communication_type: :note,
        content: "系统提醒：入住日期已过，订单状态为已确认但未入住，请核实"
      )
    end
  end
end
