puts "🌱 正在创建种子数据..."

members = Member.create!([
  { name: "张三", member_no: "M001", phone: "13800138001", source_channel: "offline_promotion", notes: "老会员" },
  { name: "李四", member_no: "M002", phone: "13800138002", source_channel: "friend_referral", notes: "朋友介绍" },
  { name: "王五", member_no: "M003", phone: "13800138003", source_channel: "online_referral", notes: "线上报名" },
  { name: "赵六", member_no: "M004", phone: "13800138004", source_channel: "corporate_cooperation", notes: "企业合作客户" },
  { name: "陈七", member_no: "M005", phone: "13800138005", source_channel: "offline_promotion", notes: "新会员" }
])
puts "✅ 已创建 #{members.size} 个会员"

trainers = Trainer.create!([
  { name: "刘教练", employee_no: "T001", phone: "13900139001", specialty: "力量训练", active: true },
  { name: "陈教练", employee_no: "T002", phone: "13900139002", specialty: "有氧运动", active: true },
  { name: "王教练", employee_no: "T003", phone: "13900139003", specialty: "康复训练", active: true },
  { name: "周教练", employee_no: "T004", phone: "13900139004", specialty: "营养指导", active: true }
])
puts "✅ 已创建 #{trainers.size} 个教练"

packages = CoursePackage.create!([
  { name: "私教基础课程包", package_type: "personal_training", total_sessions: 12, price: 3600, validity_days: 90, description: "基础私教训练12节课" },
  { name: "私教进阶课程包", package_type: "personal_training", total_sessions: 24, price: 7200, validity_days: 180, description: "进阶私教训练24节课" },
  { name: "康复训练课程包", package_type: "rehabilitation", total_sessions: 10, price: 5000, validity_days: 60, description: "运动康复专项训练" },
  { name: "营养指导课程包", package_type: "nutrition", total_sessions: 6, price: 1800, validity_days: 30, description: "一对一营养咨询指导" }
])
puts "✅ 已创建 #{packages.size} 个课程包"

review_tags = ReviewTag.create!([
  { name: "体验优秀", color: "#10b981" },
  { name: "需改进", color: "#f59e0b" },
  { name: "会员投诉", color: "#ef4444" },
  { name: "进度正常", color: "#3b82f6" },
  { name: "超预期完成", color: "#8b5cf6" },
  { name: "需补资料", color: "#f97316" },
  { name: "已升级处理", color: "#ec4899" }
])
puts "✅ 已创建 #{review_tags.size} 个复盘标签"

consumptions = []
5.times do |i|
  cc = CourseConsumption.create!(
    bill_no: "CC#{2026061400000 + i}",
    member: members[i],
    trainer: trainers[i % trainers.size],
    course_package: packages[i % packages.size],
    consumption_date: Date.today - i.days,
    sessions_consumed: [1, 2, 3].sample,
    sessions_remaining: packages[i % packages.size].total_sessions - [1, 2, 3].sample,
    responsible_person: trainers[i % trainers.size].name,
    source_channel: members[i].source_channel,
    review_notes: i.even? ? "材料齐全，审核通过" : nil,
    settlement_notes: i.even? ? "已完成结算" : nil,
    review_summary: nil,
    status: %w[draft pending_review processing settled reviewed][i % 5],
    processing_status: %w[normal needs_more_info escalated completed normal][i % 4]
  )
  consumptions << cc

  (1..3).each do |j|
    cc.course_chapters.create!(
      title: "第#{j}节 - #{['热身训练', '力量训练', '拉伸放松', '有氧训练', '核心训练'].sample}",
      content: "本章节主要内容包括基础动作示范和练习，重点关注动作规范。",
      position: j,
      chapter_status: j <= 2 ? "completed" : "pending"
    )
  end

  cc.performance_feedbacks.create!(
    score: [75, 85, 90, 95].sample,
    performance_level: %w[excellent good average needs_improvement].sample,
    coach_feedback: "会员本次训练表现良好，动作完成度较高，继续保持。",
    member_feedback: "训练强度适中，教练指导很专业。",
    improvement_points: "核心稳定性需要加强，建议增加平板支撑练习。",
    body_metrics: "体重70kg, 体脂率18%"
  )

  cc.reminder_rules.create!(
    rule_type: "progress_delay",
    threshold_value: 20,
    threshold_unit: "percent",
    notification_method: "system",
    message_template: "课程进度落后，请及时跟进处理。",
    enabled: true
  )

  cc.review_tags << review_tags.sample(2) if i.even?
  cc.update_progress_rate!
end
puts "✅ 已创建 #{consumptions.size} 个课程消耗单"

puts "\n🎉 种子数据创建完成！"
puts "默认登录后可访问控制台查看数据。"
