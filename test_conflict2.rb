property = Property.first
guest = Guest.second

puts "房源: #{property.name}"
puts "创建一个与现有订单重叠的订单 (6月5日 ~ 6月10日)..."

order = ChannelOrder.create!(
  order_no: "TEST-CONFLICT-002",
  property: property,
  guest: guest,
  check_in: Date.parse("2026-06-05"),
  check_out: Date.parse("2026-06-10"),
  channel: "booking",
  status: "pending",
  price: 600
)

puts "订单创建成功，状态: #{order.status}"
puts "现在将状态更新为 confirmed..."

order.update!(status: "confirmed")

puts "状态已更新为: #{order.status}"
puts "稍等几秒让 Job 执行..."
sleep 4

puts ""
puts "当前冲突总数: #{RoomConflict.count}"
puts "该房源的冲突:"
RoomConflict.where(property: property).order(conflict_date: :asc).each do |c|
  puts "  - #{c.conflict_date}: #{c.status_i18n} - #{c.reason[0..50]}..."
end
