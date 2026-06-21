# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts '开始创建种子数据...'

# 创建测试商户
merchant1 = Merchant.find_or_create_by!(name: '美味餐厅') do |m|
  m.contact = '张经理'
  m.phone = '13800138001'
  m.city_id = 1
  m.settlement_config = {
    settlement_cycle: 'weekly',
    commission_rate: 0.2,
    payment_method: 'bank_transfer'
  }
end

merchant2 = Merchant.find_or_create_by!(name: '鲜果时光') do |m|
  m.contact = '李店长'
  m.phone = '13800138002'
  m.city_id = 1
  m.settlement_config = {
    settlement_cycle: 'monthly',
    commission_rate: 0.15,
    payment_method: 'alipay'
  }
end

puts "已创建商户: #{merchant1.name}, #{merchant2.name}"

# 创建测试用户
merchant_user = User.find_or_create_by!(email: 'merchant@example.com') do |u|
  u.name = '商户用户'
  u.phone = '13900139001'
  u.role = :merchant
  u.city_id = 1
  u.merchant_id = merchant1.id
  u.password = 'password123'
  u.password_confirmation = 'password123'
end

rider_user = User.find_or_create_by!(email: 'rider@example.com') do |u|
  u.name = '骑手小王'
  u.phone = '13900139002'
  u.role = :rider
  u.city_id = 1
  u.password = 'password123'
  u.password_confirmation = 'password123'
end

cs_user = User.find_or_create_by!(email: 'cs@example.com') do |u|
  u.name = '客服小李'
  u.phone = '13900139003'
  u.role = :cs
  u.city_id = 1
  u.password = 'password123'
  u.password_confirmation = 'password123'
end

city_manager_user = User.find_or_create_by!(email: 'manager@example.com') do |u|
  u.name = '城市经理'
  u.phone = '13900139004'
  u.role = :city_manager
  u.city_id = 1
  u.password = 'password123'
  u.password_confirmation = 'password123'
end

puts "已创建用户: #{merchant_user.name}(商户), #{rider_user.name}(骑手), #{cs_user.name}(客服), #{city_manager_user.name}(城市经理)"

# 创建配送订单
delivery_orders = []
10.times do |i|
  order = DeliveryOrder.find_or_create_by!(order_no: "DO202606#{sprintf('%04d', i + 1)}") do |o|
    o.rider_id = rider_user.id
    o.merchant_id = i.even? ? merchant1.id : merchant2.id
    o.amount = rand(20.0..200.0).round(2)
    o.status = [:pending, :assigned, :picked_up, :delivered, :cancelled].sample
    o.delivery_time = i.days.ago
  end
  delivery_orders << order
end

puts "已创建 #{delivery_orders.count} 个配送订单"

# 创建结算单
settlement1 = Settlement.find_or_create_by!(merchant_id: merchant1.id, period: '2026-W24') do |s|
  s.handler_id = cs_user.id
  s.system_amount = 5000.00
  s.merchant_amount = 4800.00
  s.difference_amount = 200.00
  s.status = :pending
  s.payment_date = 1.week.from_now.to_date
  s.metadata = {
    order_count: 25,
    average_order_amount: 200.0
  }
end

settlement2 = Settlement.find_or_create_by!(merchant_id: merchant2.id, period: '2026-W24') do |s|
  s.handler_id = cs_user.id
  s.system_amount = 3500.00
  s.merchant_amount = 3500.00
  s.difference_amount = 0.00
  s.status = :approved
  s.payment_date = 2.days.ago.to_date
  s.metadata = {
    order_count: 18,
    average_order_amount: 194.44
  }
end

settlement3 = Settlement.find_or_create_by!(merchant_id: merchant1.id, period: '2026-W23') do |s|
  s.handler_id = city_manager_user.id
  s.system_amount = 6200.00
  s.merchant_amount = 6000.00
  s.difference_amount = 200.00
  s.status = :completed
  s.payment_date = 3.weeks.ago.to_date
  s.metadata = {
    order_count: 31,
    average_order_amount: 200.0
  }
end

puts "已创建结算单: #{settlement1.period}, #{settlement2.period}, #{settlement3.period}"

# 创建结算明细
settlement1_items = delivery_orders.first(5).map do |order|
  SettlementItem.find_or_create_by!(settlement_id: settlement1.id, delivery_order_id: order.id) do |item|
    item.amount = order.amount
    item.item_type = 'delivery_fee'
    item.details = {
      order_no: order.order_no,
      delivery_time: order.delivery_time
    }
  end
end

puts "已创建 #{settlement1_items.count} 条结算明细"

# 创建差异记录
discrepancy1 = Discrepancy.find_or_create_by!(settlement_id: settlement1.id) do |d|
  d.difference_amount = 200.00
  d.reason = '系统统计与商户上报金额存在差异，需核对订单明细'
  d.status = :investigating
  d.comparison_data = {
    system_calculation: {
      order_count: 25,
      total_amount: 5000.00
    },
    merchant_report: {
      order_count: 24,
      total_amount: 4800.00
    },
    difference: {
      order_count: 1,
      amount: 200.00
    }
  }
end

discrepancy2 = Discrepancy.find_or_create_by!(settlement_id: settlement3.id) do |d|
  d.difference_amount = 200.00
  d.reason = '优惠券抵扣金额计算差异，已核实并解决'
  d.status = :resolved
  d.comparison_data = {
    system_calculation: {
      order_count: 31,
      total_amount: 6200.00
    },
    merchant_report: {
      order_count: 31,
      total_amount: 6000.00
    },
    resolution: '优惠券抵扣金额200元，已在结算中扣除'
  }
