puts "=== 清理测试数据 ==="

# 删除测试订单
test_orders = ChannelOrder.where("order_no LIKE 'TEST-CONFLICT%'")
puts "删除测试订单: #{test_orders.count} 个"
test_orders.destroy_all

# 删除相关的冲突（由测试订单产生的）
test_conflicts = RoomConflict.where("reason LIKE '%TEST-CONFLICT%'")
puts "删除测试冲突: #{test_conflicts.count} 个"
test_conflicts.destroy_all

puts ""
puts "=== 清理后数据 ==="
puts "冲突总数: #{RoomConflict.count}"
puts "未处理冲突数: #{RoomConflict.open.count}"
