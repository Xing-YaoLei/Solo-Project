puts "=" * 70
puts "系统功能深度测试报告 - 差异处理工作流和页面分页"
puts "=" * 70
puts ""

cs_user = User.cs.first || User.create!(name: "测试客服", email: "cs_test_#{Time.now.to_i}@example.com", password: "password123", role: :cs, phone: "13800000000")
merchant_user = User.merchant.first
rider_user = User.rider.first
manager_user = User.city_manager.first
cs_user2 = User.cs.second || User.create!(name: "测试客服2", email: "cs2_test_#{Time.now.to_i}@example.com", password: "password123", role: :cs, phone: "13800000001")

puts "测试账号："
puts "  客服: #{cs_user&.name} (##{cs_user&.id[0..7]})"
puts "  客服2: #{cs_user2&.name} (##{cs_user2&.id[0..7]})"
puts "  商户: #{merchant_user&.name}"
puts "  骑手: #{rider_user&.name}"
puts "  经理: #{manager_user&.name}"
puts ""

# 1. Pagy 分页各角色入口测试
puts "【1】各角色入口 Pagy 分页测试"
puts "-" * 70
test_cases = [
  [Settlement, cs_user, :cs, "客服", :index?],
  [Discrepancy, cs_user, :cs, "客服-差异", :index?],
  [TodoItem, cs_user, :cs, "客服-待办", :index?],
  [Settlement, merchant_user, :merchants, "商户", :index?],
  [DeliveryOrder, rider_user, :rider, "骑手-订单", :index?],
]

test_cases.each do |model, user, ns, desc, policy_method|
  begin
    if user.nil?
      puts "⚠️  #{desc}: 无测试用户"
      next
    end
    policy_class = "#{model}Policy".constantize
    scope_class = Pundit::PolicyFinder.new(model).scope!
    scope = scope_class.new(user, model.all).resolve
    
    pagy, records = Pagy.new(count: scope.count, page: 1), scope.limit(20).to_a
    policy = policy_class.new(user, model.new)
    policy_ok = policy.send(policy_method) rescue false
    
    puts "✅ #{desc}: 记录#{scope.count}条, 可访问#{policy_ok}"
    puts "   分页: 共#{pagy.pages}页, 当前页#{records.length}条"
  rescue => e
    puts "❌ #{desc}: 错误 - #{e.message}"
    puts e.backtrace.first(3).join("\n")
  end
end
puts ""

# 2. 经理报表测试
puts "【2】经理报表 Pagy 分页测试"
puts "-" * 70
if manager_user
  begin
    settlement_count = Settlement.count
    puts "✅ 经理报表基础数据: #{settlement_count}条结算单"
    
    pagy_cycle, cycle_data = Pagy.new(count: settlement_count, page: 1), Settlement.all.limit(20)
    puts "✅ 付款周期报表: #{cycle_data.length}条, #{pagy_cycle.pages}页"
    
    date_data = Settlement.group("DATE(created_at)").count
    pagy_date = Pagy.new(count: date_data.count, page: 1)
    puts "✅ 按日期报表: #{date_data.count}组, #{pagy_date.pages}页"
    
    owner_data = Settlement.group(:handler_id).count
    pagy_owner = Pagy.new(count: owner_data.count, page: 1)
    puts "✅ 按负责人报表: #{owner_data.count}组, #{pagy_owner.pages}页"
  rescue => e
    puts "❌ 经理报表: 错误 - #{e.message}"
  end
else
  puts "⚠️  无经理用户，跳过"
end
puts ""

