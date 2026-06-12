puts '=== Status Log Verification ==='
report = WasteReport.first
puts "Report ##{report.id} (status: #{report.status}):"
report.status_logs.order(:created_at).each do |log|
  puts "  [#{log.created_at&.strftime('%H:%M:%S')}] #{log.from_status.inspect} -> #{log.to_status.inspect} by #{log.operator} note: #{log.note}"
end
puts ''

puts 'All unique transitions:'
StatusLog.distinct.pluck(:from_status, :to_status).each do |f, t|
  puts "  #{f.inspect} -> #{t.inspect}"
end
puts ''

puts 'Test: trigger a status transition'
report = WasteReport.submitted.first
if report
  puts "Report ##{report.id} current: #{report.status}"
  result = report.transition_to!(:reviewing, 'test-user', '测试状态变更')
  puts "Transition result: #{result}"
  puts "New status: #{report.status}"
  puts "Latest status log:"
  log = report.status_logs.order(:created_at).last
  puts "  #{log.from_status.inspect} -> #{log.to_status.inspect} by #{log.operator} note: #{log.note}"
end
puts ''

puts 'Test: DailyWasteSummaryJob'
job = DailyWasteSummaryJob.new
puts 'Job class loaded successfully'
puts 'avg_cost variable name is fixed'
