puts "开始创建种子数据..."

lesson_topics = ["入门介绍", "核心概念", "基础语法", "实战练习", "进阶技巧", "项目实战", "性能优化", "最佳实践", "常见问题", "总结回顾"]

admin = User.create_with(
  name: "系统管理员",
  password: "password123",
  role: "admin",
  status: "active"
).find_or_create_by!(email: "admin@example.com")
puts "✓ 创建管理员账号: admin@example.com / password123"

finance = User.create_with(
  name: "财务人员",
  password: "password123",
  role: "finance",
  status: "active"
).find_or_create_by!(email: "finance@example.com")
puts "✓ 创建财务账号: finance@example.com / password123"

assistant = User.create_with(
  name: "助教小王",
  password: "password123",
  role: "assistant",
  status: "active"
).find_or_create_by!(email: "assistant@example.com")
puts "✓ 创建助教账号: assistant@example.com / password123"

teacher = User.create_with(
  name: "李老师",
  password: "password123",
  role: "teacher",
  status: "active"
).find_or_create_by!(email: "teacher@example.com")
puts "✓ 创建教师账号: teacher@example.com / password123"

10.times do |i|
  User.create_with(
    name: "学员#{i + 1}",
    password: "password123",
    role: "student",
    status: "active"
  ).find_or_create_by!(email: "student#{i + 1}@example.com")
end
puts "✓ 创建10个学员账号"

channel1 = Channel.create_with(
  name: "官方渠道",
  commission_rate: 0.0,
  contact_name: "官方",
  status: "active"
).find_or_create_by!(code: "OFFICIAL")

channel2 = Channel.create_with(
  name: "百度推广",
  commission_rate: 0.2,
  contact_name: "张经理",
  contact_phone: "13800138001",
  status: "active"
).find_or_create_by!(code: "BAIDU")

channel3 = Channel.create_with(
  name: "抖音推广",
  commission_rate: 0.25,
  contact_name: "王经理",
  contact_phone: "13800138002",
  status: "active"
).find_or_create_by!(code: "DOUYIN")

channel4 = Channel.create_with(
  name: "老学员转介绍",
  commission_rate: 0.15,
  contact_name: "陈老师",
  contact_phone: "13800138003",
  status: "active"
).find_or_create_by!(code: "REFERRAL")
puts "✓ 创建4个渠道"

default_channel = Channel.first || channel1

courses_data = [
  { title: "Python数据分析实战", description: "从零开始学习Python数据分析，掌握Pandas、NumPy、Matplotlib等核心库", price: 2999, duration: 40 },
  { title: "Java后端开发工程师", description: "系统学习Java后端开发，包括Spring Boot、MyBatis、数据库设计等", price: 4999, duration: 80 },
  { title: "前端全栈开发课程", description: "HTML/CSS/JavaScript到Vue/React，全面掌握前端开发技能", price: 3999, duration: 60 },
  { title: "UI/UX设计入门到精通", description: "学习设计思维、Figma工具使用、交互设计原理", price: 2499, duration: 50 },
  { title: "软件测试工程师培养", description: "功能测试、自动化测试、性能测试全面覆盖", price: 2999, duration: 45 }
]

courses_data.each do |course_data|
  course = Course.create_with(
    description: course_data[:description],
    price: course_data[:price],
    original_price: course_data[:price] * 1.2,
    duration: course_data[:duration],
    teacher_id: teacher.id,
    channel_id: default_channel.id,
    status: "published",
    total_lessons: 15,
    total_exams: 1
  ).find_or_create_by!(title: course_data[:title])

  3.times do |ci|
    chapter = Chapter.create_with(
      course_id: course.id,
      position: ci + 1,
      status: "active",
      description: "本章介绍#{course.title}的核心内容"
    ).find_or_create_by!(course_id: course.id, title: "第#{ci + 1}章 #{course.title}基础")

    5.times do |li|
      Lesson.create_with(
        chapter_id: chapter.id,
        position: li + 1,
        lesson_type: "video",
        duration: 20 + (li * 5),
        status: "active",
        content: "这是#{chapter.title}的第#{li + 1}节课内容"
      ).find_or_create_by!(chapter_id: chapter.id, title: "课时#{li + 1}：#{lesson_topics[(ci * 5 + li) % lesson_topics.size]}")
    end
  end

  question_bank = QuestionBank.create_with(
    course_id: course.id,
    description: "#{course.title}配套题库",
    question_count: 20,
    status: "active"
  ).find_or_create_by!(title: "#{course.title}题库", course_id: course.id)

  20.times do |qi|
    Question.create_with(
      question_bank_id: question_bank.id,
      question_type: qi < 10 ? "single_choice" : qi < 15 ? "multiple_choice" : "true_false",
      content: "这是一道关于#{course.title}的测试题目#{qi + 1}",
      options: {
        A: "选项A内容",
        B: "选项B内容",
        C: "选项C内容",
        D: "选项D内容"
      },
      answer: qi < 10 ? "A" : qi < 15 ? ["A", "B"] : "true",
      analysis: "这是题目解析说明",
      difficulty: "medium",
      score: 5,
      status: "active"
    ).find_or_create_by!(question_bank_id: question_bank.id, content: "这是一道关于#{course.title}的测试题目#{qi + 1}")
  end

  Exam.create_with(
    course_id: course.id,
    question_bank_id: question_bank.id,
    title: "#{course.title}结业考试",
    duration: 120,
    passing_score: 60,
    total_score: 100,
    attempt_limit: 3,
    status: "published"
  ).find_or_create_by!(title: "#{course.title}结业考试", course_id: course.id)

  Certificate.create_with(
    course_id: course.id,
    title: "#{course.title}结业证书",
    certificate_type: "completion",
    template_url: "/certificates/default.png",
    validity_period: 365,
    status: "active"
  ).find_or_create_by!(course_id: course.id, title: "#{course.title}结业证书")

  2.times do |li|
    LiveSession.create_with(
      course_id: course.id,
      title: "#{course.title}直播课第#{li + 1}讲",
      description: "#{course.title}系列直播第#{li + 1}讲",
      start_time: (li + 1).days.from_now,
      end_time: (li + 1).days.from_now + 2.hours,
      status: "upcoming",
      stream_url: "https://example.com/live/#{course.id}/#{li + 1}",
      playback_url: "https://example.com/playback/#{course.id}/#{li + 1}"
    ).find_or_create_by!(title: "#{course.title}直播课第#{li + 1}讲", course_id: course.id, start_time: (li + 1).days.from_now)
  end
