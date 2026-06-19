puts "=== 按用户角色的可见冲突数（严格归属） ==="
puts ""

admin = User.find_by(role: "admin")
manager = User.find_by(role: "manager")
staff = User.find_by(role: "staff")
cleaner = User.find_by(role: "cleaner")

puts "总冲突数: #{RoomConflict.count}"
puts "未处理总冲突数: #{RoomConflict.open.count}"
puts ""

users = [admin, manager, staff, cleaner].compact
users.each do |user|
  visible = RoomConflict.visible_to(user)
  open_count = visible.open.count
  puts "#{user.name} (#{user.role_i18n}):"
  puts "  可见全部: #{visible.count}"
  puts "  未处理: #{open_count}"
  puts "  handler_id = #{user.id}: #{RoomConflict.for_handler(user.id).count}"
  puts ""
end

puts "=== 当前默认用户（User.first） ==="
user = User.first
puts "用户: #{user.name} (#{user.role_i18n})"
puts "可见未处理冲突数: #{RoomConflict.visible_to(user).open.count}"
