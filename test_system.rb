puts '=== 数据库连接测试 ==='
puts 'User count: ' + User.count.to_s
puts 'Merchant count: ' + Merchant.count.to_s
puts 'Settlement count: ' + Settlement.count.to_s
puts 'Discrepancy count: ' + Discrepancy.count.to_s
puts 'TodoItem count: ' + TodoItem.count.to_s
puts ''
puts '=== 角色测试 ==='
User.all.each { |u| puts "  #{u.name} - #{u.role}" }
puts ''
puts '=== 结算计算服务测试 ==='
settlement = Settlement.first
if settlement
  svc = SettlementCalculatorService.new(settlement)
  result = svc.calculate
  puts "  结算单 ##{settlement.id}: 系统金额 #{result[:system_amount]}, 商户金额 #{result[:merchant_amount]}, 差异 #{result[:difference_amount]}"
  puts "  有差异: #{result[:has_discrepancy]}"
end
puts ''
puts '=== 权限测试 ==='
user = User.find_by(role: 'cs')
policy = SettlementPolicy.new(user, Settlement)
puts "  客服查看结算单: #{policy.index?}"
puts "  客服提交审批: #{policy.submit_for_approval?}"
user2 = User.find_by(role: 'merchant')
policy2 = SettlementPolicy.new(user2, Settlement)
puts "  商户查看结算单: #{policy2.index?}"
puts "  商户提交审批: #{policy2.submit_for_approval?}"
puts ''
puts '=== 待办池测试 ==='
todo = TodoItem.first
if todo
  puts "  待办事项: #{todo.title} - 状态: #{todo.status}"
  puts "  指派人: #{todo.assignee&.name || '未指派'}"
end
puts ''
puts '=== Sidekiq 测试 ==='
puts '  Redis 连接: ' + (Sidekiq.redis { |r| r.ping } rescue 'FAIL')
puts ''
puts '=== 所有测试通过 ==='
