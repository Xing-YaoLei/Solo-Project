puts "=== 测试1：按处理人可见性查询 ==="
puts ""

admin = User.find_by(role: "admin")
manager = User.find_by(role: "manager")
staff = User.find_by(role: "staff")
cleaner = User.find_by(role: "cleaner")

puts "用户列表:"
[admin, manager, staff, cleaner].compact.each do |u|
  puts "  - #{u.name} (#{u.role})"
end

puts ""
puts "所有冲突数: #{RoomConflict.count}"
puts "Admin 可见: #{RoomConflict.visible_to(admin).count}"
puts "Manager 可见: #{RoomConflict.visible_to(manager).count}"
puts "Staff 可见: #{RoomConflict.visible_to(staff).count}"
puts "Cleaner 可见: #{RoomConflict.visible_to(cleaner).count}"

puts ""
puts "=== 测试2：创建重叠订单，验证 Job 进入 Sidekiq 队列 ==="

property = Property.first
guest = Guest.second
puts "房源: #{property.name}"
puts "创建一个与现有订单重叠的 confirmed 订单..."

conflicts_before = RoomConflict.count

order = ChannelOrder.create!(
  order_no: "SIDEKIQ-TEST-#{Time.now.to_i}",
  property: property,
  guest: guest,
  check_in: Date.parse("2026-06-05"),
  check_out: Date.parse("2026-06-12"),
  channel: "meituan",
  status: "confirmed",
  price: 800
)

puts "订单已创建: #{order.order_no}"
puts "创建前冲突数: #{conflicts_before}"
puts "等待 Sidekiq Job 执行..."

sleep 6

conflicts_after = RoomConflict.count
puts "创建后冲突数: #{conflicts_after}"

if conflicts_after > conflicts_before
  puts "✅ 成功！Sidekiq 执行后新增 #{conflicts_after - conflicts_before} 个冲突"
  new_conflicts = RoomConflict.order(created_at: :desc).limit(conflicts_after - conflicts_before)
  new_conflicts.each do |c|
    puts "   - #{c.conflict_date}: #{c.status_i18n} | 处理人: #{c.handler&.name || '未分配'}"
  end
else
  puts "⚠️ 冲突数未增加，可能需要检查 Sidekiq 队列..."
end

puts ""
puts "=== 测试3：按处理人过滤未处理冲突 ==="
open_conflicts = RoomConflict.open
puts "全局未处理冲突: #{open_conflicts.count}"
puts "Admin 未处理: #{RoomConflict.visible_to(admin).open.count}"
puts "Manager 未处理: #{RoomConflict.visible_to(manager).open.count}"

if property.manager
  puts "该房源的经理: #{property.manager.name}"
  count = RoomConflict.for_handler(property.manager.id).open.count
  puts "直接分配给 #{property.manager.name} 的未处理冲突: #{count}"
end
