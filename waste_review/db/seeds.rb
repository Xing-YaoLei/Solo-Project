stores_data = [
  { name: "朝阳区旗舰店", code: "CY-001", region: "朝阳区", monthly_purchase: 150000.0 },
  { name: "海淀区中关村店", code: "HD-001", region: "海淀区", monthly_purchase: 120000.0 },
  { name: "西城区金融街店", code: "XC-001", region: "西城区", monthly_purchase: 130000.0 },
  { name: "东城区王府井店", code: "DC-001", region: "东城区", monthly_purchase: 140000.0 },
  { name: "丰台区总部店", code: "FT-001", region: "丰台区", monthly_purchase: 100000.0 },
  { name: "通州区万达店", code: "TZ-001", region: "通州区", monthly_purchase: 90000.0 },
  { name: "昌平区回龙观店", code: "CP-001", region: "昌平区", monthly_purchase: 85000.0 }
]

stores = stores_data.map { |data| Store.find_or_create_by!(code: data[:code]) { |s| s.assign_attributes(data) } }

statuses = %w[submitted reviewing approved rejected settled]
reporters = %w[张伟 李娜 王强 赵敏 陈晓 刘洋 周丹]
products = [
  { name: "拿铁咖啡豆", sku: "LAT-001", unit: "kg", unit_cost: 120.00, category: "咖啡豆" },
  { name: "全脂牛奶", sku: "MLK-001", unit: "升", unit_cost: 15.00, category: "奶制品" },
  { name: "抹茶粉", sku: "MAT-001", unit: "kg", unit_cost: 280.00, category: "食品" },
  { name: "一次性纸杯", sku: "CUP-001", unit: "个", unit_cost: 0.35, category: "包装材料" },
  { name: "焦糖糖浆", sku: "SYR-001", unit: "瓶", unit_cost: 45.00, category: "糖浆" },
  { name: "美式咖啡豆", sku: "AME-001", unit: "kg", unit_cost: 95.00, category: "咖啡豆" },
  { name: "椰浆", sku: "COC-001", unit: "罐", unit_cost: 22.00, category: "奶制品" },
  { name: "吸管", sku: "STR-001", unit: "包", unit_cost: 8.50, category: "包装材料" },
  { name: "香草糖浆", sku: "SYR-002", unit: "瓶", unit_cost: 42.00, category: "糖浆" },
  { name: "燕麦奶", sku: "MLK-002", unit: "升", unit_cost: 25.00, category: "奶制品" },
  { name: "可可粉", sku: "COC-002", unit: "kg", unit_cost: 180.00, category: "食品" },
  { name: "杯盖", sku: "CUP-002", unit: "个", unit_cost: 0.25, category: "包装材料" }
]
reasons = WasteItem::WASTE_REASONS

waste_reports = []

20.times do |i|
  store = stores[i % stores.size]
  report = WasteReport.create!(
    store: store,
    report_date: (Date.current - i.days),
    status: :submitted,
    total_cost: 0,
    reporter: reporters[i % reporters.size],
    notes: i.even? ? "常规损耗" : "需重点关注"
  )

  item_count = rand(2..5)
  item_count.times do |j|
    product = products[(i + j) % products.size]
    quantity = rand(1..30)
    report.waste_items.create!(
      product_name: product[:name],
      product_sku: product[:sku],
      quantity: quantity,
      unit: product[:unit],
      unit_cost: product[:unit_cost],
      waste_reason: reasons[(i + j) % reasons.size],
      category: product[:category]
    )
  end

  report.recalculate_totals!

  target_status = statuses[i % statuses.size]
  case target_status
  when 'reviewing'
    report.transition_to!(:reviewing, '系统初始化', '批量导入数据')
  when 'approved'
    report.transition_to!(:reviewing, '系统初始化', '批量导入数据')
    report.transition_to!(:approved, '区域经理', '复核通过')
  when 'rejected'
    report.transition_to!(:reviewing, '系统初始化', '批量导入数据')
    report.transition_to!(:rejected, '区域经理', '复核驳回，需补充说明')
  when 'settled'
    report.transition_to!(:reviewing, '系统初始化', '批量导入数据')
    report.transition_to!(:approved, '区域经理', '复核通过')
    report.transition_to!(:settled, '财务系统', '月度结算完成')
  end

  waste_reports << report
end

waste_reports.each do |report|
  if report.waste_rate > 5
    AbnormalReport.generate_from_waste_report(report)
  end
end

waste_reports.first(8).each do |report|
  report.review_opinions.create!(
    reviewer: %w[刘经理 周主管 孙总监 李副总][waste_reports.index(report) % 4],
    opinion: %w[已核实，同意报损 情况属实，予以通过 损耗合理 需加强管理 建议优化流程][waste_reports.index(report) % 5],
    result: %w[approved approved approved rejected approved][waste_reports.index(report) % 5]
  )
end

settled_reports = waste_reports.select { |r| r.status == "settled" }
settled_reports.each do |report|
  report.waste_items.group(:product_name).sum(:subtotal).each do |product_name, amount|
    CostEntry.find_or_create_by!(
      waste_report: report,
      note: product_name
    ) do |ce|
      ce.responsible_store = report.store
      ce.amount = amount
      ce.cost_type = :material
    end
  end
end

puts "🌱 Seed data created successfully!"
puts "Stores: #{Store.count}"
puts "Waste Reports: #{WasteReport.count}"
puts "Waste Items: #{WasteItem.count}"
puts "Abnormal Reports: #{AbnormalReport.count}"
puts "Review Opinions: #{ReviewOpinion.count}"
puts "Cost Entries: #{CostEntry.count}"
puts "Status Logs: #{StatusLog.count}"
puts ""
puts "Overall waste rate: #{WasteReport.overall_waste_rate}%"
puts "Abnormal resolution rate: #{AbnormalReport.resolution_rate}%"
