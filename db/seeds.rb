puts "=== 开始创建种子数据 ==="

puts "--- 创建用户 ---"
users_data = [
  { email: 'admin@example.com', name: '管理员', role: 'admin', phone: '13800000001' },
  { email: 'manager@example.com', name: '张经理', role: 'manager', phone: '13800000002' },
  { email: 'technician1@example.com', name: '李技师', role: 'technician', phone: '13800000003' },
  { email: 'technician2@example.com', name: '王技师', role: 'technician', phone: '13800000004' }
]

users = {}
users_data.each do |data|
  user = User.find_or_create_by!(email: data[:email]) do |u|
    u.name = data[:name]
    u.role = data[:role]
    u.phone = data[:phone]
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end
  users[data[:role]] = user
  puts "  创建用户: #{user.name} (#{user.role})"
end

admin = users['admin']
manager = users['manager']
technician1 = users['technician']
technician2 = User.find_by(email: 'technician2@example.com')

puts "--- 创建配件 ---"
parts_data = [
  { sku: 'OIL-001', name: '全合成机油 5W-30', category: '油液类', brand: '美孚', specification: '4L/桶', unit: '桶', cost_price: 180.00, selling_price: 280.00, stock_quantity: 50, safety_stock: 10, location: 'A-01-01' },
  { sku: 'OIL-002', name: '半合成机油 10W-40', category: '油液类', brand: '壳牌', specification: '4L/桶', unit: '桶', cost_price: 120.00, selling_price: 198.00, stock_quantity: 35, safety_stock: 10, location: 'A-01-02' },
  { sku: 'OIL-003', name: '变速箱油 ATF', category: '油液类', brand: '嘉实多', specification: '1L/瓶', unit: '瓶', cost_price: 85.00, selling_price: 138.00, stock_quantity: 3, safety_stock: 8, location: 'A-01-03' },
  { sku: 'FIL-001', name: '机油滤清器', category: '滤清器', brand: '曼牌', specification: 'W712/94', unit: '个', cost_price: 35.00, selling_price: 68.00, stock_quantity: 100, safety_stock: 20, location: 'A-02-01' },
  { sku: 'FIL-002', name: '空气滤清器', category: '滤清器', brand: '曼牌', specification: 'C27125', unit: '个', cost_price: 45.00, selling_price: 88.00, stock_quantity: 0, safety_stock: 15, location: 'A-02-02' },
  { sku: 'FIL-003', name: '空调滤清器', category: '滤清器', brand: '博世', specification: '带活性炭', unit: '个', cost_price: 55.00, selling_price: 98.00, stock_quantity: 60, safety_stock: 15, location: 'A-02-03' },
  { sku: 'BRA-001', name: '前刹车片', category: '制动系统', brand: '博世', specification: '陶瓷配方', unit: '套', cost_price: 180.00, selling_price: 320.00, stock_quantity: 25, safety_stock: 5, location: 'B-01-01' },
  { sku: 'BRA-002', name: '后刹车片', category: '制动系统', brand: '天合', specification: '陶瓷配方', unit: '套', cost_price: 160.00, selling_price: 290.00, stock_quantity: 2, safety_stock: 5, location: 'B-01-02' },
  { sku: 'BRA-003', name: '刹车盘', category: '制动系统', brand: '博世', specification: '前盘', unit: '对', cost_price: 380.00, selling_price: 650.00, stock_quantity: 15, safety_stock: 3, location: 'B-01-03' },
  { sku: 'BRA-004', name: '刹车油 DOT4', category: '制动系统', brand: '博世', specification: '1L/瓶', unit: '瓶', cost_price: 45.00, selling_price: 78.00, stock_quantity: 0, safety_stock: 10, location: 'B-01-04' },
  { sku: 'ENG-001', name: '火花塞', category: '发动机', brand: 'NGK', specification: '铱金', unit: '支', cost_price: 55.00, selling_price: 98.00, stock_quantity: 80, safety_stock: 20, location: 'B-02-01' },
  { sku: 'ENG-002', name: '点火线圈', category: '发动机', brand: '电装', specification: '单支', unit: '支', cost_price: 180.00, selling_price: 320.00, stock_quantity: 12, safety_stock: 5, location: 'B-02-02' },
  { sku: 'ENG-003', name: '正时皮带套装', category: '发动机', brand: '盖茨', specification: '含张紧轮', unit: '套', cost_price: 380.00, selling_price: 680.00, stock_quantity: 8, safety_stock: 3, location: 'B-02-03' },
  { sku: 'SUS-001', name: '前减震器', category: '悬挂系统', brand: 'KYB', specification: '油压式', unit: '支', cost_price: 280.00, selling_price: 480.00, stock_quantity: 10, safety_stock: 4, location: 'C-01-01' },
  { sku: 'SUS-002', name: '后减震器', category: '悬挂系统', brand: 'KYB', specification: '油压式', unit: '支', cost_price: 260.00, selling_price: 450.00, stock_quantity: 0, safety_stock: 4, location: 'C-01-02' },
  { sku: 'ELE-001', name: '蓄电池 60AH', category: '电气系统', brand: '瓦尔塔', specification: '12V 60AH', unit: '个', cost_price: 380.00, selling_price: 580.00, stock_quantity: 20, safety_stock: 5, location: 'D-01-01' },
  { sku: 'ELE-002', name: '蓄电池 80AH', category: '电气系统', brand: '风帆', specification: '12V 80AH', unit: '个', cost_price: 480.00, selling_price: 720.00, stock_quantity: 5, safety_stock: 3, location: 'D-01-02' },
  { sku: 'ELE-003', name: '发电机', category: '电气系统', brand: '电装', specification: '14V 120A', unit: '台', cost_price: 880.00, selling_price: 1580.00, stock_quantity: 3, safety_stock: 2, location: 'D-01-03' },
  { sku: 'TIR-001', name: '轮胎 205/55R16', category: '轮胎', brand: '米其林', specification: '浩悦4', unit: '条', cost_price: 550.00, selling_price: 850.00, stock_quantity: 15, safety_stock: 4, location: 'E-01-01' },
  { sku: 'TIR-002', name: '轮胎 225/50R17', category: '轮胎', brand: '倍耐力', specification: 'P7', unit: '条', cost_price: 680.00, selling_price: 1050.00, stock_quantity: 2, safety_stock: 4, location: 'E-01-02' }
]