end

puts "已创建差异记录: #{discrepancy1.reason[0..20]}..., #{discrepancy2.reason[0..20]}..."

# 创建补充材料
supplement1 = SupplementMaterial.find_or_create_by!(discrepancy_id: discrepancy1.id, uploader_id: merchant_user.id) do |s|
  s.description = '商户提供的订单明细截图'
  s.metadata = {
    file_type: 'image',
    file_size: '2.5MB',
    upload_time: Time.now
  }
end

puts "已创建补充材料: #{supplement1.description}"

# 创建合同附件
contract1 = ContractAttachment.find_or_create_by!(merchant_id: merchant1.id, uploader_id: city_manager_user.id) do |c|
  c.file_type = 'agreement'
  c.file_name = '入驻合作协议_v2.pdf'
  c.version = 'v2.0'
  c.effective_date = 6.months.ago
  c.expiry_date = 6.months.from_now
end

puts "已创建合同附件: #{contract1.file_name}"

# 创建审批节点
approval_node1 = ApprovalNode.find_or_create_by!(name: '客服审核') do |node|
  node.order = 1
  node.approver_role = 'cs'
  node.threshold_amount = nil
  node.active = true
end

approval_node2 = ApprovalNode.find_or_create_by!(name: '城市经理审核') do |node|
  node.order = 2
  node.approver_role = 'city_manager'
  node.threshold_amount = 10000.00
  node.parent_id = approval_node1.id
  node.active = true
end

puts "已创建审批节点: #{approval_node1.name}, #{approval_node2.name}"

# 创建审批记录
approval_record1 = ApprovalRecord.find_or_create_by!(settlement_id: settlement2.id, approval_node_id: approval_node1.id, approver_id: cs_user.id) do |r|
  r.decision = :approved
  r.comment = '金额核对无误，同意结算'
end

approval_record2 = ApprovalRecord.find_or_create_by!(settlement_id: settlement3.id, approval_node_id: approval_node2.id, approver_id: city_manager_user.id) do |r|
  r.decision = :approved
  r.comment = '差异已解决，同意最终结算'
end

puts "已创建审批记录"

# 创建待办事项
todo1 = TodoItem.find_or_create_by!(title: '核对美味餐厅结算差异', assignee_id: cs_user.id) do |t|
  t.settlement_id = settlement1.id
  t.discrepancy_id = discrepancy1.id
  t.assigner_id = city_manager_user.id
  t.description = '请核对2026-W24周期美味餐厅的200元结算差异，联系商户确认缺失订单'
  t.priority = :high
  t.status = :in_progress
  t.due_date = 3.days.from_now.to_date
end

todo2 = TodoItem.find_or_create_by!(title: '跟进鲜果时光合同续签', assignee_id: cs_user.id) do |t|
  t.assigner_id = city_manager_user.id
  t.description = '鲜果时光合同将在6个月后到期，请提前联系商户准备续签'
  t.priority = :medium
  t.status = :pending
  t.due_date = 1.month.from_now.to_date
end

todo3 = TodoItem.find_or_create_by!(title: '处理骑手配送异常', assignee_id: cs_user.id) do |t|
  t.assigner_id = cs_user.id
  t.description = 'DO2026060003订单配送超时，需要联系客户说明情况'
  t.priority = :urgent
  t.status = :pending
  t.due_date = Date.today
end

puts "已创建待办事项: #{todo1.title}, #{todo2.title}, #{todo3.title}"

# 创建金额变更日志
audit_log1 = AmountAuditLog.find_or_create_by!(settlement_id: settlement3.id, operator_id: cs_user.id) do |log|
  log.old_amount = 6200.00
  log.new_amount = 6000.00
  log.change_reason = '扣除优惠券抵扣金额200元'
  log.metadata = {
    coupon_code: 'SAVE200',
    coupon_amount: 200.00,
    related_order: 'DO2026060015'
  }
end

puts "已创建金额变更日志"

# 创建筛选配置
filter_config1 = FilterConfig.find_or_create_by!(user_id: cs_user.id, name: '待处理结算单', target_model: 'Settlement') do |f|
  f.conditions = {
    status: 'pending',
    sort_by: 'created_at',
    sort_order: 'desc'
  }
  f.is_default = true
end

filter_config2 = FilterConfig.find_or_create_by!(user_id: merchant_user.id, name: '我的结算单', target_model: 'Settlement') do |f|
  f.conditions = {
    merchant_id: merchant1.id,
    sort_by: 'period',
    sort_order: 'desc'
  }
  f.is_default = true
end

puts "已创建筛选配置"

puts ''
puts '=' * 50
puts '种子数据创建完成！'
puts '=' * 50
puts ''
puts '测试账号：'
puts "  商户用户: merchant@example.com / password123"
puts "  骑手用户: rider@example.com / password123"
puts "  客服用户: cs@example.com / password123"
puts "  城市经理: manager@example.com / password123"
puts ''
puts '数据统计：'
puts "  用户数: #{User.count}"
puts "  商户数: #{Merchant.count}"
puts "  配送订单数: #{DeliveryOrder.count}"
puts "  结算单数: #{Settlement.count}"
puts "  差异记录数: #{Discrepancy.count}"
puts "  待办事项数: #{TodoItem.count}"
