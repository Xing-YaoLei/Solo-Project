class ExportReportJob < ApplicationJob
  queue_as :exports

  def perform(export_record_id)
    export_record = ExportRecord.find_by(id: export_record_id)
    return unless export_record

    data, headers = case export_record.export_type
                    when "exam_pass_rates"
                      generate_exam_pass_rates_report(export_record)
                    when "redemption_records"
                      generate_redemption_records_report(export_record)
                    when "refund_records"
                      generate_refund_records_report(export_record)
                    when "student_list"
                      generate_student_list_report(export_record)
                    when "plagiarism_logs"
                      generate_plagiarism_logs_report(export_record)
                    when "operation_logs"
                      generate_operation_logs_report(export_record)
                    when "member_profiles"
                      generate_member_profiles_report(export_record)
                    else
                      raise "Unknown export type: #{export_record.export_type}"
                    end

    csv_content = export_record.generate_csv(data, headers, export_record.operator&.name)

    file_name = generate_file_name(export_record)
    file_path = Rails.root.join("tmp", "exports", file_name)
    FileUtils.mkdir_p(File.dirname(file_path))
    File.write(file_path, csv_content.force_encoding("UTF-8"))

    export_record.update!(
      file_name: file_name,
      file_url: "/exports/#{file_name}",
      status: "completed",
      generated_at: Time.current
    )

    OperationLog.log!(
      "export",
      operator: export_record.operator,
      target: export_record,
      reason: "导出 #{export_record.export_type_name}",
      details: "筛选条件: #{export_record.filter_conditions.to_json}, 文件名: #{file_name}"
    )
  rescue => e
    export_record&.update(status: "failed", error_message: e.message)
    Rails.logger.error "ExportReportJob failed for record #{export_record_id}: #{e.message}"
    raise e
  end

  private

  def generate_file_name(export_record)
    timestamp = Time.current.strftime("%Y%m%d_%H%M%S")
    "#{export_record.export_type}_#{timestamp}.csv"
  end

  def generate_exam_pass_rates_report(record)
    filters = record.filter_conditions || {}
    year = filters["year"]
    month = filters["month"]
    community_id = filters["community_id"]
    exam_type = filters["exam_type"]

    headers = ["考试ID", "考试名称", "考试类型", "考试日期", "所属社群", "参考人数", "通过人数", "未通过人数", "通过率(%)", "平均分"]

    exams = Exam.all
    exams = exams.where(exam_type: exam_type) if exam_type.present?
    exams = exams.where(community_id: community_id) if community_id.present?
    if year.present? && month.present?
      start_date = Date.new(year.to_i, month.to_i, 1)
      end_date = start_date.end_of_month
      exams = exams.where(exam_date: start_date..end_date)
    end

    data = exams.order(exam_date: :desc).map do |exam|
      [
        exam.id,
        exam.name,
        exam.exam_type,
        exam.exam_date,
        exam.community&.name || "N/A",
        exam.total_participants,
        exam.passed_count,
        exam.failed_count,
        exam.pass_rate,
        exam.average_score
      ]
    end

    [data, headers]
  end

  def generate_redemption_records_report(record)
    filters = record.filter_conditions || {}
    headers = ["记录ID", "学员ID", "学员姓名", "权益名称", "核销码", "核销时间", "渠道", "状态", "使用积分", "操作员", "备注"]

    records = RedemptionRecord.all
    records = records.where(student_id: filters["student_id"]) if filters["student_id"].present?
    records = records.where(status: filters["status"]) if filters["status"].present?
    if filters["start_date"].present? && filters["end_date"].present?
      records = records.where(redeemed_at: filters["start_date"]..filters["end_date"])
    end

    data = records.order(redeemed_at: :desc).map do |r|
      [
        r.id, r.student_id, r.student&.name, r.benefit_name,
        r.redemption_code, r.redeemed_at, r.channel, r.status,
        r.points_used, r.operator&.name, r.notes
      ]
    end

    [data, headers]
  end

  def generate_refund_records_report(record)
    filters = record.filter_conditions || {}
    headers = ["记录ID", "学员ID", "学员姓名", "退款金额", "退款原因代码", "退款原因", "退款状态", "支付方式", "退款时间", "操作员", "审批备注"]

    records = RefundRecord.all
    records = records.where(student_id: filters["student_id"]) if filters["student_id"].present?
    records = records.where(refund_status: filters["refund_status"]) if filters["refund_status"].present?
    records = records.where(refund_reason_code: filters["refund_reason_code"]) if filters["refund_reason_code"].present?

    data = records.order(created_at: :desc).map do |r|
      [
        r.id, r.student_id, r.student&.name, r.refund_amount,
        r.refund_reason_code, r.refund_reason, r.refund_status,
        r.payment_method, r.refunded_at, r.operator&.name, r.approval_notes
      ]
    end

    [data, headers]
  end

  def generate_student_list_report(record)
    filters = record.filter_conditions || {}
    headers = ["学员ID", "姓名", "手机号", "邮箱", "学历", "职业", "所属社群", "状态", "入学日期", "会员等级", "会员到期日期"]

    students = Student.all
    students = students.where(community_id: filters["community_id"]) if filters["community_id"].present?
    students = students.where(status: filters["status"]) if filters["status"].present?

    data = students.order(created_at: :desc).map do |s|
      [
        s.id, s.name, s.phone, s.email, s.education, s.occupation,
        s.community&.name || "N/A", s.status, s.enrollment_date,
        s.member_profile&.member_level, s.member_profile&.membership_end_date
      ]
    end

    [data, headers]
  end

  def generate_plagiarism_logs_report(record)
    filters = record.filter_conditions || {}
    headers = ["日志ID", "学员ID", "学员姓名", "作业ID", "作业标题", "相似度(%)", "状态", "原因", "负责人", "通知时间", "解决时间", "关闭时间", "处理动作", "处理人"]

    logs = PlagiarismLog.all
    logs = logs.where(student_id: filters["student_id"]) if filters["student_id"].present?
    logs = logs.where(status: filters["status"]) if filters["status"].present?
    logs = logs.where(responsible_user_id: filters["responsible_user_id"]) if filters["responsible_user_id"].present?

    data = logs.order(created_at: :desc).map do |l|
      [
        l.id, l.student_id, l.student&.name, l.assignment_id,
        l.assignment&.title, l.similarity_score, l.status,
        l.reason, l.responsible_user&.name, l.notified_at,
        l.resolved_at, l.closed_at, l.action_taken, l.handler&.name
      ]
    end

    [data, headers]
  end

  def generate_operation_logs_report(record)
    filters = record.filter_conditions || {}
    headers = ["日志ID", "操作人", "动作", "目标类型", "目标ID", "目标名称", "原因", "详情", "IP地址", "状态", "操作时间", "关闭时间"]

    logs = OperationLog.all
    logs = logs.where(operator_id: filters["operator_id"]) if filters["operator_id"].present?
    logs = logs.where(action: filters["action"]) if filters["action"].present?
    logs = logs.where(target_type: filters["target_type"]) if filters["target_type"].present?

    data = logs.order(created_at: :desc).map do |l|
      [
        l.id, l.operator&.name || "系统", l.action, l.target_type,
        l.target_id, l.target_name, l.reason, l.details,
        l.ip_address, l.status, l.created_at, l.closed_at
      ]
    end

    [data, headers]
  end

  def generate_member_profiles_report(record)
    filters = record.filter_conditions || {}
    headers = ["档案ID", "学员ID", "学员姓名", "会员等级", "入会日期", "到期日期", "累计积分", "可用积分", "支付状态", "累计消费"]

    profiles = MemberProfile.all
    profiles = profiles.where(member_level: filters["member_level"]) if filters["member_level"].present?
    profiles = profiles.where(payment_status: filters["payment_status"]) if filters["payment_status"].present?

    data = profiles.order(created_at: :desc).map do |p|
      [
        p.id, p.student_id, p.student&.name, p.member_level,
        p.membership_start_date, p.membership_end_date,
        p.total_points, p.available_points, p.payment_status, p.total_amount
      ]
    end

    [data, headers]
  end
end