parts = []
parts_data.each do |data|
  part = Part.find_or_create_by!(sku: data[:sku]) do |p|
    p.assign_attributes(data)
  end
  parts << part
  status = part.stock_quantity.zero? ? '缺货' : (part.low_stock? ? '低库存' : '正常')
  puts "  创建配件: #{part.name} (#{status})"
end

puts "--- 创建工单 ---"
vehicle_brands = %w[大众 丰田 本田 宝马 奔驰 奥迪 日产 福特 别克 雪佛兰]
vehicle_models = {
  '大众' => %w[帕萨特 迈腾 速腾 朗逸],
  '丰田' => %w[凯美瑞 卡罗拉 雷凌 RAV4],
  '本田' => %w[雅阁 思域 CR-V 飞度],
  '宝马' => %w[3系 5系 X3 X5],
  '奔驰' => %w[C级 E级 GLC GLE],
  '奥迪' => %w[A4L A6L Q5 Q7],
  '日产' => %w[天籁 轩逸 奇骏 逍客],
  '福特' => %w[蒙迪欧 福克斯 锐界 翼虎],
  '别克' => %w[君越 君威 英朗 昂科威],
  '雪佛兰' => %w[迈锐宝 科鲁兹 探界者 创酷]
}
statuses = WorkOrder::STATUSES
priorities = WorkOrder::PRIORITIES
customer_names = ['陈先生', '李女士', '王先生', '张女士', '刘先生', '赵女士', '孙先生', '周女士', '吴先生', '郑女士']
descriptions = [
  '常规保养，更换机油机滤',
  '刹车异响，检查制动系统',
  '发动机故障灯亮，需要诊断',
  '空调不制冷，检修空调系统',
  '更换轮胎并做四轮定位',
  '电瓶亏电，需要更换蓄电池',
  '变速箱顿挫，检查变速箱',
  '悬挂异响，检查减震器',
  '大灯不亮，更换灯泡',
  '雨刮器更换',
  '防冻液更换',
  '火花塞更换',
  '正时皮带更换',
  '全车检查',
  '发动机大修'
]