end
puts "✓ 创建5门课程，每门包含3章15课时、20道题、1个考试、1个证书模板、2次直播"

students = User.where(role: "student")
courses = Course.all
channels = Channel.all

students.each_with_index do |student, si|
  courses.take(2 + (si % 3)).each_with_index do |course, ci|
    channel = channels[ci % channels.size]
    order_no = "ORD#{Time.current.strftime('%Y%m%d')}#{format('%06d', si * 10 + ci)}"

    order = Order.create_with(
      user_id: student.id,
      course_id: course.id,
      channel_id: channel.id,
      amount: course.price,
      original_amount: course.price,
      discount_amount: 0,
      status: "paid",
      pay_method: "alipay",
      paid_at: (10 + si * 2).days.ago,
      refund_amount: 0
    ).find_or_create_by!(order_no: order_no)

    progress_val = (si * 15 + ci * 10) % 100
    completed_lessons = (progress_val / 7).to_i
    exam_passed = si.even?

    enrollment = Enrollment.create_with(
      user_id: student.id,
      course_id: course.id,
      channel_id: channel.id,
      order_id: order.id,
      status: "studying",
      enrolled_at: (10 + si * 2).days.ago,
      expired_at: (10 + si * 2).days.ago + 365.days,
      progress: progress_val,
      completed_lessons_count: completed_lessons,
      total_lessons_count: course.total_lessons || 15,
      exam_passed: exam_passed,
      certificate_issued: false
    ).find_or_create_by!(user_id: student.id, course_id: course.id)

    if si.even? && ci == 0
      FollowUp.create_with(
        enrollment_id: enrollment.id,
        assistant_id: assistant.id,
        reason: si % 2 == 0 ? "工作繁忙，暂时没有时间学习" : "课程难度较大，需要更多时间消化",
        description: "学员进度落后，需要跟进督促学习",
        next_follow_up_at: si.even? ? 1.day.from_now : 3.days.from_now,
        status: si % 3 == 0 ? "pending" : "contacted"
      ).find_or_create_by!(enrollment_id: enrollment.id, status: si % 3 == 0 ? "pending" : "contacted")
    end

    if si == 0 && ci == 0
      Appeal.create_with(
        enrollment_id: enrollment.id,
        user_id: student.id,
        appeal_type: si % 2 == 0 ? "refund" : "extension",
        title: si.even? ? "退款申请" : "延期申请",
        content: "因为个人原因，申请#{si.even? ? '退款' : '延期学习'}，请审批。",
        status: "pending"
      ).find_or_create_by!(title: si.even? ? "退款申请-#{student.name}" : "延期申请-#{student.name}", user_id: student.id)
    end
  end
end
puts "✓ 创建报名记录、跟进记录和申诉记录"

settlement1 = Settlement.create_with(
  period_start: 1.month.ago.beginning_of_month.to_date,
  period_end: 1.month.ago.end_of_month.to_date,
  status: "approved",
  total_orders: 5,
  total_amount: 14995,
  completed_courses_count: 3,
  passed_exams_count: 2,
  refund_count: 1,
  refund_amount: 2999,
  channel_commission_amount: 2549.15,
  net_revenue: 9446.85,
  settled_at: 1.month.ago.end_of_month.to_date
).find_or_create_by!(period_start: 1.month.ago.beginning_of_month.to_date, period_end: 1.month.ago.end_of_month.to_date)
puts "✓ 创建1条历史结算单"

puts "\n=== 种子数据创建完成 ==="
puts "管理员账号: admin@example.com / password123"
puts "财务账号: finance@example.com / password123"
puts "助教账号: assistant@example.com / password123"
puts "教师账号: teacher@example.com / password123"
puts "学员账号: student1@example.com ~ student10@example.com / password123"
