puts "开始创建种子数据..."

users = User.create!([
  { name: "管理员", email: "admin@example.com", password: "password123", password_confirmation: "password123", role: :admin, phone: "13800138001", department: "运营部" },
  { name: "张经理", email: "manager@example.com", password: "password123", password_confirmation: "password123", role: :manager, phone: "13800138002", department: "运营部" },
  { name: "李运营", email: "operator@example.com", password: "password123", password_confirmation: "password123", role: :operator, phone: "13800138003", department: "运营部" },
  { name: "王员工", email: "staff@example.com", password: "password123", password_confirmation: "password123", role: :staff, phone: "13800138004", department: "客服部" }
])

puts "创建了 #{users.count} 个用户"

heat_points = HeatPoint.create!([
  { name: "南门入口", zone: "景区南门", heat_level: 5, description: "景区主入口，人流量最大", status: :active, category: "入口", latitude: 39.9042, longitude: 116.4074 },
  { name: "中心广场", zone: "景区中心位置", heat_level: 4, description: "景区核心区域", status: :active, category: "广场", latitude: 39.9052, longitude: 116.4084 },
  { name: "东山观景台", zone: "景区东部山顶", heat_level: 3, description: "热门观景点", status: :active, category: "景点", latitude: 39.9062, longitude: 116.4094 },
  { name: "西湖畔", zone: "景区西侧湖边", heat_level: 2, description: "休闲散步区域", status: :active, category: "景点", latitude: 39.9032, longitude: 116.4064 },
  { name: "北门外围", zone: "景区北门外部", heat_level: 1, description: "人流量较少区域", status: :inactive, category: "外围", latitude: 39.9072, longitude: 116.4104 }
])

puts "创建了 #{heat_points.count} 个热力点位"

guide_contents = GuideContent.create!([
  { title: "景区全景导览", content: "欢迎来到美丽的风景区。本景区占地5000亩，拥有丰富的自然景观和人文景观...", status: :published, category: "全景导览", duration_minutes: 60, order_index: 1 },
  { title: "东山步道介绍", content: "东山步道全长3.5公里，沿途可以欣赏到壮丽的山景和丰富的植被...", status: :published, category: "景点介绍", duration_minutes: 45, order_index: 2 },
  { title: "西湖游船攻略", content: "西湖游船分为电动船和脚踏船两种，营业时间为9:00-17:00...", status: :published, category: "游玩攻略", duration_minutes: 30, order_index: 3 },
  { title: "餐饮指南", content: "景区内有5家餐厅，提供各种特色美食...", status: :draft, category: "服务指南", duration_minutes: 20, order_index: 4 },
  { title: "历史文化介绍", content: "本景区有着悠久的历史文化底蕴...", status: :archived, category: "文化历史", duration_minutes: 40, order_index: 5 }
])

puts "创建了 #{guide_contents.count} 条导览内容"

performances = Performance.create!([
  { name: "山水实景演出", venue: "中心大剧院", start_time: 2.days.from_now, end_time: 2.days.from_now + 2.hours, status: :scheduled, total_seats: 500, description: "大型山水实景演出，不容错过", ticket_price: 299.00 },
  { name: "民俗表演", venue: "民俗广场", start_time: 1.day.from_now, end_time: 1.day.from_now + 1.hour, status: :scheduled, total_seats: 200, description: "传统民俗文化表演", ticket_price: 99.00 },
  { name: "夜间灯光秀", venue: "中心广场", start_time: 3.days.from_now, end_time: 3.days.from_now + 45.minutes, status: :scheduled, total_seats: 1000, description: "绚丽的夜间灯光表演", ticket_price: 0 },
  { name: "非遗展示", venue: "文化展览馆", start_time: Date.tomorrow, end_time: Date.tomorrow + 3.hours, status: :ongoing, total_seats: 100, description: "非物质文化遗产展示", ticket_price: 50.00 }
])

puts "创建了 #{performances.count} 场演出"

sections = ["A区", "B区", "C区"]
rows = (1..5).to_a
seats_per_row = 5

performances.first(2).each do |perf|
  sections.each do |section|
    rows.each do |row|
      (1..seats_per_row).each do |seat_num|
        price = case section
                when "A区" then 29900
                when "B区" then 19900
                else 9900
                end

        perf.performance_seats.create!(
          section: section,
          row_number: row.to_s,
          seat_number: "#{section}#{row}排#{seat_num}号",
          price_cents: price,
          status: :available
        )
      end
    end
  end
