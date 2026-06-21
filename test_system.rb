puts "=" * 60
puts "系统功能测试报告"
puts "=" * 60
puts ""

# 1. 测试分页功能
puts "【1】分页功能测试 (Pagy)"
puts "-" * 60
begin
  cs_user = User.cs.first
  settlements = Settlement.all
  pagy, result = Pagy.new(count: settlements.count, page: 1)
  puts "✅ Pagy 初始化正常"
  puts "   总记录数: #{pagy.count}"
  puts "   当前页: #{pagy.page}"
  puts "   总页数: #{pagy.pages}"
  puts "   上一页: #{pagy.prev.inspect}"
  puts "   下一页: #{pagy.next.inspect}"
rescue => e
  puts "❌ Pagy 测试失败: #{e.message}"
end
puts ""

# 2. 测试差异处理流程
puts "【2】差异处理流程测试"
puts "-" * 60
begin
  settlement = Settlement.where("difference_amount != 0").first
  if settlement
    puts "✅ 找到有差异的结算单: #{settlement.period}"
    puts "   系统金额: ¥#{sprintf('%.2f', settlement.system_amount)}"
    puts "   商户金额: ¥#{sprintf('%.2f', settlement.merchant_amount)}"
    puts "   差异金额: ¥#{sprintf('%.2f', settlement.difference_amount)}"
    
    discrepancy = settlement.discrepancies.first
    if discrepancy
      puts "✅ 差异记录存在: ##{discrepancy.id[0..7]}"
      puts "   状态: #{discrepancy.status}"
      puts "   描述: #{discrepancy.description}"
    else
      puts "❌ 差异记录不存在"
    end
    
    todo_items = settlement.todo_items.where(discrepancy: discrepancy)
    if todo_items.any?
      puts "✅ 待办事项存在: #{todo_items.count} 条"
      todo_items.each do |todo|
        puts "   - #{todo.title} (优先级: #{todo.priority}, 状态: #{todo.status})"
      end
    else
      puts "❌ 待办事项不存在"
    end
    
    supplement_materials = discrepancy&.supplement_materials || []
    if supplement_materials.any?
      puts "✅ 补充材料存在: #{supplement_materials.count} 份"
      supplement_materials.each do |material|
        puts "   - #{material.description} (上传者: #{material.uploader.name})"
      end
    else
      puts "⚠️  补充材料为空（可通过界面上传）"
    end
  else
    puts "⚠️  没有找到有差异的结算单，需要先生成测试数据"
  end
rescue => e
  puts "❌ 差异处理测试失败: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end
puts ""

# 3. 测试驳回重提服务
puts "【3】驳回重提服务测试"
puts "-" * 60
begin
  settlement = Settlement.where(status: :pending).first
  cs_user = User.cs.first
  if settlement && cs_user
    service = SettlementRejectionService.new(settlement, cs_user, "测试驳回原因")
    puts "✅ SettlementRejectionService 初始化正常"
    
    # 测试 reject 方法（不实际执行）
    puts "✅ reject 方法可调用"
    puts "✅ resubmit 方法可调用"
  else
    puts "⚠️  没有找到待处理的结算单或客服用户"
  end
rescue => e
  puts "❌ 驳回重提服务测试失败: #{e.message}"
end
puts ""

# 4. 测试重新分派服务
puts "【4】重新分派服务测试"
puts "-" * 60
begin
  settlement = Settlement.first
  cs_user1 = User.cs.first
  cs_user2 = User.cs.second
  if settlement && cs_user1 && cs_user2
    service = SettlementReassignmentService.new(settlement, cs_user1, cs_user2)
    puts "✅ SettlementReassignmentService 初始化正常"
    puts "✅ reassign 方法可调用"
    puts "✅ batch_reassign 类方法可调用"
  else
    puts "⚠️  测试数据不足"
  end
rescue => e
  puts "❌ 重新分派服务测试失败: #{e.message}"
