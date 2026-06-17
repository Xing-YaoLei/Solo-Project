Tenant.find_or_create_by!(name: "星河科技") do |t|
  t.contact_person = "张伟"
  t.contact_phone = "13800001111"
  t.email = "zhangwei@xinghe.com"
  t.address = "A栋12层"
  t.remark = "重点租户"
end

Tenant.find_or_create_by!(name: "蓝天贸易") do |t|
  t.contact_person = "李娜"
  t.contact_phone = "13800002222"
  t.email = "lina@lantian.com"
  t.address = "B栋5层"
  t.remark = ""
end

Tenant.find_or_create_by!(name: "绿洲传媒") do |t|
  t.contact_person = "王磊"
  t.contact_phone = "13800003333"
  t.email = "wanglei@lvzhou.com"
  t.address = "C栋8层"
  t.remark = ""
end

spots_data = [
  { spot_number: "A-001", zone: "A区", spot_type: "regular", occupied: true, floor: "B1", monthly_rate: 800 },
  { spot_number: "A-002", zone: "A区", spot_type: "reserved", occupied: true, floor: "B1", monthly_rate: 1200 },
  { spot_number: "A-003", zone: "A区", spot_type: "regular", occupied: false, floor: "B1", monthly_rate: 800 },
  { spot_number: "A-004", zone: "A区", spot_type: "ev", occupied: true, floor: "B1", monthly_rate: 1000 },
  { spot_number: "B-001", zone: "B区", spot_type: "regular", occupied: false, floor: "B2", monthly_rate: 800 },
  { spot_number: "B-002", zone: "B区", spot_type: "disabled", occupied: false, floor: "B2", monthly_rate: 600 },
  { spot_number: "B-003", zone: "B区", spot_type: "regular", occupied: true, floor: "B2", monthly_rate: 800 },
  { spot_number: "B-004", zone: "B区", spot_type: "ev", occupied: false, floor: "B2", monthly_rate: 1000 },
  { spot_number: "C-001", zone: "C区", spot_type: "regular", occupied: true, floor: "B1", monthly_rate: 800 },
  { spot_number: "C-002", zone: "C区", spot_type: "reserved", occupied: false, floor: "B1", monthly_rate: 1200 }
]

spots = spots_data.map { |data| ParkingSpot.find_or_create_by!(spot_number: data[:spot_number]) { |s| s.assign_attributes(data) } }

tenants = Tenant.all.to_a

TenantContract.find_or_create_by!(contract_number: "TC-2025-001") do |c|
  c.tenant = tenants[0]
  c.parking_spot = spots[0]
  c.start_date = Date.new(2025, 1, 1)
  c.end_date = Date.new(2026, 12, 31)
  c.rent_amount = 9600
  c.status = "active"
  c.terms = "年度租赁合同"
end

TenantContract.find_or_create_by!(contract_number: "TC-2025-002") do |c|
  c.tenant = tenants[1]
  c.parking_spot = spots[1]
  c.start_date = Date.new(2025, 3, 1)
  c.end_date = Date.new(2026, 2, 28)
  c.rent_amount = 14400
  c.status = "active"
  c.terms = "预留车位合同"
end

TenantContract.find_or_create_by!(contract_number: "TC-2025-003") do |c|
  c.tenant = tenants[2]
  c.parking_spot = spots[3]
  c.start_date = Date.new(2025, 6, 1)
  c.end_date = Date.new(2026, 5, 31)
  c.rent_amount = 12000
  c.status = "active"
  c.terms = "充电桩车位合同"
end

now = Time.current
today = Date.current

plates = %w[京A12345 京B67890 京C11111 京D22222 沪E33333 粤F44444]

6.times do |i|
  access_time = now - (i * 2).hours
  AccessRecord.find_or_create_by!(
    plate_number: plates[i],
    accessed_at: access_time,
    direction: i.even? ? "in" : "out"
  ) do |r|
    r.access_type = "vehicle"
    r.parking_spot = spots[i % spots.size]
    r.gate_name = ["东门", "西门", "南门", "北门"][i % 4]
  end
