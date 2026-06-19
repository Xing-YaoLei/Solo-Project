require "faker"

Faker::Config.locale = "zh-CN"

ReportDownload.delete_all
ConflictAction.delete_all
DocumentChangeLog.delete_all
RoomConflict.delete_all
CleaningTask.delete_all
CheckInDocument.delete_all
MonthlyReport.delete_all
ChannelOrder.delete_all
RoomStatus.delete_all
Guest.delete_all
Property.delete_all
User.delete_all

admin = User.create!(
  name: "张三",
  email: "admin@example.com",
  phone: "13800000001",
  role: "admin"
)

manager = User.create!(
  name: "李四",
  email: "manager@example.com",
  phone: "13800000002",
  role: "manager"
)

cleaner = User.create!(
  name: "王五",
  email: "cleaner@example.com",
  phone: "13800000003",
  role: "cleaner"
)

staff = User.create!(
  name: "赵六",
  email: "staff@example.com",
  phone: "13800000004",
  role: "staff"
)

xihu = Property.create!(
  name: "西湖畔民宿",
  address: "浙江省杭州市西湖区龙井路1号",
  room_count: 10,
  status: "active",
  manager: manager
)

huangshan = Property.create!(
  name: "黄山客栈",
  address: "安徽省黄山市黄山区汤口镇",
  room_count: 8,
  status: "active",
  manager: manager
)

sanya = Property.create!(
  name: "三亚海景公寓",
  address: "海南省三亚市天涯区三亚湾路",
  room_count: 15,
  status: "active",
  manager: manager
)

properties = [xihu, huangshan, sanya]

guests = []
5.times do
  guests << Guest.create!(
    name: Faker::Name.name,
    phone: Faker::PhoneNumber.cell_phone,
    id_number: Faker::IdNumber.valid
  )
end

channels = ChannelOrder::CHANNELS
statuses = %w[pending confirmed checked_in checked_out]
this_month = Date.current.beginning_of_month
last_month = 1.month.ago.beginning_of_month

orders = []
10.times do |i|
  property = properties[i % 3]
  guest = guests[i % 5]
  is_this_month = i.even?
  base_date = is_this_month ? this_month : last_month
  check_in = base_date + rand(1..15).days
  check_out = check_in + rand(1..7).days
  price = Faker::Commerce.price(range: 200..800.0)
  channel = channels[i % channels.size]
  status = statuses[i % statuses.size]

  order = ChannelOrder.create!(
    order_no: "ORD#{Time.current.strftime("%Y%m%d")}#{format("%04d", i + 1)}",
    property: property,
    guest: guest,
    channel: channel,
    check_in: check_in,
    check_out: check_out,
    guest_count: rand(1..4),
    price: price,
    status: status
  )
  orders << order
end

document_id_types = CheckInDocument::ID_TYPES
genders = CheckInDocument::GENDERS

orders[0..3].each do |order|
  CheckInDocument.create!(
    channel_order: order,
    guest: order.guest,
    name: order.guest.name,
    id_type: document_id_types.sample,
    id_number: order.guest.id_number,
    gender: genders.sample,
    nationality: "中国"
  )
end

today = Date.current
week_start = today.beginning_of_week
cleaning_statuses = CleaningTask::STATUSES
priorities = CleaningTask::PRIORITIES

5.times do |i|
  CleaningTask.create!(
    property: properties[i % 3],
    assignee: cleaner,
    task_date: week_start + i.days,
    status: cleaning_statuses[i % cleaning_statuses.size],
    priority: priorities[i % priorities.size],
    note: "房间深度清洁"
  )
end

RoomConflict.create!(
  property: xihu,
  conflict_date: this_month + 10.days,
  status: "open",
  reason: "同一房间存在两个重叠预订订单，系统检测到日期冲突"
)

RoomConflict.create!(
  property: sanya,
  conflict_date: this_month + 15.days,
  status: "acknowledged",
  handler: manager,
  reason: "渠道订单与直接预订房间分配冲突，需要协调"
)

MonthlyReport.generate_for_month!(Date.current)
MonthlyReport.generate_for_month!(1.month.ago)

puts "Example data loaded successfully!"
