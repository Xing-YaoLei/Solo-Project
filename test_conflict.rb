property = Property.first
guest = Guest.first
puts "创建一个重叠订单..."
order = ChannelOrder.create!(
  order_no: "TEST-CONFLICT-001",
  property: property,
  guest: guest,
  check_in: Date.parse("2026-06-10"),
  check_out: Date.parse("2026-06-15"),
  channel: "airbnb",
  status: "confirmed",
  price: 500
)
puts "订单创建成功: #{order.id}"
puts "稍等一下..."
sleep 3
puts "当前冲突数: #{RoomConflict.count}"
RoomConflict.order(created_at: :desc).limit(5).each do |c|
  puts "  - #{c.conflict_date}: #{c.reason[0..60]}..."
end
