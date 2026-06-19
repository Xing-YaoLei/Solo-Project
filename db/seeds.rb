p1 = Performance.create!(name: "印象丽江·大型实景演出", description: "以玉龙雪山为背景的大型实景演出", start_time: 7.days.from_now.change(hour: 19, min: 0), end_time: 7.days.from_now.change(hour: 21, min: 0), venue: "丽江玉龙雪山甘海子", total_seats: 300, status: :published)
p2 = Performance.create!(name: "千古情·宋城风情秀", description: "沉浸式宋城风情演出", start_time: 10.days.from_now.change(hour: 20, min: 0), end_time: 10.days.from_now.change(hour: 22, min: 0), venue: "杭州宋城景区大剧院", total_seats: 500, status: :ongoing)
p3 = Performance.create!(name: "又见平遥·情境体验剧", description: "大型情境体验演出", start_time: 15.days.from_now.change(hour: 19, min: 30), end_time: 15.days.from_now.change(hour: 21, min: 30), venue: "平遥古城剧场", total_seats: 200, status: :draft)

tt1a = p1.ticket_types.create!(name: "VIP贵宾席", price: 680, description: "前排贵宾席位，含茶歇", sale_start_time: Time.current, sale_end_time: 6.days.from_now, max_quantity: 50, refund_policy: :partial_refund, status: :active)
tt1b = p1.ticket_types.create!(name: "标准席", price: 280, description: "标准观众席位", sale_start_time: Time.current, sale_end_time: 6.days.from_now, max_quantity: 200, refund_policy: :full_refund, status: :active)
tt2a = p2.ticket_types.create!(name: "至尊席", price: 980, description: "最佳观赏位置", sale_start_time: Time.current, sale_end_time: 9.days.from_now, max_quantity: 30, refund_policy: :no_refund, status: :active)
tt2b = p2.ticket_types.create!(name: "普通席", price: 320, description: "普通观众席位", sale_start_time: Time.current, sale_end_time: 9.days.from_now, max_quantity: 400, refund_policy: :full_refund, status: :active)

sections_p1 = [
  { section: "A区", rows: 5, seats_per_row: 10, price: 680 },
  { section: "B区", rows: 8, seats_per_row: 12, price: 280 },
  { section: "C区", rows: 5, seats_per_row: 10, price: 280 }
]
sections_p1.each do |sec|
  (1..sec[:rows]).each do |row_num|
    (1..sec[:seats_per_row]).each do |seat_num|
      p1.seats.create!(row: row_num.to_s, seat_number: seat_num.to_s, section: sec[:section], price: sec[:price], status: :available)
    end
  end
end

sections_p2 = [
  { section: "VIP区", rows: 3, seats_per_row: 10, price: 980 },
  { section: "甲区", rows: 8, seats_per_row: 15, price: 320 },
  { section: "乙区", rows: 10, seats_per_row: 20, price: 320 }
]
sections_p2.each do |sec|
  (1..sec[:rows]).each do |row_num|
    (1..sec[:seats_per_row]).each do |seat_num|
      p2.seats.create!(row: row_num.to_s, seat_number: seat_num.to_s, section: sec[:section], price: sec[:price], status: :available)
    end
  end
end

(1..15).each do |row_num|
  (1..10).each do |seat_num|
    p3.seats.create!(row: row_num.to_s, seat_number: seat_num.to_s, section: "主区", price: 380, status: :available)
  end
end

5.times do |i|
  order = Order.create!(customer_name: "张#{%w[伟芳磊娜静][i]}", customer_phone: "1380000000#{i + 1}", customer_email: "zhang#{i + 1}@example.com", total_amount: [680, 560, 980, 640, 280][i], payment_method: %i[wechat alipay wechat card wechat][i], status: :paid, paid_at: Time.current)
  performance = [p1, p1, p2, p2, p1][i]
  ticket_type = [tt1a, tt1b, tt2a, tt2b, tt1b][i]
  seat = performance.seats.available.sample
  next unless seat

  seat.update!(status: :occupied)
  ticket = order.tickets.create!(ticket_type: ticket_type, seat: seat, status: :issued)
  ticket.generate_checkin_code!
end

2.times do |i|
  order = Order.create!(customer_name: "李#{%w[明华强][i]}", customer_phone: "1390000000#{i + 1}", total_amount: [280, 320][i], payment_method: :wechat, status: :confirmed, paid_at: 1.day.ago)
  performance = [p1, p2][i]
  ticket_type = [tt1b, tt2b][i]
  seat = performance.seats.available.sample
  next unless seat

  seat.update!(status: :occupied)
  ticket = order.tickets.create!(ticket_type: ticket_type, seat: seat, status: :issued)
  ticket.generate_checkin_code!
  ticket.checkin!
end

sponsor1 = Sponsor.create!(name: "丽江玉水寨旅游集团", contact_person: "王建国", contact_phone: "0888-5123456", contact_email: "wang@yushuizhai.com", status: :active)
sponsor2 = Sponsor.create!(name: "杭州宋城演艺股份", contact_person: "陈晓燕", contact_phone: "0571-87654321", contact_email: "chen@songcheng.com", status: :active)
sponsor3 = Sponsor.create!(name: "山西文旅投资集团", contact_person: "赵志远", contact_phone: "0351-6543210", status: :prospective)

sponsor1.sponsorships.create!(performance: p1, amount: 200000, sponsorship_type: :title_sponsor, benefits: "冠名权+开场前广告3分钟", start_date: Date.current, end_date: 30.days.from_now.to_date, status: :active)
sponsor2.sponsorships.create!(performance: p2, amount: 150000, sponsorship_type: :co_sponsor, benefits: "联合宣传+场内展位", start_date: Date.current, end_date: 30.days.from_now.to_date, status: :active)
sponsor3.sponsorships.create!(performance: p3, amount: 80000, sponsorship_type: :venue_sponsor, benefits: "场地支持+品牌露出", start_date: Date.current, end_date: 60.days.from_now.to_date, status: :pending)

disputed_order = Order.create!(customer_name: "刘争议", customer_phone: "13700009999", total_amount: 980, payment_method: :alipay, status: :refunded, paid_at: 3.days.ago, refunded_at: 1.day.ago)
seat = p2.seats.available.sample
if seat
  seat.update!(status: :occupied)
  ticket = disputed_order.tickets.create!(ticket_type: tt2a, seat: seat, status: :checked_in, checked_in_at: 2.days.ago)
  ticket.generate_checkin_code!
  ticket.checkin_code&.use!
  ExceptionRecord.create!(order: disputed_order, ticket: ticket, exception_type: :refund_dispute, title: "已签到票退票争议-#{disputed_order.order_no}", description: "客户在签到后申请退票，需要审核退款金额", impact_scope: "影响1张已签到VIP票，涉及金额¥980", responsible_person: "前台主管-周明", assignee: "周明", status: :assigned)
end

puts "演示数据创建完成：#{Performance.count}场演出, #{TicketType.count}种票, #{Order.count}个订单, #{Ticket.count}张票, #{Seat.count}个座位, #{Sponsor.count}个赞助商, #{Sponsorship.count}条赞助, #{ExceptionRecord.count}条异常"
