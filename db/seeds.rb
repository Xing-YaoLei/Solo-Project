Area.find_or_create_by!(code: "SP") do |a| a.name = "运动康复区" end
Area.find_or_create_by!(code: "NR") do |a| a.name = "神经康复区" end
Area.find_or_create_by!(code: "CP") do |a| a.name = "心肺康复区" end

areas = Area.all.to_a

admin = User.find_or_create_by!(email: "admin@rehab.com") do |u|
  u.name = "系统管理员"
  u.role = :admin
  u.area = areas.first
end

therapists = [
  { name: "张治疗师", email: "zhang@rehab.com", area: areas[0] },
  { name: "李治疗师", email: "li@rehab.com", area: areas[1] },
  { name: "王治疗师", email: "wang@rehab.com", area: areas[2] }
].map do |attrs|
  User.find_or_create_by!(email: attrs[:email]) do |u|
    u.name = attrs[:name]
    u.role = :therapist
    u.area = attrs[:area]
  end
end

finance_users = [
  { name: "赵财务", email: "zhao@rehab.com" },
  { name: "钱财务", email: "qian@rehab.com" }
].map do |attrs|
  User.find_or_create_by!(email: attrs[:email]) do |u|
    u.name = attrs[:name]
    u.role = :finance
    u.area = areas.first
  end
end

patients = [
  { name: "陈患者", medical_record_no: "P001", area: areas[0] },
  { name: "林患者", medical_record_no: "P002", area: areas[0] },
  { name: "黄患者", medical_record_no: "P003", area: areas[1] },
  { name: "周患者", medical_record_no: "P004", area: areas[1] },
  { name: "吴患者", medical_record_no: "P005", area: areas[2] }
].map do |attrs|
  Patient.find_or_create_by!(medical_record_no: attrs[:medical_record_no]) do |p|
    p.name = attrs[:name]
    p.area = attrs[:area]
    p.birth_date = 50.years.ago
  end
end

fim_scale = AssessmentScale.find_or_create_by!(name: "FIM") do |s|
  s.category = "功能独立性"
  s.version = "1.0"
  s.active = true
  s.scoring_config = {
    "grades" => [
      { "label" => "完全独立", "min" => 126, "max" => 126 },
      { "label" => "基本独立", "min" => 108, "max" => 125 },
      { "label" => "轻度依赖", "min" => 90, "max" => 107 },
      { "label" => "中度依赖", "min" => 72, "max" => 89 },
      { "label" => "重度依赖", "min" => 36, "max" => 71 },
      { "label" => "极重度依赖", "min" => 18, "max" => 35 }
    ]
  }
end

fim_items_data = [
  { name: "进食", category: "自理", sort_order: 1 },
  { name: "梳洗", category: "自理", sort_order: 2 },
  { name: "穿衣", category: "自理", sort_order: 3 },
  { name: "如厕", category: "自理", sort_order: 4 },
  { name: "转移", category: "运动", sort_order: 5 },
  { name: "行走", category: "运动", sort_order: 6 }
]
fim_items_data.each do |item_attrs|
  ScaleItem.find_or_create_by!(scale: fim_scale, name: item_attrs[:name]) do |si|
    si.category = item_attrs[:category]
    si.weight = 1.0
    si.sort_order = item_attrs[:sort_order]
    si.scoring_rule = { "min" => 1, "max" => 7 }
  end
end

barthel_scale = AssessmentScale.find_or_create_by!(name: "Barthel指数") do |s|
  s.category = "日常生活活动"
  s.version = "1.0"
  s.active = true
  s.scoring_config = {
    "grades" => [
      { "label" => "完全独立", "min" => 100, "max" => 100 },
      { "label" => "轻度依赖", "min" => 61, "max" => 99 },
      { "label" => "中度依赖", "min" => 41, "max" => 60 },
      { "label" => "重度依赖", "min" => 21, "max" => 40 },
      { "label" => "完全依赖", "min" => 0, "max" => 20 }
    ]
  }
end

