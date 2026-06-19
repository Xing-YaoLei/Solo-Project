User.find_or_create_by!(email: "admin@example.com") do |user|
  user.name = "张经理"
  user.role = "manager"
  user.password = "password123"
  user.password_confirmation = "password123"
end

User.find_or_create_by!(email: "staff@example.com") do |user|
  user.name = "李前台"
  user.role = "staff"
  user.password = "password123"
  user.password_confirmation = "password123"
end

User.find_or_create_by!(email: "staff2@example.com") do |user|
  user.name = "王客服"
  user.role = "staff"
  user.password = "password123"
  user.password_confirmation = "password123"
end

manager = User.find_by(email: "admin@example.com")
staff1 = User.find_by(email: "staff@example.com")
staff2 = User.find_by(email: "staff2@example.com")

channels = [
  { name: "携程", code: "CTRIP", commission_rate: 15.0 },
  { name: "美团民宿", code: "MEITUAN", commission_rate: 12.0 },
  { name: "飞猪", code: "FLIGGY", commission_rate: 10.0 },
  { name: "自有渠道", code: "DIRECT", commission_rate: 0.0 }
]

channels.each do |ch|
  Channel.find_or_create_by!(code: ch[:code]) do |channel|
    channel.name = ch[:name]
    channel.commission_rate = ch[:commission_rate]
    channel.status = "active"
  end
end

ctrip = Channel.find_by(code: "CTRIP")
meituan = Channel.find_by(code: "MEITUAN")
fliggy = Channel.find_by(code: "FLIGGY")
direct = Channel.find_by(code: "DIRECT")

packages = [
  { name: "山景大床房套餐",
    description: "含双早 + 山景大床房一晚 + 下午茶一份\n适合情侣度假、休闲出行",
    base_price: 599.0,
    total_inventory: 50,
    available_inventory: 50,
    status: "active" },
  { name: "海景双床房套餐",
    description: "含双早 + 海景双床房一晚 + 海鲜晚餐一份\n家庭出游首选",
    base_price: 899.0,
    total_inventory: 30,
    available_inventory: 30,
    status: "active" },
  { name: "豪华套房套餐",
    description: "含双早 + 豪华套房一晚 + SPA体验 + 接送机服务\n高端商务出行",
    base_price: 1599.0,
    total_inventory: 10,
    available_inventory: 10,
    status: "active" },
  { name: "家庭亲子套餐",
    description: "含三早 + 家庭房一晚 + 亲子活动 + 儿童乐园\n家庭出游首选",
    base_price: 799.0,
    total_inventory: 20,
    available_inventory: 20,
    status: "active" },
  { name: "周末特惠套餐",
    description: "仅限周末使用 + 双早 + 标准房一晚\n限时特惠",
    base_price: 399.0,
    total_inventory: 100,
    available_inventory: 100,
    status: "active" }
]

packages.each do |pkg|
  Package.find_or_create_by!(name: pkg[:name]) do |package|
    package.description = pkg[:description]
    package.base_price = pkg[:base_price]
    package.total_inventory = pkg[:total_inventory]
    package.available_inventory = pkg[:available_inventory]
    package.status = pkg[:status]
  end
end

mountain_package = Package.find_by(name: "山景大床房套餐")
sea_package = Package.find_by(name: "海景双床房套餐")
luxury_package = Package.find_by(name: "豪华套房套餐")
family_package = Package.find_by(name: "家庭亲子套餐")
weekend_package = Package.find_by(name: "周末特惠套餐")

price_rules = [
  { package: mountain_package, channel: ctrip, name: "携程专享价", rule_type: "percentage_discount", value: 10.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 1 },
  { package: mountain_package, channel: meituan, name: "美团新用户优惠", rule_type: "fixed_discount", value: 50.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 1 },
  { package: sea_package, channel: ctrip, name: "携程海景房折扣", rule_type: "percentage_discount", value: 15.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 1 },
  { package: sea_package, channel: fliggy, name: "飞猪会员价", rule_type: "fixed_price", value: 799.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 1 },
  { package: luxury_package, channel: direct, name: "官网特惠", rule_type: "fixed_discount", value: 100.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 1 },
  { package: family_package, channel: meituan, name: "美团亲子节特惠", rule_type: "percentage_discount", value: 20.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 1 },
  { package: weekend_package, channel: nil, name: "周末早鸟价", rule_type: "percentage_discount", value: 20.0, start_date: 30.days.ago.to_date, end_date: 30.days.from_now.to_date, min_quantity: 2 }
]

price_rules.each do |pr|
  PriceRule.find_or_create_by!(name: pr[:name], package: pr[:package]) do |rule|
    rule.channel = pr[:channel]
    rule.rule_type = pr[:rule_type]
    rule.value = pr[:value]
    rule.start_date = pr[:start_date]
    rule.end_date = pr[:end_date]
    rule.min_quantity = pr[:min_quantity]
    rule.status = "active"
  end
end

customers = [
  { name: "张伟", phone: "13800138001", email: "zhangwei@example.com" },
  { name: "李娜", phone: "13800138002", email: "lina@example.com" },
  { name: "王强", phone: "13800138003", email: "wangqiang@example.com" },
  { name: "刘芳", phone: "13800138004", email: "liufang@example.com" },
  { name: "陈明", phone: "13800138005", email: "chenming@example.com" },
  { name: "赵丽", phone: "13800138006", email: "zhaoli@example.com" },
  { name: "孙杰", phone: "13800138007", email: "sunjie@example.com" },
  { name: "周敏", phone: "13800138008", email: "zhoumin@example.com" }
]

