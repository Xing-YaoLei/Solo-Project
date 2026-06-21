puts "开始创建测试数据..."

User.transaction do
  cs_user = User.find_or_create_by!(email: 'cs@example.com') do |u|
    u.name = '测试客服'
    u.phone = '13800138001'
    u.role = :cs
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end
  puts "✅ 创建/找到客服用户: #{cs_user.name}"

  merchant = Merchant.find_or_create_by!(name: '测试商户1') do |m|
    m.contact = '商户联系人'
    m.phone = '13900139001'
    m.city_id = 1
  end
  puts "✅ 创建/找到商户: #{merchant.name}"

  merchant_user = User.find_or_create_by!(email: 'merchant@example.com') do |u|
    u.name = '测试商户管理员'
    u.phone = '13900139002'
    u.role = :merchant
    u.merchant_id = merchant.id
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end
  puts "✅ 创建/找到商户用户: #{merchant_user.name}"

  rider = User.find_or_create_by!(email: 'rider@example.com') do |u|
    u.name = '测试骑手'
    u.phone = '13700137001'
    u.role = :rider
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end
  puts "✅ 创建/找到骑手用户: #{rider.name}"

  manager = User.find_or_create_by!(email: 'manager@example.com') do |u|
    u.name = '测试城市经理'
    u.phone = '13600136001'
    u.role = :city_manager
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end
  puts "✅ 创建/找到城市经理: #{manager.name}"

  5.times do |i|
    order = DeliveryOrder.find_or_create_by!(order_no: "ORD#{202401}#{sprintf('%04d', i + 1)}") do |o|
      o.merchant_id = merchant.id
      o.rider_id = rider.id
      o.amount = 50.0 + i * 10.0
      o.status = :delivered
      o.delivery_time = DateTime.now - i.days
    end
    puts "✅ 创建配送订单: #{order.order_no} - ¥#{order.amount}"
  end

  period = Date.today.strftime('%Y-%m')
  system_amount = merchant.delivery_orders.completed.by_delivery_date(
    Date.parse("#{period}-01"),
    Date.parse("#{period}-01").end_of_month
  ).sum(:amount)
  merchant_amount = system_amount - 500.0

  settlement = merchant.settlements.find_or_initialize_by(period: period)
  settlement.assign_attributes(
    system_amount: system_amount,
    merchant_amount: merchant_amount,
    difference_amount: system_amount - merchant_amount,
    status: :pending,
    payment_date: Date.parse("#{period}-01").end_of_month + 7.days
  )
  settlement.save!
  puts "✅ 生成结算单: #{settlement.period}"
  puts "   系统金额: ¥#{sprintf('%.2f', settlement.system_amount)}"
  puts "   商户金额: ¥#{sprintf('%.2f', settlement.merchant_amount)}"
  puts "   差异金额: ¥#{sprintf('%.2f', settlement.difference_amount)}"

  if settlement.difference_amount != 0
    discrepancy = settlement.discrepancies.create!(
      difference_amount: settlement.difference_amount,
      status: :pending,
      description: "系统计算金额与商家金额存在差异 - 测试数据"
    )
    puts "✅ 创建差异记录 ##{discrepancy.id[0..7]}"

    cs_users = User.by_role(:cs)
    cs_users.each do |cs|
      todo = TodoItem.create!(
        settlement: settlement,
        discrepancy: discrepancy,
        assignee: cs,
        title: "处理结算单差异 - #{merchant.name} #{period}",
        description: "差异金额: #{sprintf("%.2f", settlement.difference_amount)}元",
        priority: :high,
        status: :pending,
        due_date: 3.days.from_now
      )
      puts "✅ 创建待办事项 ##{todo.id[0..7]} 分配给 #{cs.name}"
    end

    material = discrepancy.supplement_materials.create!(
      uploader: cs_user,
      description: "初始对账单 - 测试材料",
      file_url: "https://example.com/statement.pdf"
    )
    puts "✅ 创建补充材料 ##{material.id[0..7]}"
  end

  puts "\n=== 测试数据创建完成 ==="
  puts "客服登录: cs@example.com / password123"
  puts "商户登录: merchant@example.com / password123"
  puts "骑手登录: rider@example.com / password123"
  puts "经理登录: manager@example.com / password123"
  puts ""
  puts "测试数据统计:"
  puts "- 结算单: #{Settlement.count} 条"
  puts "- 差异记录: #{Discrepancy.count} 条"
  puts "- 待办事项: #{TodoItem.count} 条"
  puts "- 补充材料: #{SupplementMaterial.count} 条"
  puts "- 配送订单: #{DeliveryOrder.count} 条"
  puts "========================"
end