barthel_items_data = [
  { name: "进食", category: "日常", sort_order: 1 },
  { name: "洗澡", category: "日常", sort_order: 2 },
  { name: "修饰", category: "日常", sort_order: 3 },
  { name: "穿衣", category: "日常", sort_order: 4 },
  { name: "如厕", category: "日常", sort_order: 5 }
]
barthel_items_data.each do |item_attrs|
  ScaleItem.find_or_create_by!(scale: barthel_scale, name: item_attrs[:name]) do |si|
    si.category = item_attrs[:category]
    si.weight = 1.0
    si.sort_order = item_attrs[:sort_order]
    si.scoring_rule = { "min" => 0, "max" => 10 }
  end
end

rule1 = PrescriptionRule.find_or_create_by!(name: "轻度依赖-常规训练") do |r|
  r.trigger_condition = "grade=轻度依赖"
  r.training_plan = [{ "exercise" => "关节活动度训练", "sets" => 3, "reps" => 10, "duration" => 30, "frequency" => "daily" }]
  r.active = true
end

rule2 = PrescriptionRule.find_or_create_by!(name: "中度依赖-强化训练") do |r|
  r.trigger_condition = "grade=中度依赖"
  r.training_plan = [{ "exercise" => "肌力强化训练", "sets" => 4, "reps" => 12, "duration" => 45, "frequency" => "daily" }]
  r.active = true
end

rule3 = PrescriptionRule.find_or_create_by!(name: "重度依赖-基础训练") do |r|
  r.trigger_condition = "grade=重度依赖"
  r.training_plan = [{ "exercise" => "被动关节活动", "sets" => 2, "reps" => 8, "duration" => 20, "frequency" => "weekly" }]
  r.active = true
end

equipments = [
  { name: "跑步机A", code: "EQ001", category: "有氧", area: areas[0], status: :normal },
  { name: "功率自行车B", code: "EQ002", category: "有氧", area: areas[0], status: :maintenance },
  { name: "平衡训练仪C", code: "EQ003", category: "平衡", area: areas[1], status: :normal },
  { name: "步态分析系统D", code: "EQ004", category: "评估", area: areas[1], status: :retired },
  { name: "心肺运动测试仪E", code: "EQ005", category: "测试", area: areas[2], status: :normal }
].map do |attrs|
  Equipment.find_or_create_by!(code: attrs[:code]) do |e|
    e.name = attrs[:name]
    e.category = attrs[:category]
    e.area = attrs[:area]
    e.status = attrs[:status]
    e.last_maintenance_date = 2.weeks.ago
  end
end

scales = [fim_scale, barthel_scale]
records_data = [
  { patient: patients[0], scale: scales[0], assessor: therapists[0], score: 95, grade: "轻度依赖", status: :completed, days_ago: 1 },
  { patient: patients[1], scale: scales[0], assessor: therapists[0], score: 78, grade: "中度依赖", status: :completed, days_ago: 3 },
  { patient: patients[2], scale: scales[1], assessor: therapists[1], score: 55, grade: "中度依赖", status: :completed, days_ago: 5 },
  { patient: patients[3], scale: scales[0], assessor: therapists[1], score: 42, grade: "重度依赖", status: :completed, days_ago: 7 },
  { patient: patients[4], scale: scales[1], assessor: therapists[2], score: 88, grade: "轻度依赖", status: :completed, days_ago: 10 },
  { patient: patients[0], scale: scales[1], assessor: therapists[0], score: nil, grade: nil, status: :draft, days_ago: 0 }
]

assessment_records = records_data.map do |rd|
  item_scores = {}
  if rd[:score]
    rd[:scale].scale_items.each_with_index do |item, i|
      item_scores[item.id.to_s] = (rd[:score].to_f / rd[:scale].scale_items.count).round
    end
  end

  AssessmentRecord.find_or_create_by!(
    patient: rd[:patient],
    scale: rd[:scale],
    assessed_at: rd[:days_ago].days.ago.to_date
  ) do |ar|
    ar.assessor = rd[:assessor]
    ar.total_score = rd[:score]
    ar.grade = rd[:grade]
    ar.item_scores = item_scores
    ar.status = rd[:status]
  end
end

rules = [rule1, rule2, rule3]
prescriptions_data = [
  { record: assessment_records[0], rule: rules[0], therapist: therapists[0], status: :active },
  { record: assessment_records[1], rule: rules[1], therapist: therapists[0], status: :active },
  { record: assessment_records[2], rule: rules[1], therapist: therapists[1], status: :active },
  { record: assessment_records[3], rule: rules[2], therapist: therapists[1], status: :completed },
  { record: assessment_records[4], rule: rules[0], therapist: therapists[2], status: :active }
]

