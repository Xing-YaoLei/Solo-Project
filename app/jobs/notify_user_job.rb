class NotifyUserJob < ApplicationJob
  queue_as :notifications

  def perform(pickup_order_id, event_type)
    @order = PickupOrder.find_by(id: pickup_order_id)
    return unless @order

    case event_type
    when 'submitted'
      notify_submitted
    when 'materials_missing'
      notify_materials_missing
    when 'completed'
      notify_completed
    end
  end

  private

  def notify_submitted
    Rails.logger.info "订单 #{@order.pickup_code} 已提交，通知处理人员"
  end

  def notify_materials_missing
    Rails.logger.info "订单 #{@order.pickup_code} 缺少材料，通知相关人员补充"
  end

  def notify_completed
    Rails.logger.info "订单 #{@order.pickup_code} 已完成，通知客户自提"
  end
end
