begin
  # 1. 检查当前状态
  pr = ProcessingRecord.find(1)
  hp = pr.recordable
  puts "ProcessingRecord #1: #{pr.action_type}"
  puts "Previous status: #{pr.previous_status.inspect}"
  puts "Next status: #{pr.next_status.inspect}"
  puts "status_change?: #{pr.status_change?}"
  puts "HeatPoint ##{hp.id} name: #{hp.name}, current status: #{hp.status}"
  puts "---"

  # 2. 模拟用户编辑时的参数（选择变更后状态 = inactive）
  params = ActionController::Parameters.new({
    processing_record: {
      status: pr.status,
      action_type: pr.action_type,
      notes: pr.notes,
      next_status: "inactive"
    }
  })
  params.permit!
  params_params = params[:processing_record]
  puts "Submitted params: #{params_params.inspect}"

  # 3. 模拟 controller 的 update 逻辑
  if params_params[:next_status].present?
    pr.previous_status = hp.status.to_s
  elsif params_params[:next_status].blank?
    pr.next_status = nil
    pr.previous_status = nil
  end
  puts "After controller logic: previous=#{pr.previous_status}, next=#{pr.next_status}"
  puts "status_change?: #{pr.status_change?}"

  # 4. 更新并应用状态
  if pr.update(params_params.to_h)
    puts "Update successful!"
    pr.apply_status_change!
    hp.reload
    puts "HeatPoint status after apply: #{hp.status}"
    puts "---"
    puts "FINAL: ProcessingRecord previous=#{pr.previous_status}, next=#{pr.next_status}"
    puts "FINAL: status_change?=#{pr.status_change?}  (should be true)"
    puts "FINAL: HeatPoint status=#{hp.status}  (should be inactive)"
  else
    puts "Update failed: #{pr.errors.full_messages}"
  end

  # 5. 再测试：清除变更（选择"不变更"）
  puts "\n--- TEST 2: Clear next status ---"
  pr.reload
  params2 = ActionController::Parameters.new({
    processing_record: {
      status: pr.status,
      action_type: pr.action_type,
      notes: pr.notes,
      next_status: ""
    }
  })
  params2.permit!
  params2_params = params2[:processing_record]
  if params2_params[:next_status].present?
    pr.previous_status = hp.status.to_s
  elsif params2_params[:next_status].blank?
    pr.next_status = nil
    pr.previous_status = nil
  end
  pr.update(params2_params.to_h)
  puts "After clearing: previous=#{pr.previous_status}, next=#{pr.next_status}"
  puts "status_change?: #{pr.status_change?}  (should be false)"

  # 6. 恢复热力点状态为 active
  hp.update!(status: :active)
  pr.update!(previous_status: nil, next_status: nil)
  puts "\n--- Reverted ---"
  puts "HeatPoint status: #{hp.status}"
  puts "ProcessingRecord previous/next cleared."
rescue => e
  puts "ERROR: #{e.class} - #{e.message}"
  puts e.backtrace.first(10).join("\n")
end