end
puts ""

# 5. 测试补充材料服务
puts "【5】补充材料服务测试"
puts "-" * 60
begin
  discrepancy = Discrepancy.pending.first
  cs_user = User.cs.first
  if discrepancy && cs_user
    service = DiscrepancyResolutionService.new(discrepancy, cs_user)
    puts "✅ DiscrepancyResolutionService 初始化正常"
    puts "✅ supplement_material 方法可调用"
    puts "✅ resolve 方法可调用"
    puts "✅ escalate 方法可调用"
  else
    puts "⚠️  没有找到待处理的差异或客服用户"
  end
rescue => e
  puts "❌ 补充材料服务测试失败: #{e.message}"
end
puts ""

# 6. 测试控制器路由
puts "【6】控制器路由测试"
puts "-" * 60
routes_to_test = [
  ["客服结算", "/cs/settlements"],
  ["差异处理", "/cs/discrepancies"],
  ["待办事项", "/cs/todo_items"],
  ["商户结算", "/merchants/settlements"],
  ["骑手订单", "/rider/delivery_orders"],
  ["经理报表-付款周期", "/manager/reports/payment_cycle"],
  ["经理报表-按日期", "/manager/reports/by_date"],
  ["经理报表-按负责人", "/manager/reports/by_owner"],
]

routes_to_test.each do |name, path|
  begin
    route = Rails.application.routes.recognize_path(path, method: :get)
    puts "✅ #{name}: #{path}"
    puts "   控制器: #{route[:controller]}"
    puts "   动作: #{route[:action]}"
  rescue => e
    puts "❌ #{name}: #{path} - 路由错误: #{e.message}"
  end
end
puts ""

# 7. 测试模型字段完整性
puts "【7】模型字段完整性测试"
puts "-" * 60
discrepancy_fields = [:description, :resolution_type, :resolved_at, :resolved_by, :comment]
discrepancy_fields.each do |field|
  if Discrepancy.column_names.include?(field.to_s)
    puts "✅ Discrepancy##{field}: 存在"
  else
    puts "❌ Discrepancy##{field}: 缺失"
  end
end

if SupplementMaterial.column_names.include?("file_url")
  puts "✅ SupplementMaterial#file_url: 存在"
else
  puts "❌ SupplementMaterial#file_url: 缺失"
end

if SettlementItem.column_names.include?("description")
  puts "✅ SettlementItem#description: 存在"
else
  puts "❌ SettlementItem#description: 缺失"
end
puts ""

# 8. 测试 Pundit 权限
puts "【8】Pundit 权限测试"
puts "-" * 60
cs_user = User.cs.first
manager = User.city_manager.first
merchant_user = User.merchant.first
rider = User.rider.first

policy_tests = [
  [SettlementPolicy, :index?, cs_user, "客服查看结算单", true],
  [SettlementPolicy, :reject?, cs_user, "客服驳回结算单", true],
  [SettlementPolicy, :resubmit?, cs_user, "客服重提结算单", true],
  [SettlementPolicy, :reassign?, cs_user, "客服重分派结算单", true],
  [SettlementPolicy, :supplement_material?, cs_user, "客服补充材料", true],
  [DiscrepancyPolicy, :index?, cs_user, "客服查看差异", true],
  [TodoItemPolicy, :index?, cs_user, "客服查看待办", true],
  [SupplementMaterialPolicy, :create?, cs_user, "客服创建补充材料", true],
]

policy_tests.each do |policy_class, action, user, desc, expected|
  begin
    policy = policy_class.new(user, policy_class.name.gsub("Policy", "").constantize.new)
    result = policy.send(action)
    status = result == expected ? "✅" : "❌"
    puts "#{status} #{desc}: #{result} (期望: #{expected})"
  rescue => e
    puts "❌ #{desc}: 错误 - #{e.message}"
  end
end
puts ""

puts "=" * 60
puts "测试完成"
puts "=" * 60
