unless Client.exists?
  clients = [
    { name: "张三", phone: "13800138001", id_number: "110101199001011234", email: "zhangsan@example.com", address: "北京市朝阳区", source_channel: "线上推广", contact_person: "张三本人", notes: "老客户" },
    { name: "李四", phone: "13800138002", id_number: "110101199002022345", email: "lisi@example.com", address: "北京市海淀区", source_channel: "客户转介", contact_person: "李四", notes: "" },
    { name: "王五", phone: "13800138003", id_number: "110101199003033456", email: "wangwu@example.com", address: "北京市西城区", source_channel: "律所合作", contact_person: "王律师", notes: "合作律所推荐" },
    { name: "赵六", phone: "13800138004", source_channel: "企业合作", contact_person: "赵总", notes: "企业客户联系人" }
  ]
  clients.each { |c| Client.create!(c) }
  puts "Created #{Client.count} clients"
end

unless LegalCase.exists?
  clients = Client.all.to_a
  statuses = [:draft, :pending, :in_progress, :material_missing, :review_required, :completed, :closed]
  categories = LegalCase::CATEGORIES
  channels = LegalCase::SOURCE_CHANNELS
  persons = ["张律师", "李律师", "王律师", "刘律师"]

  sample_cases = [
    { title: "房屋买卖合同纠纷案", desc: "客户购买二手房后卖方拒绝过户，涉及违约金赔付" },
    { title: "劳动争议仲裁案", desc: "员工被公司违法解除劳动合同，要求经济赔偿金" },
    { title: "交通事故人身损害赔偿", desc: "客户被撞伤，对方全责，保险公司拒赔部分项目" },
    { title: "民间借贷纠纷", desc: "借款30万逾期未还，有借条和转账记录" },
    { title: "离婚财产分割案", desc: "双方就房产和子女抚养权存在争议" },
    { title: "股权转让协议纠纷", desc: "股权转让后对方未支付尾款" },
    { title: "商标侵权诉讼", desc: "客户品牌被仿冒，要求停止侵权并赔偿" },
    { title: "房屋租赁合同纠纷", desc: "租户拖欠租金6个月，拒绝搬离" }
  ]

  sample_cases.each_with_index do |sc, i|
    client = clients[i % clients.size]
    status = statuses[i % statuses.size]
    kase = LegalCase.create!(
      client: client,
      title: sc[:title],
      case_number: "(2026)京0105民初#{format('%04d', i + 1)}号",
      category: categories[i % categories.size],
      status: status,
      responsible_person: persons[i % persons.size],
      accept_date: Date.today - i.days,
      close_date: (status == :closed ? Date.today - 1.day : nil),
      amount: [nil, 50000, 100000, 300000, 500000][i % 5],
      description: sc[:desc],
      source_channel: channels[i % channels.size],
      material_missing: (status == :material_missing),
      missing_details: (status == :material_missing ? "缺少证据材料原件，需要补充" : nil)
    )

    stages = ["立案阶段", "证据交换", "庭前调解", "开庭审理", "判决执行"]
    stages.each_with_index do |s, idx|
      stage_status = if status == :draft
                       "pending"
                     elsif status == :completed || status == :closed
                       "completed"
                     else
                       idx < 2 ? "completed" : (idx == 2 ? "in_progress" : "pending")
                     end
      kase.case_stages.create!(
        name: s,
        description: "#{s}相关工作",
        status: stage_status,
        order: idx + 1,
        start_date: Date.today - (stages.size - idx).days,
        end_date: stage_status == "completed" ? Date.today - (stages.size - idx - 1).days : nil
      )
    end

    if i.even?
      %w[起诉状 证据材料 委托合同].each_with_index do |ev, ei|
        is_missing = (status == :material_missing && ei == 1)
        kase.evidence_attachments.create!(
          name: "#{sc[:title]}-#{ev}",
          category: ev,
          description: "案件相关#{ev}",
          uploaded_by: persons[i % persons.size],
          page_count: [3, 8, 15, 2][ei % 4],
          is_missing: is_missing,
          missing_notes: is_missing ? "缺少该材料的第二页" : nil
        )
      end
    end

    kase.follow_ups.create!(
      content: "已与客户沟通案件进展，客户表示配合",
      follow_date: DateTime.now - (i + 1).hours,
      operator: persons[i % persons.size],
      next_step: "准备相关材料"
    ) if status != :draft

    if status == :completed || status == :closed
      kase.review_records.create!(
        content: "案件已顺利结案，客户对结果满意",
        result: "胜诉/达成调解",
        lessons: "前期证据准备充分，沟通及时",
        review_date: Date.today,
        operator: persons[(i + 1) % persons.size]
      )
    end

    if kase.status != :draft
      kase.status_transitions.create!(
        from_status: :draft,
        to_status: status == :draft ? :pending : status,
        operator: persons[i % persons.size],
        reason: "案件录入系统"
      )
    end
  end

  puts "Created #{LegalCase.count} cases"
end

puts "Seed data creation complete!"
