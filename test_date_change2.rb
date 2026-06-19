puts "=== 测试：更改已确认订单的日期，触发冲突检测 ==="

property = Property.first
puts "房源: #{property.name}"

# 列出该房源所有 confirmed/checked_in 订单
orders = property.channel_orders.where(status: %w[confirmed checked_in]).to_a
puts "该房源有 #{orders.count} 个已确认订单:"
orders.each { |o| puts "  - #{o.order_no}: #{o.check_in} ~ #{o.check_out}" }

if orders.size >= 2
  order_a, order_b = orders[0], orders[1]
  puts ""
  puts "订单A: #{order_a.order_no} (#{order_a.check_in} ~ #{order_a.check_out})"
  puts "订单B: #{order_b.order_no} (#{order_b.check_in} ~ #{order_b.check_out})"

  conflicts_before = RoomConflict.where(property: property).count
  puts "冲突数(前): #{conflicts_before}"

  # 把订单B的日期改成和订单A重叠
  new_check_in = order_a.check_in
  new_check_out = order_a.check_out
  puts ""
  puts "将订单B日期改为: #{new_check_in} ~ #{new_check_out} (与订单A完全重叠)"

  order_b.update!(check_in: new_check_in, check_out: new_check_out)

  puts "订单已更新，等待 Job 执行..."
  sleep 5

  conflicts_after = RoomConflict.where(property: property).count
  puts "冲突数(后): #{conflicts_after}"

  if conflicts_after > conflicts_before
    puts "✅ 成功！新增 #{conflicts_after - conflicts_before} 个冲突"
    RoomConflict.where(property: property).order(created_at: :desc).limit(conflicts_after - conflicts_before).each do |c|
      puts "   - #{c.conflict_date}: #{c.reason[0..70]}"
    end
  else
    puts "⚠️ 冲突数没有增加"
    puts "检查订单B的 previous_changes:"
    puts "  (需要用 after_commit 回调，previous_changes 在 after_commit 中可用)"
  end
else
  puts "该房源订单不足2个，无法测试"
end