end

6.times do |i|
  spot = spots[i]
  check_in = now - (i + 1).hours
  check_out = i < 4 ? now - i.hours : nil
  bill = ParkingBill.find_or_create_by!(
    plate_number: plates[i],
    check_in_at: check_in
  ) do |b|
    b.parking_spot = spot
    b.bill_type = %w[hourly monthly temporary daily][i % 4]
    b.amount = [15, 800, 25, 40][i % 4]
    b.status = i < 3 ? "paid" : (i < 5 ? "unpaid" : "overdue")
    b.check_out_at = check_out
    b.paid_at = i < 3 ? now - i.hours : nil
    b.payment_method = i < 3 ? "online" : nil
  end
end

route = InspectionRoute.find_or_create_by!(name: "A区日常巡检") do |r|
  r.inspector_name = "陈巡检"
  r.scheduled_at = today.beginning_of_day + 8.hours
  r.status = "in_progress"
  r.notes = "日常巡检"
end

%w[A区入口 A区电梯厅 A区车库入口 A区消防通道 A区配电间].each_with_index do |location, idx|
  InspectionCheckpoint.find_or_create_by!(
    inspection_route: route,
    checkpoint_order: idx + 1
  ) do |cp|
    cp.location = location
    cp.status = idx < 2 ? "checked" : "pending"
    cp.checked_at = idx < 2 ? now - (3 - idx).hours : nil
  end
end

route2 = InspectionRoute.find_or_create_by!(name: "B区安全巡检") do |r|
  r.inspector_name = "刘巡检"
  r.scheduled_at = today.beginning_of_day + 14.hours
  r.status = "pending"
end

%w[B区入口 B区电梯厅 B区车库入口 B区消防通道].each_with_index do |location, idx|
  InspectionCheckpoint.find_or_create_by!(
    inspection_route: route2,
    checkpoint_order: idx + 1
  ) do |cp|
    cp.location = location
    cp.status = "pending"
  end
end

downtime = EquipmentDowntime.find_or_create_by!(
  equipment_name: "东门道闸摄像头",
  started_at: now - 3.hours
) do |d|
  d.equipment_type = "barrier_camera"
  d.reason = "网络连接中断"
  d.description = "东门入口道闸摄像头无法连接服务器，疑似网线故障"
  d.status = "active"
end

DowntimeAction.find_or_create_by!(
  equipment_downtime: downtime,
  performed_at: now - 2.hours
) do |a|
  a.action_description = "现场检查网线连接状态"
  a.performed_by = "赵维修"
end

DowntimeAction.find_or_create_by!(
  equipment_downtime: downtime,
  performed_at: now - 1.hour
) do |a|
  a.action_description = "已联系网络供应商排查线路"
  a.performed_by = "赵维修"
end

downtime2 = EquipmentDowntime.find_or_create_by!(
  equipment_name: "B2缴费终端",
  started_at: now - 24.hours
) do |d|
  d.equipment_type = "payment_terminal"
  d.reason = "支付模块故障"
  d.description = "B2层缴费终端无法完成支付操作"
  d.status = "resolved"
  d.resolved_by = "钱工程师"
  d.action_taken = "更换支付模块主板，重新配置参数"
  d.closed_at = now - 4.hours
end

%w[security_manager property_manager].each do |role|
  Notification.find_or_create_by!(
    recipient_role: role,
    title: "设备停机通知: 东门道闸摄像头",
    created_at: now - 3.hours
  ) do |n|
    n.message = "东门道闸摄像头(barrier_camera) 已于 #{(now - 3.hours).strftime('%Y-%m-%d %H:%M')} 停机。原因: 网络连接中断"
    n.channel = role == "security_manager" ? "sms" : "in_app"
    n.notifiable = downtime
  end
end
