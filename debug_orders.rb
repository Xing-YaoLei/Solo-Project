property = Property.first
puts "房源: #{property.name}"
puts "该房源下所有已确认订单:"
property.channel_orders.where(status: %w[confirmed checked_in]).each do |o|
  puts "  - #{o.order_no}: #{o.check_in} ~ #{o.check_out} (#{o.status})"
end

puts ""
puts "最新订单 TEST-CONFLICT-001:"
order = ChannelOrder.find_by(order_no: "TEST-CONFLICT-001")
if order
  puts "  入住: #{order.check_in}"
  puts "  退房: #{order.check_out}"
  puts "  状态: #{order.status}"
end
