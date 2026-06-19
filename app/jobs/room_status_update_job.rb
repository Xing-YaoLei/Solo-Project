class RoomStatusUpdateJob < ApplicationJob
  queue_as :default

  def perform(property_id, check_in_str, check_out_str)
    property = Property.find_by(id: property_id)
    return unless property

    check_in = Date.parse(check_in_str)
    check_out = Date.parse(check_out_str)

    (check_in..(check_out - 1.day)).each do |date|
      active_orders_count = property.channel_orders
                                      .where("check_in <= ? AND check_out > ?", date + 1.day, date)
                                      .where(status: %w[confirmed checked_in])
                                      .count

      status = if active_orders_count >= property.room_count
                 "occupied"
               elsif active_orders_count > 0
                 "reserved"
               else
                 "available"
               end

      room_status = RoomStatus.find_or_initialize_by(
        property_id: property_id,
        status_date: date
      )
      room_status.update!(status: status) unless room_status.status == "maintenance" || room_status.status == "blocked"
    end
  end
end