# 3. 骑手配送中筛选测试
puts "【3】骑手配送中筛选测试"
puts "-" * 70
if rider_user
  begin
    all_orders = DeliveryOrder.by_rider(rider_user.id)
    pending_count = all_orders.pending.count
    in_delivery_count = all_orders.in_delivery.count
    assigned_count = all_orders.by_status(:assigned).count
    picked_up_count = all_orders.by_status(:picked_up).count
    delivered_count = all_orders.delivered.count
    
    puts "✅ 骑手订单总数: #{all_orders.count}"
    puts "   待取货: #{pending_count}"
    puts "   配送中(含assigned+picked_up): #{in_delivery_count} (assigned=#{assigned_count}, picked_up=#{picked_up_count})"
    puts "   已完成: #{delivered_count}"
    expected = assigned_count + picked_up_count
    if in_delivery_count == expected
      puts "✅ 配送中筛选正确: 覆盖 assigned(#{assigned_count}) + picked_up(#{picked_up_count}) = #{expected}"
    else
      puts "❌ 配送中筛选错误: 期望#{expected}, 实际#{in_delivery_count}"
    end
  rescue => e
    puts "❌ 骑手筛选: 错误 - #{e.message}"
  end
else
  puts "⚠️  无骑手用户，跳过"
end
puts ""

# 4. 数据库字段完整性测试
puts "【4】数据库字段完整性测试"
puts "-" * 70
field_tests = [
  [AmountAuditLog, :change_type, "AmountAuditLog#change_type"],
  [TodoItem, :completed_at, "TodoItem#completed_at"],
  [TodoItem, :completion_note, "TodoItem#completion_note"],
  [Discrepancy, :description, "Discrepancy#description"],
  [Discrepancy, :resolution_type, "Discrepancy#resolution_type"],
  [Discrepancy, :resolved_at, "Discrepancy#resolved_at"],
  [Discrepancy, :resolved_by, "Discrepancy#resolved_by"],
  [Discrepancy, :comment, "Discrepancy#comment"],
  [SupplementMaterial, :file_url, "SupplementMaterial#file_url"],
  [SettlementItem, :description, "SettlementItem#description"],
]

all_fields_ok = true
field_tests.each do |model, field, desc|
  if model.column_names.include?(field.to_s)
    puts "✅ #{desc}"
  else
    puts "❌ #{desc}: 缺失"
    all_fields_ok = false
  end
end
puts ""

