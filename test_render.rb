begin
  pr = ProcessingRecord.find(11)
  puts "ProcessingRecord ##{pr.id}: #{pr.action_type}"
  puts "previous_status: #{pr.previous_status.inspect}"
  puts "next_status: #{pr.next_status.inspect}"
  puts "status_change?: #{pr.status_change?}"
  puts "---"

  # 手动测试渲染逻辑
  if pr.status_change?
    puts "✓ 状态变化记录会被显示"
    puts "  变更前: #{pr.previous_status} → #{status_text(pr.previous_status)}"
    puts "  变更后: #{pr.next_status} → #{status_text(pr.next_status)}"
  else
    puts "✗ 没有状态变化，不显示"
  end
rescue => e
  puts "ERROR: #{e.class} - #{e.message}"
  puts e.backtrace.first(10).join("\n")
end
