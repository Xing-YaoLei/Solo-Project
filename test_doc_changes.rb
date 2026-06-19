puts "=== 测试1：新建证件不产生变更日志 ==="

guest = Guest.first
order = ChannelOrder.first

doc = CheckInDocument.create!(
  channel_order: order,
  guest: guest,
  id_type: "id_card",
  id_number: "110101199001011234",
  name: "测试用户",
  gender: "male",
  nationality: "中国"
)

puts "新建证件 ID: #{doc.id}"
puts "变更日志数: #{doc.document_change_logs.count}"
puts doc.document_change_logs.count == 0 ? "✅ 新建不产生日志（正确）" : "⚠️ 错误：新建也产生了日志"

puts ""
puts "=== 测试2：更新证件（空值补填）产生日志 ==="

doc2 = CheckInDocument.create!(
  channel_order: order,
  guest: guest,
  id_type: "passport",
  id_number: "AB1234567",
  name: "测试用户2"
)

puts "新建证件2 ID: #{doc2.id}"
puts "gender 原值: #{doc2.gender.inspect}"
puts "nationality 原值: #{doc2.nationality.inspect}"

logs_before = doc2.document_change_logs.count
puts "更新前日志数: #{logs_before}"

doc2.update!(gender: "female", nationality: "美国")
puts "已更新: gender=female, nationality=美国"

logs_after = doc2.reload.document_change_logs.count
puts "更新后日志数: #{logs_after}"

if logs_after > logs_before
  puts "✅ 空值补填正常产生日志"
  doc2.document_change_logs.order(created_at: :desc).limit(2).each do |log|
    puts "   - #{log.changed_field}: '#{log.old_value}' → '#{log.new_value}'"
  end
else
  puts "⚠️ 错误：空值补填没有产生日志"
end

puts ""
puts "=== 测试3：普通字段更新产生日志 ==="

doc3 = CheckInDocument.first
puts "证件3 ID: #{doc3.id}, 当前证件号: #{doc3.id_number}"

logs_before = doc3.document_change_logs.count
new_number = "31010119850505" + rand(1000..9999).to_s
doc3.update!(id_number: new_number)
puts "已更新证件号为: #{new_number}"

logs_after = doc3.reload.document_change_logs.count
puts "日志数: #{logs_before} → #{logs_after}"

if logs_after > logs_before
  puts "✅ 更新正常产生日志"
  last_log = doc3.document_change_logs.order(created_at: :desc).first
  puts "   - #{last_log.changed_field}: '#{last_log.old_value}' → '#{last_log.new_value}'"
else
  puts "⚠️ 错误：更新没有产生日志"
end