work_orders = []
technicians = [technician1, technician2]
creators = [admin, manager]

15.times do |i|
  brand = vehicle_brands.sample
  model = vehicle_models[brand].sample
  plate = "京#{('A'..'Z').to_a.sample}#{rand(10000..99999)}"
  
  is_repair = i >= 12
  status = is_repair ? %w[pending in_progress completed].sample : statuses.sample
  priority = priorities.sample
  assigned_to = technicians.sample
  created_by = creators.sample
  completed_at = (status == 'completed') ? (rand(1..10).days.ago + rand(1..8).hours) : nil
  
  work_order = WorkOrder.create!(
    user: admin,
    customer_name: customer_names.sample,
    customer_phone: "138#{rand(10000000..99999999)}",
    vehicle_brand: brand,
    vehicle_model: model,
    vehicle_plate: plate,
    vehicle_mileage: rand(10000..150000),
    status: status,
    priority: priority,
    is_repair: is_repair,
    description: descriptions.sample,
    total_amount: rand(300..5000).to_f,
    assigned_to: assigned_to,
    created_by: created_by,
    completed_at: completed_at,
    created_at: (rand(1..30).days.ago),
    updated_at: (rand(1..10).days.ago)
  )
  
  if is_repair && i > 12
    work_order.parent_work_order = work_orders[rand(0..10)]
    work_order.save!
  end
  
  work_orders << work_order
  repair_tag = is_repair ? ' [返修]' : ''
  puts "  创建工单: #{work_order.work_order_no} - #{brand} #{model} #{plate} (#{status}/#{priority})#{repair_tag}"
end

puts "--- 创建工单项目 ---"
service_names = [
  { name: '机油更换', unit_price: 80, labor_fee: 50 },
  { name: '机滤更换', unit_price: 20, labor_fee: 20 },
  { name: '空滤更换', unit_price: 30, labor_fee: 20 },
  { name: '空调滤更换', unit_price: 40, labor_fee: 30 },
  { name: '刹车检查', unit_price: 50, labor_fee: 100 },
  { name: '刹车片更换', unit_price: 100, labor_fee: 150 },
  { name: '刹车盘更换', unit_price: 150, labor_fee: 200 },
  { name: '轮胎更换', unit_price: 50, labor_fee: 80 },
  { name: '四轮定位', unit_price: 200, labor_fee: 100 },
  { name: '电瓶更换', unit_price: 80, labor_fee: 50 },
  { name: '火花塞更换', unit_price: 60, labor_fee: 120 },
  { name: '变速箱油更换', unit_price: 150, labor_fee: 200 },
  { name: '防冻液更换', unit_price: 80, labor_fee: 60 },
  { name: '发动机诊断', unit_price: 200, labor_fee: 150 },
  { name: '空调检修', unit_price: 150, labor_fee: 200 }
]

work_order_items = []
work_orders.each do |wo|
  item_count = rand(2..5)
  item_count.times do
    service = service_names.sample
    item_status = wo.status == 'completed' ? 'completed' : (wo.status == 'in_progress' ? %w[pending in_progress completed].sample : 'pending')
    
    woi = WorkOrderItem.create!(
      work_order: wo,
      name: service[:name],
      description: "执行#{service[:name]}服务",
      quantity: rand(1..2),
      unit_price: service[:unit_price],
      labor_fee: service[:labor_fee],
      status: item_status,
      technician: technicians.sample
    )
    work_order_items << woi
  end
  puts "  工单 #{wo.work_order_no}: 创建 #{item_count} 个项目"
end

