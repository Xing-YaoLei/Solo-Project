users = [
  { name: '张三', email: 'zhangsan@example.com', password: 'password123', role: 'creator' },
  { name: '李四', email: 'lisi@example.com', password: 'password123', role: 'reviewer' },
  { name: '王五', email: 'wangwu@example.com', password: 'password123', role: 'admin' },
  { name: '赵六', email: 'zhaoliu@example.com', password: 'password123', role: 'creator' }
]

users.each do |user_attrs|
  User.find_or_create_by!(email: user_attrs[:email]) do |u|
    u.name = user_attrs[:name]
    u.password = user_attrs[:password]
    u.role = user_attrs[:role]
  end
end

puts "✅ 用户数据创建完成"

risk_words = [
  { word: '绝对保证', category: 'legal', risk_level: 'high', description: '法律风险：绝对化承诺表述' },
  { word: '100%安全', category: 'compliance', risk_level: 'high', description: '合规风险：虚假承诺' },
  { word: '保本保息', category: 'legal', risk_level: 'high', description: '法律风险：保本保息承诺' },
  { word: '国家级', category: 'sensitive', risk_level: 'high', description: '敏感词：国家级表述' },
  { word: '最高级', category: 'sensitive', risk_level: 'high', description: '敏感词：最高级表述' },
  { word: '第一品牌', category: 'compliance', risk_level: 'medium', description: '合规风险：涉嫌虚假宣传' },
  { word: '全网最低', category: 'compliance', risk_level: 'medium', description: '合规风险：价格承诺' },
  { word: '疗效显著', category: 'legal', risk_level: 'medium', description: '法律风险：医疗效果承诺' },
  { word: '零风险', category: 'legal', risk_level: 'medium', description: '法律风险：零风险承诺' },
  { word: '个人隐私', category: 'privacy', risk_level: 'medium', description: '隐私风险：个人信息相关' },
  { word: '身份证号', category: 'privacy', risk_level: 'low', description: '隐私风险：敏感个人信息' },
  { word: '手机号码', category: 'privacy', risk_level: 'low', description: '隐私风险：个人联系方式' }
]

risk_words.each do |word_attrs|
  RiskWord.find_or_create_by!(word: word_attrs[:word]) do |rw|
    rw.category = word_attrs[:category]
    rw.risk_level = word_attrs[:risk_level]
    rw.description = word_attrs[:description]
  end
end

puts "✅ 风险词库创建完成"

creator = User.find_by(role: 'creator')
reviewer = User.find_by(role: 'reviewer')

