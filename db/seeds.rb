User.find_or_create_by!(email: "admin@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.role = "admin"
end

manager = User.find_or_create_by!(email: "manager@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.role = "manager"
end

staff = User.find_or_create_by!(email: "staff@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.role = "staff"
end

event = Event.find_or_create_by!(name: "2026 科技创新峰会") do |e|
  e.description = "年度科技创新峰会，汇聚行业顶尖专家"
  e.start_time = Time.current.beginning_of_day
  e.end_time = 3.days.from_now.end_of_day
  e.location = "深圳会展中心"
  e.status = "active"
end

vip_ticket = TicketType.find_or_create_by!(event: event, name: "VIP票") do |t|
  t.price = 2999.00
  t.quantity = 50
  t.description = "VIP专属通道，前排座位"
  t.rules = { "transferable" => false, "refund_before_hours" => 48, "check_in_window" => "提前2小时" }
  t.status = "on_sale"
end

standard_ticket = TicketType.find_or_create_by!(event: event, name: "标准票") do |t|
  t.price = 999.00
  t.quantity = 200
  t.description = "标准入场票"
  t.rules = { "transferable" => true, "refund_before_hours" => 24, "check_in_window" => "提前1小时" }
  t.status = "on_sale"
end

early_bird = TicketType.find_or_create_by!(event: event, name: "早鸟票") do |t|
  t.price = 599.00
  t.quantity = 100
  t.description = "限时优惠票"
  t.rules = { "transferable" => true, "refund_before_hours" => 72, "check_in_window" => "提前1小时", "early_check_in" => true }
  t.status = "sold_out"
end

%w[platinum gold silver].each_with_index do |level, i|
  Sponsor.find_or_create_by!(event: event, name: "#{level.humanize}赞助商#{i + 1}") do |s|
    s.level = level
    s.description = "#{level.humanize}级别赞助"
    s.contact_name = "联系人#{i + 1}"
    s.contact_phone = "1380000000#{i + 1}"
    s.contact_email = "sponsor#{i + 1}@example.com"
  end
end

order_data = [
  { buyer: "张三", email: "zhang@example.com", phone: "13900000001", type: vip_ticket, qty: 1, status: "paid" },
  { buyer: "李四", email: "li@example.com", phone: "13900000002", type: standard_ticket, qty: 2, status: "paid" },
  { buyer: "王五", email: "wang@example.com", phone: "13900000003", type: early_bird, qty: 1, status: "paid" },
  { buyer: "赵六", email: "zhao@example.com", phone: "13900000004", type: standard_ticket, qty: 1, status: "checked_in" },
  { buyer: "钱七", email: "qian@example.com", phone: "13900000005", type: vip_ticket, qty: 1, status: "checked_in" },
  { buyer: "孙八", email: "sun@example.com", phone: "13900000006", type: standard_ticket, qty: 3, status: "pending" },
]

order_data.each do |od|
  order = TicketOrder.find_or_create_by!(order_no: "ORD-#{SecureRandom.hex(4).upcase}") do |o|
    o.event = event
    o.ticket_type = od[:type]
    o.user = staff
    o.buyer_name = od[:buyer]
    o.buyer_email = od[:email]
    o.buyer_phone = od[:phone]
    o.quantity = od[:qty]
    o.total_amount = od[:type].price * od[:qty]
    o.status = od[:status]
  end

  if order.status == "checked_in"
    CheckInRecord.find_or_create_by!(ticket_order: order) do |r|
      r.ticket_type = order.ticket_type
      r.event = event
      r.operator = staff
      r.check_in_time = Time.current - rand(1..120).minutes
      r.check_in_method = %w[qr_code manual nfc].sample
    end
  end
end