# 5. 差异处理工作流 - 创建测试结算单
puts "【5】差异处理工作流端到端测试"
puts "-" * 70
begin
  merchant = Merchant.first
  unless merchant
    merchant = Merchant.create!(name: "工作流测试商户", address: "测试地址", contact_name: "张三", phone: "13900000000")
  end
  
  settlement = Settlement.create!(
    merchant: merchant,
    period: "TEST-#{Time.now.strftime('%Y%m%d%H%M%S')}",
    system_amount: 10500.00,
    merchant_amount: 10000.00,
    difference_amount: 500.00,
    order_count: 25,
    payment_date: 7.days.from_now.to_date,
    status: :pending,
    handler: cs_user
  )
  discrepancy = Discrepancy.create!(
    settlement: settlement,
    difference_amount: 500.00,
    status: :pending,
    description: "工作流测试 - 商户反馈系统多计500元"
  )
  TodoItem.create!(
    settlement: settlement,
    discrepancy: discrepancy,
    assignee: cs_user,
    title: "处理结算单差异",
    description: "差异金额: 500.00元",
    priority: :high,
    status: :pending,
    due_date: 3.days.from_now.to_date
  )
  puts "✅ 测试数据创建成功"
  puts "   结算单: ##{settlement.id[0..7]}, 差异+¥500.00"
  puts "   差异记录: ##{discrepancy.id[0..7]}"
  puts "   初始待办: 1条"
  
  # 5a. 测试补充材料
  puts ""
  puts "▶️  步骤1: 补充材料"
  discrepancies_before = discrepancy.supplement_materials.count
  todos_before = TodoItem.count
  
  service = DiscrepancyResolutionService.new(discrepancy, cs_user)
  material = service.supplement_material("商户提供的对账单扫描件", "https://example.com/receipt.pdf")
  
  discrepancy.reload
  if discrepancy.supplement_materials.count == discrepancies_before + 1
    puts "✅ 补充材料创建成功: #{material.description}, 计数 #{discrepancies_before} → #{discrepancy.supplement_materials.count}"
  else
    puts "❌ 补充材料创建失败"
  end
  if TodoItem.count > todos_before
    puts "✅ 待办生成: #{TodoItem.count - todos_before}条新待办通知处理人"
  else
    puts "⚠️  未生成新待办（已有待办可能为空）"
  end
  
  # 5b. 测试升级调查
  puts ""
  puts "▶️  步骤2: 升级调查"
  manager_todos_before = manager_user ? TodoItem.by_assignee(manager_user.id).count : 0
  old_status = discrepancy.status
  
  service2 = DiscrepancyResolutionService.new(discrepancy, cs_user)
  service2.escalate("需要经理确认优惠规则")
  
  discrepancy.reload
  if discrepancy.investigating?
    puts "✅ 差异状态变更: #{old_status} → investigating"
  else
    puts "❌ 差异状态未变更，当前: #{discrepancy.status}"
  end
  if manager_user
    manager_todos_after = TodoItem.by_assignee(manager_user.id).count
    if manager_todos_after > manager_todos_before
      puts "✅ 经理待办生成: #{manager_todos_before} → #{manager_todos_after} (+#{manager_todos_after - manager_todos_before})"
    else
      puts "⚠️  经理待办未增加: #{manager_todos_before} → #{manager_todos_after}"
    end
  end
  
  # 5c. 测试解决差异
  puts ""
  puts "▶️  步骤3: 解决差异"
  old_amount = settlement.system_amount
  old_diff = settlement.difference_amount
  audits_before = AmountAuditLog.count
  
  discrepancy.reload
  service3 = DiscrepancyResolutionService.new(discrepancy, cs_user)
  service3.resolve("merchant_agreed", 10000.00, "商户同意系统调整后金额")
  
  settlement.reload
  discrepancy.reload
  if settlement.system_amount == 10000.00
    puts "✅ 结算单金额更新: #{old_amount} → #{settlement.system_amount}"
    puts "   差异金额: #{old_diff} → #{settlement.difference_amount}"
  else
    puts "❌ 结算单金额未更新"
  end
  if discrepancy.resolved?
    puts "✅ 差异状态: #{discrepancy.status}, 处理方式: #{discrepancy.resolution_type}"
    puts "   解决时间: #{discrepancy.resolved_at&.strftime('%Y-%m-%d %H:%M')}"
    puts "   解决人: #{discrepancy.resolved_by_user&.name}"
    puts "   备注: #{discrepancy.comment}"
  else
    puts "❌ 差异未解决，状态: #{discrepancy.status}"
  end
  audit_created = AmountAuditLog.count - audits_before
  if audit_created > 0
    audit = AmountAuditLog.recent.first
    puts "✅ 审计日志生成: +#{audit_created}条, 最近一条 '#{audit.change_reason}'"
    puts "   金额变化: ¥#{audit.old_amount} → ¥#{audit.new_amount}"
  else
    puts "❌ 未生成审计日志"
  end
  unresolved_todos = discrepancy.todo_items.incomplete.count
  resolved_todos = discrepancy.todo_items.completed.count
  if resolved_todos > 0
    puts "✅ 待办处理: 已完成#{resolved_todos}条, 未完成#{unresolved_todos}条"
    todo = discrepancy.todo_items.completed.first
    puts "   完成备注: #{todo.completion_note}" if todo&.completion_note.present?
  else
    puts "⚠️  待办未标记完成"
  end
rescue => e
  puts "❌ 工作流测试失败: #{e.message}"
  puts e.backtrace.first(8).join("\n")
end
puts ""