if creator && reviewer
  documents = [
    {
      title: '2024年度法律顾问服务合同',
      doc_type: 'contract',
      content: <<~CONTENT
        甲方：XX科技有限公司
        乙方：XX律师事务所

        鉴于甲方需要专业法律服务，乙方具备提供法律服务的资质和能力，
        双方本着平等互利、诚实信用的原则，经友好协商，达成如下协议：

        第一条 服务范围
        1.1 乙方为甲方提供日常法律咨询服务
        1.2 乙方为甲方提供合同审查服务
        1.3 乙方为甲方提供法律风险评估服务

        第二条 服务期限
        本合同服务期限为壹年，自2024年1月1日起至2024年12月31日止。

        第三条 服务费用
        3.1 年度法律顾问费为人民币贰拾万元整
        3.2 甲方应在合同签订后十日内支付全额费用

        第四条 双方权利义务
        4.1 甲方应如实提供相关情况和材料
        4.2 乙方应勤勉尽责地提供法律服务
        4.3 乙方对知悉的甲方商业秘密负有保密义务

        第五条 违约责任
        5.1 任何一方违反本合同约定，应承担相应的违约责任
        5.2 如因乙方过错导致甲方损失的，乙方应承担赔偿责任

        第六条 争议解决
        因本合同引起的争议，双方应友好协商解决；协商不成的，
        任何一方均可向甲方所在地人民法院提起诉讼。
      CONTENT
    },
    {
      title: '关于产品合规性的法律意见书',
      doc_type: 'legal_opinion',
      content: <<~CONTENT
        致：XX科技有限公司

        本所接受贵司委托，就贵司新产品"智能理财助手"的合规性出具本法律意见书。

        一、审查范围
        1. 产品宣传文案
        2. 用户服务协议
        3. 隐私政策

        二、主要风险点

        （一）宣传合规风险
        目前宣传文案中存在"100%安全"、"保本保息"等表述，
        根据《广告法》相关规定，此类绝对化用语可能构成虚假宣传，
        建议进行修改。

        （二）数据合规风险
        产品收集用户手机号码、身份证号等个人信息，
        需确保符合《个人信息保护法》的相关要求。

        三、建议措施
        1. 修改宣传文案，去除绝对化表述
        2. 完善隐私政策，明确数据使用范围
        3. 建立用户信息保护制度

        本意见仅供参考，具体执行请结合实际情况。
      CONTENT
    },
    {
      title: '员工保密协议模板',
      doc_type: 'contract',
      content: <<~CONTENT
        员工保密协议

        甲方（用人单位）：XX科技有限公司
        乙方（员工）：___________

        鉴于乙方在甲方任职，知悉甲方的商业秘密，
        为保护甲方的合法权益，双方达成如下协议：

        第一条 保密内容
        1.1 技术信息：包括但不限于技术方案、源代码、算法等
        1.2 经营信息：包括但不限于客户名单、财务数据、营销策略等
        1.3 其他甲方标注为保密的信息

        第二条 保密义务
        2.1 乙方应严格保守甲方的商业秘密
        2.2 未经甲方书面同意，乙方不得向任何第三方披露
        2.3 乙方应妥善保管保密资料

        第三条 保密期限
        保密期限自乙方知悉之日起至相关信息公开之日止。

        第四条 违约责任
        4.1 乙方违反保密义务的，应承担违约责任
        4.2 造成甲方损失的，乙方应予以赔偿

        第五条 争议解决
        因本协议引起的争议，双方应友好协商解决。
      CONTENT
    },
    {
      title: '民事诉讼起诉状',
      doc_type: 'lawsuit',
      content: <<~CONTENT
        民事起诉状

        原告：XX科技有限公司
        住所地：北京市朝阳区XX路XX号
        法定代表人：XXX 职务：总经理

        被告：YY网络科技有限公司
        住所地：北京市海淀区XX路XX号
        法定代表人：YYY 职务：董事长

        诉讼请求：
        1. 判令被告立即停止侵犯原告著作权的行为
        2. 判令被告赔偿原告经济损失人民币50万元
        3. 判令被告承担本案全部诉讼费用

        事实与理由：
        原告系"智能办公系统V2.0"的著作权人，该软件于2023年6月开发完成
        并取得计算机软件著作权登记证书。

        近日，原告发现被告在其运营的网站上提供与原告软件功能界面
        高度相似的软件下载服务，被告的行为已构成对原告著作权的侵犯。

        为维护原告的合法权益，特向贵院提起诉讼，恳请依法判决。

        此致
        北京市海淀区人民法院

        具状人：XX科技有限公司（盖章）
        2024年X月X日
      CONTENT
    },
    {
      title: '公司考勤管理制度',
      doc_type: 'regulation',
      content: <<~CONTENT
        XX科技有限公司考勤管理制度

        第一章 总则

        第一条 为规范公司考勤管理，维护正常工作秩序，
        保障公司和员工的合法权益，特制定本制度。

        第二条 本制度适用于公司全体员工。

        第二章 工作时间

        第三条 公司实行标准工时制度，工作时间为：
        周一至周五：9:00-18:00
        午休时间：12:00-13:30

        第四条 因工作需要加班的，应提前申请并经审批。

        第三章 考勤方式

        第五条 员工应通过打卡系统进行上下班打卡。
        第六条 上班打卡应在9:00之前，下班打卡应在18:00之后。

        第四章 请假管理

        第七条 员工请假应提前提交申请，按审批权限逐级审批。
        第八条 请假类型包括：事假、病假、年假、婚假、产假等。

        第五章 奖惩措施

        第九条 全勤员工给予全勤奖励。
        第十条 迟到早退按公司规定处理。

        第六章 附则

        第十一条 本制度由人力资源部负责解释。
        第十二条 本制度自发布之日起执行。
      CONTENT
    }
  ]

  documents.each_with_index do |doc_attrs, i|
    doc = Document.find_or_create_by!(title: doc_attrs[:title]) do |d|
      d.doc_type = doc_attrs[:doc_type]
      d.content = doc_attrs[:content]
      d.creator = creator
      d.status = 'draft'
    end

    if doc.status == 'draft' && doc.content_versions.empty?
      doc.create_content_version(creator, '初始版本')
      doc.record_interaction(creator, 'create', '创建文书')
      doc.scan_risk_words
    end
  end

  puts "✅ 示例文书创建完成"
end

puts "🎉 种子数据全部加载完成！"
