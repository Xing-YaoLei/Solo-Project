# 种子数据：职业教育学员社群结算台
# 运行: rails db:seed

puts "🌱 开始创建种子数据..."

ActiveRecord::Base.transaction do
  users = [
    { name: "系统管理员", email: "admin@example.com", role: "admin", phone: "13800000000" },
    { name: "张老师", email: "zhang@example.com", role: "manager", phone: "13800000001" },
    { name: "李老师", email: "li@example.com", role: "teacher", phone: "13800000002" },
    { name: "王运营", email: "wang@example.com", role: "operator", phone: "13800000003" },
    { name: "赵主管", email: "zhao@example.com", role: "manager", phone: "13800000004" }
  ]

  @users = users.map do |attrs|
    User.find_or_create_by!(email: attrs[:email]) { |u| u.assign_attributes(attrs) }
  end
  puts "✅ 创建了 #{@users.count} 个用户"

  communities = [
    { name: "Web前端就业班2026春季", course_name: "Web前端工程师", status: "active", manager: @users[1], start_date: "2026-02-15", end_date: "2026-08-15", description: "HTML/CSS/JS/React/Vue全栈就业课程" },
    { name: "Java后端架构班2026春季", course_name: "Java高级开发", status: "active", manager: @users[4], start_date: "2026-03-01", end_date: "2026-09-30", description: "SpringBoot/微服务/分布式系统" },
    { name: "数据分析实战营2026", course_name: "Python数据分析", status: "active", manager: @users[2], start_date: "2026-01-10", end_date: "2026-07-10", description: "Pandas/NumPy/SQL/可视化" },
    { name: "UI/UX设计师认证2025冬", course_name: "UI设计", status: "completed", manager: @users[1], start_date: "2025-11-01", end_date: "2026-05-01", description: "Figma/用户研究/交互设计" }
  ]

  @communities = communities.map do |attrs|
    Community.find_or_create_by!(name: attrs[:name]) { |c| c.assign_attributes(attrs) }
  end
  puts "✅ 创建了 #{@communities.count} 个社群"

  student_names = [
    "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
    "郑十一", "王十二", "冯十三", "陈十四", "楚十五", "卫十六", "蒋十七", "沈十八",
    "韩十九", "杨二十", "朱廿一", "秦廿二", "尤廿三", "许廿四", "何廿五", "吕廿六",
    "施廿七", "张廿八", "孔廿九", "曹三十", "严卅一", "华卅二"
  ]

  educations = %w[高中 大专 本科 硕士 博士]
  occupations = %w[学生 在职 转行 待业 自由职业]
  statuses = %w[active active active active active inactive suspended graduated]
  genders = %w[male female]

  @students = []
  student_names.each_with_index do |name, i|
    community = @communities[i % 4]
    attrs = {
      name: name,
      phone: "139#{rand(10000000..99999999)}",
      email: "student#{i + 1}@example.com",
      id_number: "11010119#{rand(90..99)}#{rand(10..99)}#{rand(10..99)}#{rand(1000..9999)}",
      birthday: Date.new(1995 + rand(10), rand(1..12), rand(1..28)),
      gender: genders.sample,
      education: educations.sample,
      occupation: occupations.sample,
      community: community,
      status: statuses.sample,
      enrollment_date: (Date.parse(community.start_date.to_s) + rand(1..30).days),
      notes: i % 5 == 0 ? "重点关注学员" : nil
    }
    @students << Student.find_or_create_by!(phone: attrs[:phone]) { |s| s.assign_attributes(attrs) }
  end
  puts "✅ 创建了 #{@students.count} 个学员"

  levels = %w[basic basic premium premium vip]
  payment_statuses = %w[paid paid paid partially_paid unpaid]

  @students.each do |student|
    level = levels.sample
    mp = MemberProfile.find_or_create_by!(student: student) do |p|
      p.assign_attributes(
        member_level: level,
        membership_start_date: student.enrollment_date || Date.current,
        membership_end_date: (student.enrollment_date || Date.current) + 365.days,
        total_points: rand(1000..10000),
        available_points: rand(500..8000),
        payment_status: payment_statuses.sample,
        total_amount: level == "vip" ? rand(8000.0..15000.0).round(2) : (level == "premium" ? rand(4000.0..8000.0).round(2) : rand(1000.0..4000.0).round(2)),
        benefits_overview: case level
                           when "vip" then "VIP尊享：1对1导师 + 就业推荐 + 终身答疑"
                           when "premium" then "高级会员：完整课程 + 作业批改 + 社群答疑"
                           else "基础会员：基础课程 + 录播回放"
                           end
      )
    end
  end
  puts "✅ 创建了会员档案"

  benefit_rules = [
    { name: "新学员注册大礼包", rule_type: "gift", target_member_level: "all", is_active: true, effective_date: "2026-01-01", expiry_date: "2026-12-31", creator: @users[0],
      description: "新学员注册即可领取",
      conditions: { "min_points" => 0 }, benefits: { "gift_type" => "学习资料包", "value" => 299 } },
    { name: "VIP学员8折优惠", rule_type: "discount", target_member_level: "vip", is_active: true, effective_date: "2026-01-01", expiry_date: "2026-12-31", creator: @users[0],
      description: "VIP专享折扣",
      conditions: { "order_min" => 100 }, benefits: { "discount_rate" => 0.8 } },
    { name: "高级会员课程赠课", rule_type: "service", target_member_level: "premium", is_active: true, effective_date: "2026-03-01", expiry_date: "2026-09-01", creator: @users[1],
      description: "赠送2节1对1辅导课",
      conditions: {}, benefits: { "free_classes" => 2, "duration" => 60 } },
    { name: "积分兑换优惠券", rule_type: "points", target_member_level: "all", is_active: true, effective_date: "2026-01-01", creator: @users[3],
      description: "1000积分兑换100元优惠券",
      conditions: { "points_required" => 1000 }, benefits: { "coupon_value" => 100 } },
    { name: "毕业学员就业保障", rule_type: "service", target_member_level: "vip", is_active: false, effective_date: "2025-06-01", expiry_date: "2026-06-01", creator: @users[0],
      description: "未就业全额退款",
      conditions: { "graduate" => true }, benefits: { "job_guarantee" => true, "refund_on_fail" => true } }
  ]

  @benefit_rules = benefit_rules.map do |attrs|
    BenefitRule.find_or_create_by!(name: attrs[:name]) { |r| r.assign_attributes(attrs) }
  end
  puts "✅ 创建了 #{@benefit_rules.count} 条权益规则"

  channels = %w[online offline app community_center]
  redemption_statuses = %w[completed completed completed pending expired]

  @students.first(20).each do |student|
    rule = @benefit_rules.sample
    RedemptionRecord.create!(
      student: student,
      benefit_rule: rule,
      operator: @users.sample,
      benefit_name: rule.name,
      redeemed_at: rand(1..60).days.ago,
      channel: channels.sample,
      status: redemption_statuses.sample,
      points_used: rand(0..2000),
      notes: rand(3) == 0 ? "特别备注：#{rand(1..9)}号权益" : nil
    )
  end
  30.times do
    student = @students.sample
    rule = @benefit_rules.sample
    RedemptionRecord.create!(
      student: student,
      benefit_rule: rule,
      operator: @users.sample,
      benefit_name: rule.name,
      redeemed_at: rand(1..90).days.ago,
      channel: channels.sample,
      status: redemption_statuses.sample,
      points_used: rand(0..2000)
    )
  end
  puts "✅ 创建了 #{RedemptionRecord.count} 条核销记录"

  refund_reasons = {
    "course_unsatisfied" => "课程内容与预期不符，进度安排不合理",
    "personal_reason" => "个人工作原因，暂时无法继续学习",
    "duplicate_payment" => "重复支付了订单，申请退回重复部分",
    "financial_difficulty" => "家庭经济困难，无法承担后续费用",
    "service_complaint" => "助教响应不及时，学习体验较差",
    "other" => "其他特殊原因，与老师协商一致退款"
  }
  refund_statuses = %w[completed completed completed approved pending rejected]
  payment_methods = %w[wechat alipay bank_transfer]

  @students.first(12).each do |student|
    reason_code = refund_reasons.keys.sample
    RefundRecord.create!(
      student: student,
      member_profile: student.member_profile,
      operator: @users.sample,
      refund_amount: rand(500.0..3000.0).round(2),
      refund_reason_code: reason_code,
      refund_reason: refund_reasons[reason_code],
      refund_status: refund_statuses.sample,
      payment_method: payment_methods.sample,
      refunded_at: rand(1..60).days.ago,
      approval_notes: rand(2) == 0 ? "经班主任核实，情况属实，同意退款" : nil
    )
  end
  puts "✅ 创建了 #{RefundRecord.count} 条退款记录"

  exams = []
  exam_names = [
    ["HTML基础测试", "quiz"],
    ["CSS布局阶段考", "midterm"],
    ["JavaScript闭包专题", "quiz"],
    ["React框架结业考", "final"],
    ["SpringBoot基础测验", "quiz"],
    ["微服务架构期中", "midterm"],
    ["Java项目实战考核", "final"],
    ["Pandas数据处理", "quiz"],
    ["SQL查询优化认证", "certification"],
    ["数据分析毕业答辩", "final"],
    ["Figma工具入门", "assignment_exam"],
    ["UI设计项目验收", "final"]
  ]

  exam_names.each_with_index do |(name, type), i|
    community = @communities[i % 4]
    exams << Exam.create!(
      name: name,
      exam_type: type,
      community: community,
      exam_date: (Date.parse("2026-04-01") + i * 5.days),
      duration_minutes: [60, 90, 120, 150].sample,
      passing_score: 60.0,
      total_score: 100.0,
      description: "#{community.course_name} - #{name}"
    )
  end
  puts "✅ 创建了 #{exams.count} 场考试"

  scores_dist = (45..100).to_a
  exams.each do |exam|
    exam_students = exam.community.students.limit(rand(8..15))
    exam_students.each do |student|
      score = scores_dist.sample.to_f
      ExamResult.create!(
        exam: exam,
        student: student,
        score: score,
        passed: score >= exam.passing_score,
        rank: nil,
        reviewer: @users.sample,
        reviewed_at: exam.exam_date + 2.days,
        remarks: score >= 85 ? "优秀！" : (score >= 60 ? "继续加油" : "需要补考")
      )
    end
    exam.exam_results.each_with_index do |result, idx|
      result.update!(rank: idx + 1)
    end
  end
  puts "✅ 创建了 #{ExamResult.count} 条考试结果"

  assignments = []
  assignment_titles = [
    "个人简历HTML页面实现",
    "响应式电商首页布局",
    "TodoList应用JS开发",
    "Hooks基础练习",
    "Vue路由与状态管理",
    "SpringBoot RESTful API",
    "MySQL查询优化作业",
    "Redis缓存实战",
    "Pandas数据清洗",
    "数据可视化看板",
    "APP界面原型设计",
    "品牌VI视觉规范"
  ]

  assignment_titles.each_with_index do |title, i|
    community = @communities[i % 4]
    assignments << Assignment.create!(
      title: title,
      community: community,
      creator: @users[i % 5],
      description: "完成 #{title}，提交源代码和说明文档",
      due_date: (Date.parse("2026-04-10") + i * 7.days),
      total_score: 100.0,
      enable_plagiarism_check: true,
      plagiarism_threshold: 30.0,
      requirements: "1. 功能完整 2. 代码规范 3. 有测试用例"
    )
  end
  puts "✅ 创建了 #{assignments.count} 个作业"

  # 生成一些相似的作业内容用于触发抄袭检测
  base_contents = [
    "这是一个关于Web前端的作业实现。我使用了HTML、CSS和JavaScript来构建页面。页面包含导航栏、主体内容和页脚，使用flexbox进行布局。",
    "本作业实现了一个RESTful API服务，采用SpringBoot框架开发，包含Controller、Service、DAO三层架构。数据库使用MySQL，并配置了连接池。",
    "数据分析作业使用Pandas进行数据清洗，处理了缺失值和异常值。使用Matplotlib绘制了趋势图和柱状图，结果保存在output目录中。"
  ]

  flagged_count = 0
  assignments.each_with_index do |assignment, a_idx|
    assignment_students = assignment.community.students.limit(rand(6..12))
    assignment_students.each_with_index do |student, s_idx|
      # 每4个学员有1个写类似内容，制造抄袭场景
      base_idx = s_idx % 3
      original = base_contents[base_idx % base_contents.count]
      content = if s_idx >= 3 && s_idx % 4 == 0
                  # 高度相似
                  original
                elsif s_idx >= 5 && s_idx % 5 == 0
                  # 中等相似
                  original + " 另外我还加了一些额外的功能模块"
                else
                  # 原创
                  "#{student.name}的#{assignment.title}作业：\n" +
                    "本项目实现了#{rand(3..5)}个核心功能模块，" +
                    "采用了分层架构设计。主要技术栈包括#{['React', 'Vue', 'Spring', 'Flask'].sample}等。" +
                    "经过测试，所有功能正常运行。"
                end

      plagiarism_flagged = (s_idx >= 3 && s_idx % 4 == 0)
      plagiarism_score = plagiarism_flagged ? rand(65.0..95.0).round(2) : rand(0.0..25.0).round(2)

      sub = AssignmentSubmission.create!(
        assignment: assignment,
        student: student,
        content: content,
        attachment_url: "/submissions/#{assignment.id}_#{student.id}.zip",
        submitted_at: assignment.due_date - rand(0..3).days,
        last_modified_at: assignment.due_date - rand(0..3).days,
        status: "submitted",
        score: plagiarism_flagged ? rand(0.0..50.0).round(2) : rand(60.0..98.0).round(2),
        plagiarism_score: plagiarism_score,
        plagiarism_flagged: plagiarism_flagged,
        plagiarism_details: plagiarism_flagged ? { "matched_segments" => 3, "source_students" => [assignment_students[base_idx % assignment_students.length]&.id] } : {},
        feedback: plagiarism_flagged ? "疑似抄袭，请参考学术诚信规范" : (rand(5) == 4 ? "整体完成度不错，注意细节优化" : nil),
        reviewer: @users.sample
      )
      flagged_count += 1 if plagiarism_flagged

      if plagiarism_flagged
        responsible = assignment.community.manager || assignment.creator
        source_idx = base_idx % assignment_students.length
        source_student = assignment_students[source_idx]
        similar_log = PlagiarismLog.create!(
          assignment_submission: sub,
          student: student,
          assignment: assignment,
          source_submission_id: source_student ? AssignmentSubmission.find_by(assignment: assignment, student: source_student)&.id : nil,
          similarity_score: plagiarism_score,
          reason: "作业相似度 #{plagiarism_score}% 超过阈值 #{assignment.plagiarism_threshold}%，共检测到 #{rand(2..4)} 处相似文本片段",
          similar_segments: {
            "segment_1" => { "text" => "页面包含导航栏...", "match_length" => 85 },
            "segment_2" => { "text" => "采用分层架构...", "match_length" => 60 }
          },
          status: (flagged_count % 4 == 0) ? "resolved" : ((flagged_count % 3 == 0) ? "closed" : ((flagged_count % 2 == 0) ? "investigating" : "open")),
          responsible_user: responsible,
          notified_at: Time.current - rand(1..10).hours,
          resolved_at: (flagged_count % 4 == 0) ? Time.current - rand(1..5).hours : nil,
          closed_at: (flagged_count % 3 == 0 || flagged_count % 4 == 0) ? Time.current - rand(1..2).hours : nil,
          action_taken: (flagged_count % 4 == 0) ? PlagiarismLog::ACTIONS.sample : nil,
          resolution_notes: (flagged_count % 4 == 0) ? "学员已认错并重新提交作业，给予警告处理" : nil,
          handler: (flagged_count % 3 == 0 || flagged_count % 4 == 0) ? responsible : nil
        )
      end
    end
  end
  puts "✅ 创建了 #{AssignmentSubmission.count} 份作业提交（其中 #{flagged_count} 份标记抄袭）"
  puts "✅ 创建了 #{PlagiarismLog.count} 条抄袭告警日志"

  puts "✅ 所有种子数据创建完成！"
  puts ""
  puts "📊 数据概览："
  puts "  用户: #{User.count}"
  puts "  社群: #{Community.count}"
  puts "  学员: #{Student.count}"
  puts "  会员档案: #{MemberProfile.count}"
  puts "  权益规则: #{BenefitRule.count}"
  puts "  核销记录: #{RedemptionRecord.count}"
  puts "  退款记录: #{RefundRecord.count}"
  puts "  考试: #{Exam.count}"
  puts "  考试结果: #{ExamResult.count}"
  puts "  作业: #{Assignment.count}"
  puts "  作业提交: #{AssignmentSubmission.count}"
  puts "  抄袭日志: #{PlagiarismLog.count}"
  puts "  操作日志: #{OperationLog.count}"
end
