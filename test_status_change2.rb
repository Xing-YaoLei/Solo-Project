begin
  user = User.first
  hp = HeatPoint.first
  puts "HeatPoint ##{hp.id} name: #{hp.name}, status: #{hp.status}"

  # 创建一个处理记录并设置状态变更
  pr = hp.processing_records.create!(
    action_type: "状态变更测试",
    status: "completed",
    notes: "测试从 active 变更为 inactive",
    handler: user,
    previous_status: hp.status.to_s,
    next_status: "inactive"
  )
  puts "Created ProcessingRecord ##{pr.id}"
  puts "previous_status=#{pr.previous_status}, next_status=#{pr.next_status}"
  puts "status_change?: #{pr.status_change?}"

  # 应用状态变更
  pr.apply_status_change!
  hp.reload
  puts "\nAfter apply_status_change!:"
  puts "HeatPoint status: #{hp.status}"

  # 现在查看详情页应该显示状态变化
  puts "\nFINAL CHECK:"
  puts "ProcessingRecord ##{pr.id} status_change? = #{pr.status_change?} (should be true)"
  puts "HeatPoint status = #{hp.status} (should be inactive)"

  # 恢复
  hp.update!(status: :active)
  puts "\nReverted HeatPoint status to #{hp.status}"
rescue => e
  puts "ERROR: #{e.class} - #{e.message}"
  puts e.backtrace.first(10).join("\n")
end