prescriptions = prescriptions_data.map do |pd|
  TrainingPrescription.find_or_create_by!(
    assessment_record: pd[:record],
    rule: pd[:rule],
    therapist: pd[:therapist]
  ) do |tp|
    tp.plan_detail = pd[:rule].training_plan
    tp.start_date = 14.days.ago.to_date
    tp.end_date = 14.days.from_now.to_date
    tp.status = pd[:status]
  end
end

session_statuses = [:completed, :completed, :completed, :missed, :planned, :in_progress]
prescriptions.each_with_index do |prescription, p_idx|
  (0..5).each do |s_idx|
    session_date = (s_idx - 3).days.ago.to_date
    status = session_statuses[s_idx]
    actual_duration = status == :completed ? 30 : (status == :missed ? 0 : 0)

    TrainingSession.find_or_create_by!(
      prescription: prescription,
      session_date: session_date
    ) do |ts|
      ts.equipment = equipments[p_idx % equipments.count]
      ts.planned_duration = 30
      ts.actual_duration = actual_duration
      ts.status = status
    end
  end
end

settlements_data = [
  { patient: patients[0], record: assessment_records[0], amount: 1500, status: :approved, insurance_type: "城镇职工" },
  { patient: patients[1], record: assessment_records[1], amount: 2200, status: :denied, insurance_type: "城乡居民" },
  { patient: patients[2], record: assessment_records[2], amount: 1800, status: :pending, insurance_type: "城镇职工" },
  { patient: patients[3], record: assessment_records[3], amount: 3000, status: :denied, insurance_type: "城乡居民" },
  { patient: patients[4], record: assessment_records[4], amount: 1200, status: :submitted, insurance_type: "城镇职工" }
]

settlements = settlements_data.map do |sd|
  Settlement.find_or_create_by!(
    patient: sd[:patient],
    assessment_record: sd[:record]
  ) do |s|
    s.amount = sd[:amount]
    s.status = sd[:status]
    s.insurance_type = sd[:insurance_type]
    s.submitted_at = 5.days.ago if sd[:status] != :pending
    s.settled_at = 3.days.ago if sd[:status] == :approved
  end
end

denied_settlements = settlements.select { |s| s.status == "denied" }
denied_settlements.each do |settlement|
  DenialAction.find_or_create_by!(
    settlement: settlement,
    operator: finance_users.first,
    performed_at: 2.days.ago
  ) do |da|
    da.action_type = :supplement
    da.reason = "缺少评估支撑材料，请补充后重新提交"
  end
end

notifications_data = [
  { user: therapists[0], title: "结算被拒付", message: "患者#{patients[1].name}的结算申请被拒付，请处理", category: "denial" },
  { user: therapists[1], title: "结算被拒付", message: "患者#{patients[3].name}的结算申请被拒付，请处理", category: "denial" },
  { user: admin, title: "设备维护提醒", message: "功率自行车B进入维护状态", category: "equipment" },
  { user: therapists[2], title: "新评估待处理", message: "患者#{patients[4].name}已完成评估，请查看", category: "assessment" },
  { user: admin, title: "系统更新通知", message: "系统已完成例行维护更新", category: "system" }
]

notifications_data.each do |nd|
  Notification.find_or_create_by!(
    user: nd[:user],
    title: nd[:title],
    sent_at: Time.current
  ) do |n|
    n.message = nd[:message]
    n.category = nd[:category]
    n.read = false
    n.settlement = nil
  end
end

puts "Seed data created: #{Area.count} areas, #{User.count} users, #{Patient.count} patients"
puts "#{AssessmentScale.count} scales, #{ScaleItem.count} items, #{PrescriptionRule.count} rules"
puts "#{AssessmentRecord.count} records, #{TrainingPrescription.count} prescriptions, #{TrainingSession.count} sessions"
puts "#{Settlement.count} settlements, #{DenialAction.count} denial actions, #{Notification.count} notifications"
puts "#{Equipment.count} equipment items"
