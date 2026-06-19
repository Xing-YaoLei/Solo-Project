class ConflictDetectionJob < ApplicationJob
  queue_as :default

  def perform(order_id)
    order = ChannelOrder.find_by(id: order_id)
    return unless order

    existing_orders = ChannelOrder.where(property_id: order.property_id)
                                  .where("id != ?", order.id)
                                  .where("check_in < ? AND check_out > ?", order.check_out, order.check_in)
                                  .where(status: %w[confirmed checked_in])

    existing_orders.each do |existing_order|
      overlap_start = [order.check_in, existing_order.check_in].max
      overlap_end = [order.check_out, existing_order.check_out].min

      (overlap_start..(overlap_end - 1.day)).each do |date|
        RoomConflict.find_or_create_by!(
          property_id: order.property_id,
          conflict_date: date,
          status: "open"
        ) do |conflict|
          conflict.reason = "订单 #{order.order_no} 与 #{existing_order.order_no} 在 #{date} 存在房态冲突"
        end
      end
    end
  end
end