# 6. 结算单操作测试（驳回、重新分派、重新提交）
puts "【6】结算单操作测试（驳回、重新分派、重新提交）"
puts "-" * 70
begin
  merchant = Merchant.first
  settlement2 = Settlement.create!(
    merchant: merchant,
    period: "TEST2-#{Time.now.strftime('%Y%m%d%H%M%S')}",
    system_amount: 8000.00,
    merchant_amount: 7800.00,
    difference_amount: 200.00,
    order_count: 15,
    payment_date: 5.days.from_now.to_date,
    status: :processing,
    handler: cs_user
  )
  discrepancy2 = settlement2.discrepancies.create!(
    difference_amount: 200.00,
    status: :pending,
    description: "驳回流程测试"
  )
  puts "✅ 测试结算单创建: ##{settlement2.id[0..7]}"
  
  # 6a. 测试驳回
  puts ""
  puts "▶️  步骤1: 驳回结算单"
  todos_before = settlement2.todo_items.count
  old_status = settlement2.status
  
  rej_service = SettlementRejectionService.new(settlement2, cs_user, "金额不符，需要重新核对")
  rej_service.reject
  
  settlement2.reload
  if settlement2.rejected?
    puts "✅ 状态变更: #{old_status} → rejected"
    puts "   驳回原因: #{settlement2.metadata['rejection_reason']}"
    puts "   驳回时间: #{settlement2.metadata['rejected_at']&.in_time_zone('Asia/Shanghai')&.strftime('%Y-%m-%d %H:%M')}"
    puts "   驳回人: #{settlement2.metadata['rejected_by']}"
  else
    puts "❌ 驳回失败，状态: #{settlement2.status}"
  end
  if settlement2.todo_items.count > todos_before
    new_todo = TodoItem.where(settlement: settlement2).order(created_at: :desc).first
    puts "✅ 待办生成: #{new_todo.title}"
    puts "   截止日期: #{new_todo.due_date}"
  end
  if AmountAuditLog.where(settlement: settlement2, change_type: 'rejection').any?
    puts "✅ 驳回审计日志生成"
  end
  
  # 6b. 测试重新提交
  puts ""
  puts "▶️  步骤2: 重新提交（修改金额）"
  todos_before2 = settlement2.todo_items.count
  discrepancies_before2 = settlement2.discrepancies.count
  
  resub_service = SettlementRejectionService.new(settlement2, cs_user)
  resub_service.resubmit(7800.00)
  
  settlement2.reload
  if settlement2.pending?
    puts "✅ 状态变更: rejected → pending"
    puts "   系统金额: 8000.00 → #{settlement2.system_amount}"
    puts "   差异金额: 200.00 → #{settlement2.difference_amount}"
  else
    puts "❌ 重新提交失败，状态: #{settlement2.status}"
  end
  if settlement2.todo_items.count > todos_before2
    puts "✅ 新待办生成"
    settlement2.todo_items.where(assignee: cs_user2.id).order(created_at: :desc).limit(2).each do |t|
      puts "   - #{t.title} (截止: #{t.due_date})"
    end
  end
  if AmountAuditLog.where(settlement: settlement2, change_type: 'resubmit').any?
    puts "✅ 重新提交审计日志生成"
  end
  if settlement2.difference_amount == 0
    puts "✅ 金额调整后差异为 0，已对齐"
  else
    new_discrepancies = settlement2.discrepancies.count - discrepancies_before2
    if new_discrepancies > 0
      puts "⚠️  重新提交后仍有差异，生成了 #{new_discrepancies} 条新差异记录"
    end
  end
  
  # 6c. 测试重新分派
  puts ""
  puts "▶️  步骤3: 重新分派处理人"
  old_handler = settlement2.handler
  todos_before3 = settlement2.todo_items.count
  
  reassign_service = SettlementReassignmentService.new(settlement2, cs_user, cs_user2)
  reassign_service.reassign
  
  settlement2.reload
  if settlement2.handler_id == cs_user2.id
    puts "✅ 处理人变更: #{old_handler&.name} → #{settlement2.handler&.name}"
  else
    puts "❌ 处理人未变更"
  end
  new_todos = settlement2.todo_items.count - todos_before3
  if new_todos >= 1
    puts "✅ 分派通知待办: +#{new_todos}条"
    new_handler_todo = TodoItem.by_assignee(cs_user2.id).by_settlement(settlement2.id).order(created_at: :desc).first
    puts "   新处理人待办: #{new_handler_todo&.title}"
  end