puts "--- 创建工单配件 ---"
work_order_parts = []
work_orders.each do |wo|
  part_count = rand(1..4)
  selected_parts = parts.sample(part_count)
  
  selected_parts.each do |part|
    is_out_of_stock = (part.stock_quantity.zero? || part.stock_quantity < 3) && rand(3) == 0
    
    wop = WorkOrderPart.create!(
      work_order: wo,
      part: part,
      quantity: rand(1..4),
      unit_price: part.selling_price,
      is_out_of_stock: is_out_of_stock,
      shortage_confirmed: is_out_of_stock ? [true, false].sample : false,
      shortage_handled_at: is_out_of_stock && rand(2) == 0 ? Time.current : nil,
      shortage_handled_by: is_out_of_stock ? manager : nil,
      shortage_note: is_out_of_stock ? '配件缺货，已通知采购' : nil
    )
    work_order_parts << wop
  end
  shortage_count = selected_parts.count { |p| p.stock_quantity.zero? || p.stock_quantity < 3 }
  puts "  工单 #{wo.work_order_no}: 创建 #{part_count} 个配件#{shortage_count > 0 ? " (#{shortage_count}个缺货)" : ''}"
end

puts "--- 创建报价单 ---"
work_orders_with_quote = work_orders.select { |wo| %w[quoted in_progress completed].include?(wo.status) }.sample(8)
quotes = []

work_orders_with_quote.each do |wo|
  quote_status = wo.status == 'completed' ? 'approved' : %w[draft sent approved rejected expired].sample
  
  quote = Quote.create!(
    work_order: wo,
    status: quote_status,
    valid_until: 30.days.from_now,
    customer_approved: quote_status == 'approved',
    approved_by: quote_status == 'approved' ? manager : nil,
    approved_at: quote_status == 'approved' ? Time.current : nil,
    created_by: [admin, manager].sample
  )
  
  quote_item_count = rand(3..6)
  selected_services = service_names.sample(quote_item_count / 2 + 1)
  selected_parts = parts.sample(quote_item_count / 2 + 1)
  
  selected_services.each do |service|
    QuoteItem.create!(
      quote: quote,
      item_type: 'service',
      name: service[:name],
      description: "工时费用: #{service[:name]}",
      quantity: rand(1..2),
      unit_price: service[:unit_price] + service[:labor_fee],
      discount_rate: rand(0..10).to_f
    )
  end
  
  selected_parts.each do |part|
    QuoteItem.create!(
      quote: quote,
      item_type: 'part',
      name: part.name,
      description: "#{part.brand} #{part.specification}",
      quantity: rand(1..3),
      unit_price: part.selling_price,
      discount_rate: rand(0..15).to_f
    )
  end
  
  quote.calculate_total
  quote.save!
  quotes << quote
  puts "  创建报价单: #{quote.quote_no} - 工单 #{wo.work_order_no} (#{quote.status}, ¥#{quote.total_amount})"
end

puts "--- 创建时间线事件 ---"
event_contents = {
  'work_order_created' => ['工单已创建', '新工单已登记', '客户车辆已入库'],
  'status_change' => ['状态变更为待处理', '状态变更为处理中', '状态变更为已完成', '状态变更为已报价'],
  'assignment_change' => ['已分配给技师处理', '处理人已变更', '重新分配技师'],
  'note_added' => ['客户补充了维修需求', '添加了内部备注', '技师反馈了检查结果'],
  'part_shortage' => ['发现配件缺货', '配件库存不足，需要采购', '缺货配件已下单'],
  'photo_added' => ['已上传车辆检查照片', '添加了故障部位照片', '上传了维修过程照片'],
  'quote_created' => ['已生成报价单', '报价单已发送给客户', '报价单待客户确认'],
  'quote_approved' => ['客户已确认报价', '报价单已批准', '可以开始维修作业']
}

work_orders.each do |wo|
  event_count = rand(2..5)
  event_types = TimelineEvent::EVENT_TYPES.sample(event_count)
  
  # 确保至少有创建事件
  unless event_types.include?('work_order_created')
    event_types[0] = 'work_order_created'
  end
  
  event_types.each do |event_type|
    content = event_contents[event_type].sample
    TimelineEvent.create!(
      work_order: wo,
      event_type: event_type,
      content: content,
      user: [admin, manager, technician1, technician2].sample,
      metadata: { ip: '192.168.1.100', browser: 'Chrome' },
      created_at: wo.created_at + rand(0..10).hours
    )
  end
  puts "  工单 #{wo.work_order_no}: 创建 #{event_count} 个时间线事件"
end

puts "--- 创建备注 ---"
work_orders_with_notes = work_orders.sample(10)
note_contents = [
  '客户要求使用原厂配件',
  '车辆有轻微划痕，已告知客户',
  '客户希望下午3点前取车',
  '检查发现还有其他潜在问题，建议后续处理',
  '客户是老客户，给予9折优惠',
  '需要等配件到货后才能继续维修',
  '技师反馈维修难度较大，可能需要延长时间',
  '客户对报价有疑问，需要进一步解释',
  '车辆保养记录齐全',
  '首次到店客户，推荐办理会员卡'
]

work_orders_with_notes.each do |wo|
  note_count = rand(1..3)
  note_count.times do
    Note.create!(
      work_order: wo,
      content: note_contents.sample,
      author: [admin, manager, technician1, technician2].sample,
      is_private: rand(3) == 0
    )
  end
  puts "  工单 #{wo.work_order_no}: 创建 #{note_count} 条备注"
end

puts "--- 创建缺货提醒 ---"
stock_alerts = []
out_of_stock_parts = work_order_parts.select(&:is_out_of_stock)
alert_count = [out_of_stock_parts.length, 8].min

(0...alert_count).each do |i|
  wop = out_of_stock_parts[i]
  status = StockAlert::STATUSES.sample
  handler = status == 'pending' ? nil : manager
  
  sa = StockAlert.create!(
    part: wop.part,
    work_order: wop.work_order,
    work_order_part: wop,
    status: status,
    affected_scope: status != 'pending' ? "影响工单 #{wop.work_order.work_order_no} 的维修进度" : nil,
    handler: handler,
    reassigned_to: status == 'processing' ? (rand(2) == 0 ? technician1 : nil) : nil,
    resolved_at: status == 'resolved' ? Time.current : nil,
    supplementary_note: status == 'resolved' ? '配件已到货，问题已解决' : (status == 'processing' ? '正在联系供应商采购' : nil)
  )
  stock_alerts << sa
  puts "  创建缺货提醒: #{wop.part.name} - 工单 #{wop.work_order.work_order_no} (#{status})"
end

# 补充额外的缺货提醒
(alert_count...6).each do
  part = parts.select { |p| p.stock_quantity.zero? || p.low_stock? }.sample
  wo = work_orders.sample
  wop = WorkOrderPart.create!(
    work_order: wo,
    part: part,
    quantity: 1,
    unit_price: part.selling_price,
    is_out_of_stock: true
  )
  status = StockAlert::STATUSES.sample
  sa = StockAlert.create!(
    part: part,
    work_order: wo,
    work_order_part: wop,
    status: status,
    handler: status != 'pending' ? manager : nil,
    resolved_at: status == 'resolved' ? Time.current : nil
  )
  stock_alerts << sa
  puts "  创建缺货提醒: #{part.name} - 工单 #{wo.work_order_no} (#{status})"
end

puts "=== 种子数据创建完成 ==="
puts "统计:"
puts "  用户: #{User.count}"
puts "  配件: #{Part.count} (缺货: #{Part.out_of_stock.count}, 低库存: #{Part.low_stock.count})"
puts "  工单: #{WorkOrder.count} (返修: #{WorkOrder.repairs.count})"
puts "  工单项目: #{WorkOrderItem.count}"
puts "  工单配件: #{WorkOrderPart.count} (缺货: #{WorkOrderPart.out_of_stock.count})"
puts "  报价单: #{Quote.count}"
puts "  报价项目: #{QuoteItem.count}"
puts "  时间线事件: #{TimelineEvent.count}"
puts "  备注: #{Note.count}"
puts "  缺货提醒: #{StockAlert.count}"