end

puts "创建了演出座位"

merchant_contracts = MerchantContract.create!([
  { merchant_name: "山水餐厅", contract_number: "HT2024001", category: "餐饮合作", start_date: Date.today.beginning_of_year, end_date: Date.today.end_of_year, commission_rate: 15.0, status: :active, contact_person: "陈老板", contact_phone: "13900139001", shop_location: "中心广场东侧" },
  { merchant_name: "纪念品商店", contract_number: "HT2024002", category: "零售合作", start_date: Date.today.beginning_of_year, end_date: Date.today.end_of_year, commission_rate: 20.0, status: :active, contact_person: "刘经理", contact_phone: "13900139002", shop_location: "南门入口处" },
  { merchant_name: "游船公司", contract_number: "HT2024003", category: "游乐项目", start_date: Date.today.beginning_of_year, end_date: Date.today.end_of_year, commission_rate: 25.0, status: :active, contact_person: "赵总", contact_phone: "13900139003", shop_location: "西湖码头" },
  { merchant_name: "摄影服务", contract_number: "HT2024004", category: "服务合作", start_date: 6.months.ago.to_date, end_date: 6.months.from_now.to_date, commission_rate: 30.0, status: :active, contact_person: "孙师傅", contact_phone: "13900139004", shop_location: "东山观景台" },
  { merchant_name: "老茶馆", contract_number: "HT2024005", category: "餐饮合作", start_date: 1.year.ago.to_date, end_date: 1.month.ago.to_date, commission_rate: 10.0, status: :expired, contact_person: "周老板", contact_phone: "13900139005", shop_location: "北街" }
])

puts "创建了 #{merchant_contracts.count} 份商户合同"

secondary_consumptions = []
30.times do |i|
  contract = merchant_contracts.sample
  amount = rand(50..500) * 100
  source = %w[online offline guide recommendation].sample
  customer_count = rand(1..5)

  secondary_consumptions << SecondaryConsumption.create!(
    merchant_contract: contract,
    amount_cents: amount,
    source: source,
    transaction_time: rand(1..30).days.ago,
    customer_count: customer_count,
    transaction_no: "TXN#{format('%06d', i + 1)}",
    payment_method: %w[wechat alipay cash card].sample
  )
end

puts "创建了 #{secondary_consumptions.count} 条二消记录"

operator = User.find_by(role: :operator)
manager = User.find_by(role: :manager)

todos = Todo.create!([
  { title: "检查南门入口热力设备", description: "定期检查南门入口的热力检测设备，确保正常运行", assignee: operator, creator: manager, priority: :high, due_date: 2.days.from_now.to_date, status: :pending },
  { title: "更新导览内容", description: "根据最新景区信息更新导览内容", assignee: operator, creator: manager, priority: :normal, due_date: 5.days.from_now.to_date, status: :in_progress },
  { title: "演出座位检查", description: "检查本周演出座位状态，确保票务正常", assignee: operator, creator: manager, priority: :urgent, due_date: 1.day.from_now.to_date, status: :pending },
  { title: "商户合同续签", description: "与即将到期的商户联系续签事宜", assignee: manager, creator: User.first, priority: :high, due_date: 1.week.from_now.to_date, status: :pending },
  { title: "二消数据统计分析", description: "统计上月二消数据并生成分析报告", assignee: manager, creator: User.first, priority: :normal, due_date: 3.days.ago.to_date, status: :completed }
])

puts "创建了 #{todos.count} 条待办事项"

heat_points.each_with_index do |hp, i|
  ProcessingRecord.create!(
    recordable: hp,
    handler: i.even? ? operator : manager,
    action_type: "日常巡检",
    status: :completed,
    notes: "设备运行正常，温度正常"
  )
end

guide_contents.each_with_index do |gc, i|
  ProcessingRecord.create!(
    recordable: gc,
    handler: operator,
    action_type: "内容审核",
    status: :completed,
    notes: "内容审核通过，符合发布标准"
  )
end

puts "创建了处理记录"

puts "种子数据创建完成！"
puts "登录账号：admin@example.com / password123"