rescue => e
  puts "❌ 结算单操作测试失败: #{e.message}"
  puts e.backtrace.first(8).join("\n")
end
puts ""

# 7. 路由测试（含操作按钮的POST路由）
puts "【7】控制器路由测试（含操作按钮）"
puts "-" * 70
route_tests = [
  ["GET 客服结算列表", :get, "/cs/settlements"],
  ["GET 客服差异列表", :get, "/cs/discrepancies"],
  ["GET 客服待办列表", :get, "/cs/todo_items"],
  ["GET 商户结算列表", :get, "/merchants/settlements"],
  ["GET 骑手订单列表", :get, "/rider/delivery_orders"],
  ["GET 经理-付款周期报表", :get, "/manager/reports/payment_cycle"],
  ["GET 经理-按日期报表", :get, "/manager/reports/by_date"],
  ["GET 经理-按负责人报表", :get, "/manager/reports/by_owner"],
  ["POST 驳回结算单", :post, "/cs/settlements/#{Settlement.first&.id || 'test'}/reject"],
  ["POST 重新提交", :post, "/cs/settlements/#{Settlement.first&.id || 'test'}/resubmit"],
  ["POST 重新分派", :post, "/cs/settlements/#{Settlement.first&.id || 'test'}/reassign"],
  ["POST 补充材料(结算)", :post, "/cs/settlements/#{Settlement.first&.id || 'test'}/supplement_material"],
  ["POST 解决差异", :post, "/cs/discrepancies/#{Discrepancy.first&.id || 'test'}/resolve"],
  ["POST 升级调查", :post, "/cs/discrepancies/#{Discrepancy.first&.id || 'test'}/escalate"],
  ["POST 上传材料(差异)", :post, "/cs/discrepancies/#{Discrepancy.first&.id || 'test'}/supplement_materials"],
  ["PATCH 更新骑手订单", :patch, "/rider/delivery_orders/#{DeliveryOrder.first&.id || 'test'}"],
]

route_tests.each do |desc, method, path|
  begin
    route = Rails.application.routes.recognize_path(path, method: method)
    puts "✅ #{desc}"
    puts "   → #{route[:controller]}##{route[:action]}"
  rescue ActionController::RoutingError, ActionController::MethodNotAllowed => e
    if path.include?('test')
      puts "⚠️  #{desc}: 需要真实记录ID"
    else
      puts "❌ #{desc}: #{e.message}"
    end
  rescue => e
    puts "❌ #{desc}: 错误 - #{e.class}: #{e.message}"
  end
end
puts ""

# 8. 总结测试
puts "【8】测试数据可见性验证"
puts "-" * 70
begin
  puts "差异记录总数: #{Discrepancy.count}"
  pending_discrepancies = Discrepancy.pending.count
  investigating_discrepancies = Discrepancy.investigating.count
  resolved_discrepancies = Discrepancy.resolved.count
  puts "  待处理: #{pending_discrepancies}"
  puts "  调查中: #{investigating_discrepancies}"
  puts "  已解决: #{resolved_discrepancies}"
  
  puts "补充材料总数: #{SupplementMaterial.count}"
  puts "待办事项总数: #{TodoItem.count}"
  pending_todos = TodoItem.pending.count
  in_progress_todos = TodoItem.in_progress.count
  completed_todos = TodoItem.completed.count
  puts "  待处理: #{pending_todos}, 进行中: #{in_progress_todos}, 已完成: #{completed_todos}"
  
  puts "审计日志总数: #{AmountAuditLog.count}"
  puts "结算单总数: #{Settlement.count}"
  with_diff = Settlement.with_difference.count
  puts "  有差异: #{with_diff}, 无差异: #{Settlement.count - with_diff}"
rescue => e
  puts "❌ 统计错误: #{e.message}"
end
puts ""

puts "=" * 70
puts "测试全部完成"
puts "=" * 70