orders_data = [
  { package: mountain_package, channel: ctrip, customer: customers[0], staff: staff1, quantity: 2, status: :confirmed, check_in: 2.days.from_now.to_date, check_out: 4.days.from_now.to_date, days_ago: 5 },
  { package: sea_package, channel: meituan, customer: customers[1], staff: staff1, quantity: 1, status: :confirmed, check_in: 1.day.from_now.to_date, check_out: 3.days.from_now.to_date, days_ago: 3 },
  { package: luxury_package, channel: direct, customer: customers[2], staff: staff2, quantity: 1, status: :pending, check_in: 5.days.from_now.to_date, check_out: 7.days.from_now.to_date, days_ago: 1 },
  { package: family_package, channel: fliggy, customer: customers[3], staff: staff1, quantity: 3, status: :confirmed, check_in: Date.tomorrow, check_out: 3.days.from_now.to_date, days_ago: 7 },
  { package: weekend_package, channel: ctrip, customer: customers[4], staff: staff2, quantity: 2, status: :completed, check_in: 10.days.ago.to_date, check_out: 8.days.ago.to_date, days_ago: 12 },
  { package: mountain_package, channel: meituan, customer: customers[5], staff: staff1, quantity: 1, status: :checked_in, check_in: Date.today, check_out: 2.days.from_now.to_date, days_ago: 4 },
  { package: sea_package, channel: ctrip, customer: customers[6], staff: staff2, quantity: 2, status: :confirmed, check_in: 3.days.from_now.to_date, check_out: 5.days.from_now.to_date, days_ago: 2 },
  { package: weekend_package, channel: direct, customer: customers[7], staff: staff1, quantity: 4, status: :cancelled, check_in: 7.days.ago.to_date, check_out: 5.days.ago.to_date, days_ago: 10 }
]

orders_data.each_with_index do |data, index|
  order_number = "ORD#{Date.today.strftime('%Y%m%d')}#{sprintf('%04d', index + 1)}"
  order = Order.new(
    order_number: order_number,
    package: data[:package],
    channel: data[:channel],
    customer_name: data[:customer][:name],
    customer_phone: data[:customer][:phone],
    customer_email: data[:customer][:email],
    quantity: data[:quantity],
    unit_price: data[:package].base_price,
    total_amount: data[:package].base_price * data[:quantity],
    channel_price: data[:package].base_price * (1 - data[:channel].commission_rate / 100),
    check_in_date: data[:check_in],
    check_out_date: data[:check_out],
    staff: data[:staff],
    status: data[:status],
    external_order_id: "EXT#{Time.now.to_i + index}",
    created_at: data[:days_ago].days.ago,
    confirmed_at: data[:status] != :pending ? data[:days_ago].days.ago + 1.hour : nil,
    cancelled_at: data[:status] == :cancelled ? data[:days_ago].days.ago + 2.hours : nil
  )
  order.save!(validate: false)

  if data[:status] == :confirmed || data[:status] == :checked_in || data[:status] == :completed
    data[:package].decrement!(:available_inventory, data[:quantity])
    data[:package].increment!(:sold_count, data[:quantity])
  end

  if data[:status] == :checked_in || data[:status] == :completed
    CheckInRecord.create!(
      order: order,
      staff: data[:staff],
      actual_check_in_at: data[:check_in].in_time_zone + 14.hours,
      actual_check_out_at: data[:status] == :completed ? data[:check_out].in_time_zone + 12.hours : nil,
      guest_count: data[:quantity] * 2,
      notes: "正常入住"
    )
  end

  if data[:status] == :confirmed || data[:status] == :checked_in || data[:status] == :completed
    redemption = RedemptionRecord.create!(
      order: order,
      staff: data[:status] == :completed ? data[:staff] : nil,
      status: data[:status] == :completed ? :redeemed : :pending,
      redeemed_at: data[:status] == :completed ? data[:check_in].in_time_zone + 15.hours : nil,
      notes: data[:status] == :completed ? "已核销使用" : nil
    )
  end
end

oversold_order = Order.create!(
  package: luxury_package,
  channel: ctrip,
  customer_name: "超卖测试客户",
  customer_phone: "13900139000",
  quantity: 5,
  unit_price: luxury_package.base_price,
  total_amount: luxury_package.base_price * 5,
  channel_price: luxury_package.base_price * (1 - ctrip.commission_rate / 100),
  check_in_date: 5.days.from_now.to_date,
  check_out_date: 7.days.from_now.to_date,
  staff: staff1,
  status: :confirmed,
  is_oversold: true,
  external_order_id: "OVERSOLD001",
  confirmed_at: 1.day.ago
)

OversellCommunication.create!(
  order: oversold_order,
  user: staff1,
  direction: :internal,
  communication_type: :note,
  content: "系统检测到此订单存在超卖风险，豪华套房套餐库存不足，请尽快联系客户处理"
)

OversellCommunication.create!(
  order: oversold_order,
  user: staff1,
  direction: :outgoing,
  communication_type: :phone,
  content: "已联系客户张先生，告知豪华套房已售罄情况，客户表示可以接受升级到家庭亲子套餐或退款处理"
)

OversellReview.create!(
  order: oversold_order,
  reviewer: manager,
  review_opinion: "建议为客户升级至家庭亲子套餐，并赠送早餐和SPA体验券作为补偿。",
  resolution: :upgrade,
  reviewed_at: Time.current
)

puts "种子数据创建完成！"
puts "管理员账号: admin@example.com / password123"
puts "一线人员账号: staff@example.com / password123"
puts "一线人员账号: staff2@example.com / password123"
