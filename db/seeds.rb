admin = User.create_with(
  name: '系统管理员',
  email: 'admin@example.com',
  role: 'admin',
  password: 'password123'
).first_or_create!

User.create_with(
  name: '张复核',
  email: 'reviewer@example.com',
  role: 'reviewer',
  password: 'password123'
).first_or_create!

operator1 = User.create_with(
  name: '李操作员',
  email: 'operator1@example.com',
  role: 'operator',
  password: 'password123'
).first_or_create!

operator2 = User.create_with(
  name: '王操作员',
  email: 'operator2@example.com',
  role: 'operator',
  password: 'password123'
).first_or_create!

puts "已创建/更新用户:"
puts "  管理员: admin@example.com / password123"
puts "  复核员: reviewer@example.com / password123"
puts "  操作员1: operator1@example.com / password123"
puts "  操作员2: operator2@example.com / password123"

if PickupOrder.count == 0
  sources = PickupOrder::SOURCES
  product_tags = ['生鲜', '水果', '蔬菜', '肉类', '零食', '饮料', '日用品', '冷冻']
  product_names = {
    '生鲜' => ['鸡蛋', '牛奶', '面包', '酸奶'],
    '水果' => ['苹果', '香蕉', '橙子', '葡萄', '西瓜'],
    '蔬菜' => ['白菜', '萝卜', '土豆', '西红柿', '黄瓜'],
    '肉类' => ['猪肉', '牛肉', '鸡肉', '鱼肉'],
    '零食' => ['薯片', '饼干', '巧克力', '糖果'],
    '饮料' => ['矿泉水', '可乐', '果汁', '牛奶茶'],
    '日用品' => ['纸巾', '洗衣液', '牙膏', '洗发水'],
    '冷冻' => ['饺子', '包子', '冰淇淋', '鸡块']
  }

  30.times do |i|
    pickup_code = "TC#{Time.now.strftime('%Y%m%d')}#{sprintf('%04d', i + 1)}"
    source = sources.sample
    customer_name = Faker::Name.name
    customer_phone = Faker::PhoneNumber.phone_number
    estimated_pickup_time = (rand(7).days + rand(24).hours).ago

    order = PickupOrder.create!(
      pickup_code: pickup_code,
      customer_name: customer_name,
      customer_phone: customer_phone,
      source: source,
      status: PickupOrder::STATUS_DISPLAY.keys.sample,
      estimated_pickup_time: estimated_pickup_time,
      actual_pickup_time: estimated_pickup_time + rand(60).minutes,
      operator: [operator1, operator2].sample,
      reviewer: [admin, nil].sample,
      notes: Faker::Lorem.sentence(word_count: 10)
    )

    item_count = rand(2..5)
    has_shortage = rand(5) == 0

    item_count.times do
      tag = product_tags.sample
      product_name = product_names[tag].sample
      expected_qty = rand(1..5)
      actual_qty = has_shortage && rand(3) == 0 ? [expected_qty - rand(1..2), 0].max : expected_qty

      order.pickup_items.create!(
        product_name: product_name,
        product_code: "SKU#{sprintf('%06d', rand(100000))}",
        product_tag: tag,
        expected_quantity: expected_qty,
        actual_quantity: actual_qty,
        unit_price: sprintf('%.2f', rand(5.0..50.0))
      )
    end

    order.calculate_shortage!

    if order.has_shortage?
      order.pickup_items.where('shortage_quantity > 0').each do |item|
        order.shortage_records.create!(
          pickup_item: item,
          shortage_quantity: item.shortage_quantity,
          reason: ShortageRecord::REASONS.sample,
          status: ['pending', 'handled'].sample,
          compensation_amount: item.unit_price * item.shortage_quantity,
          handled_by: [admin, nil].sample,
          handled_at: Time.current,
          remark: Faker::Lorem.sentence(word_count: 5)
        )
      end
    end

    if order.status == 'completed' || order.status == 'closed'
      order.update!(actual_pickup_time: estimated_pickup_time + rand(60).minutes)
    end

    order.activity_logs.create!(
      user: [operator1, operator2, admin].sample,
      action: 'create',
      details: '系统初始化数据'
    )
  end

  puts "已创建 #{PickupOrder.count} 条测试单据"
  puts "  包含商品明细 #{PickupItem.count} 条"
  puts "  包含短少记录 #{ShortageRecord.count} 条"
end

if DailySummary.count == 0
  (15.days.ago.to_date..Date.today).each do |date|
    DailySummary.calculate_for(date)
    puts "已计算 #{date} 的汇总数据"
  end
end

puts "种子数据初始化完成！"
