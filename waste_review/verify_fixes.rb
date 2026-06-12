puts '=== Verification: Status Logs ==='
WasteReport.all.each do |report|
  logs = report.status_logs.order(:created_at)
  puts "Report ##{report.id} (status: #{report.status}) - #{logs.count} logs:"
  logs.each do |log|
    puts "  [#{log.created_at.strftime('%H:%M:%S')}] #{log.from_status.inspect} -> #{log.to_status.inspect} | op: #{log.operator} | note: #{log.note}"
  end
end
puts ''

puts '=== Verification: Test status transition - single log ==='
report = WasteReport.submitted.first
initial_count = report.status_logs.count
puts "Before: #{initial_count} logs"
result = report.transition_to!(:reviewing, 'test-operator', '测试复核')
puts "Transition result: #{result}"
after_count = report.status_logs.count
puts "After: #{after_count} logs"
latest = report.status_logs.order(:created_at).last
puts "Latest: #{latest.from_status.inspect} -> #{latest.to_status.inspect} | note: #{latest.note}"
puts "Correct single new log: #{(after_count - initial_count) == 1}"
puts ''

puts '=== Verification: Abnormal Reports - handling_result present? ==='
AbnormalReport.all.each do |ar|
  puts "##{ar.id} | severity: #{ar.severity} | resolved: #{ar.resolved?}"
  puts "  handling_result: #{ar.handling_result.present? ? ar.handling_result[0..60] + '...' : 'EMPTY!'}"
end
puts ''

puts '=== Verification: Create new waste report - single initial log ==='
store = Store.first
new_report = WasteReport.create!(
  store: store,
  report_date: Date.today,
  reporter: '测试用户',
  remark: '验证日志不重复',
  waste_items_attributes: [
    { product_name: '测试咖啡豆', quantity: 1, unit: 'kg', unit_price: 100, waste_reason: '过期变质', category: '咖啡豆' }
  ]
)
puts "Created report ##{new_report.id}"
puts "Status logs count: #{new_report.status_logs.count}"
new_report.status_logs.each do |log|
  puts "  #{log.from_status.inspect} -> #{log.to_status.inspect} | note: #{log.note}"
end
puts ''

puts '=== ALL TESTS COMPLETED ==='
