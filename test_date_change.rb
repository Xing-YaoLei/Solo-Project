puts "=== 测试：更改已确认订单的日期，触发冲突检测 ==="

# 找一个 confirmed 订单
order = ChannelOrder.where(status: "confirmed").first
puts "测试订单: #{order.order_no}"
puts "当前日期: #{order.check_in} ~ #{order.check_out}"
puts "当前状态: #{order.status}"

# 找一个有 confirmed 订单的日期
existing = ChannelOrder.where(status: %w[confirmed checked_in])
                      .where("id != ?", order.id)
                      .where(property_id: order.property_id)
                      .first

if existing
  puts ""
  puts "同房源已有订单: #{existing.order_no} (#{existing.check_in} ~ #{existing.check_out})"
  puts "现在把测试订单改成与它重叠的日期..."

  new_check_in = existing.check_in + 1.day
  new_check_out = existing.check_out - 1.day

  puts "新日期: #{new_check_in} ~ #{new_check_out}"

  conflicts_before = RoomConflict.count
  puts "冲突数(前): #{conflicts_before}"

  order.update!(check_in: new_check_in, check_out: new_check_out)

  puts "订单已更新，等待 Job 执行..."
  sleep 4

  conflicts_after = RoomConflict.count
  puts "冲突数(后): #{conflicts_after}"

  if conflicts_after > conflicts_before
    puts "✅ 成功！新增 #{conflicts_after - conflicts_before} 个冲突"
    RoomConflict.order(created_at: :desc).limit(3).each do |c|
      puts "   - #{c.conflict_date}: #{c.reason[0..60]}"
    end
  else
    puts "⚠️ 冲突数没有增加，检查一下..."
  end
else
  puts "没有找到同房源的其他已确认订单"
end
