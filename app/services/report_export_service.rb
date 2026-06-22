class ReportExportService < ApplicationService
  def initialize(user, export_params)
    super()
    @user = user
    @export_params = export_params.to_h
    @export_type = @export_params[:export_type] || @export_params["export_type"]
    @criteria = parse_criteria
  end

  def call
    return fail("用户不存在") unless @user
    return fail("未指定导出类型") unless @export_type
    return fail("无导出权限") unless can_export?

    transaction do
      export_record = create_export_record
      export_record.generate_caliber_note if export_record.respond_to?(:generate_caliber_note)

      ReportExportJob.perform_later(export_record.id)

      succeed(export_record)
    end
  rescue ActiveRecord::RecordInvalid => e
    fail("导出任务创建失败：#{e.message}", :record_invalid)
  rescue StandardError => e
    fail("导出初始化异常：#{e.message}", :system_error)
  end

  def self.generate_content(export_record)
    new(export_record.user, export_record.criteria.merge(export_type: export_record.export_type))
      .send(:build_export_content, export_record)
  end

  private

  def can_export?
    Pundit.policy(@user, ExportRecord).create?
  end

  def parse_criteria
    raw = @export_params.except(:export_type, "export_type", :controller, :action, :format, :commit, :utf8)
    raw.deep_transform_keys(&:to_s).slice(
      "start_date", "end_date", "supplier_ids", "audit_types",
      "statuses", "severities", "include_caliber_note",
      "include_audit_details", "include_exception_details"
    )
  end

  def create_export_record
    ExportRecord.create!(
      user: @user,
      export_type: @export_type,
      criteria: @criteria,
      status: "pending",
      caliber_note: initial_caliber_note
    )
  end

  def initial_caliber_note
    notes = []
    notes << "导出类型：#{export_type_label}"
    notes << "导出时间：#{I18n.l(Time.current, format: :long)}"
    notes << "导出人：#{@user.name}"
    notes.join("\n")
  end

  def export_type_label
    I18n.t("export_types.#{@export_type}", default: @export_type.to_s.humanize)
  end

  def build_export_content(export_record)
    criteria = export_record.criteria
    period = parse_period(criteria)

    case export_record.export_type
    when "rectification_report"
      build_rectification_report(export_record, criteria, period)
    when "audit_summary"
      build_audit_summary(export_record, criteria, period)
    when "exception_summary"
      build_exception_summary(export_record, criteria, period)
    when "supplier_audit"
      build_supplier_audit(export_record, criteria, period)
    when "full_audit_record"
      build_full_audit_record(export_record, criteria, period)
    else
      raise ArgumentError, "不支持的导出类型：#{export_record.export_type}"
    end
  end

  def parse_period(criteria)
    start_date = (criteria["start_date"] || 30.days.ago.to_date).to_date
    end_date = (criteria["end_date"] || Date.today).to_date
    { start: start_date, end: end_date }
  end

  def build_rectification_report(export_record, criteria, period)
    calc = RectificationRateCalculator.call(nil, period, group_by: :trend)
    raise calc.errors.map { |e| e[:message] }.join("; ") if calc.failure?

    result = calc.result
    caliber = result[:caliber_note]

    package = Axlsx::Package.new
    wb = package.workbook

    styles = define_styles(wb)

    wb.add_worksheet(name: "整改完成率汇总") do |sheet|
      add_caliber_note_sheet(sheet, caliber, styles)

      sheet.add_row [], styles: styles[:blank]
      sheet.add_row ["整改完成率汇总"], styles: styles[:title]
      sheet.add_row [], styles: styles[:blank]

      sheet.add_row ["统计指标", "数值"], styles: styles[:header]
      overall = result[:overall]
      sheet.add_row ["统计周期", result[:period]], styles: styles[:row]
      sheet.add_row ["异常单总数", overall[:total_exceptions]], styles: styles[:row]
      sheet.add_row ["已完成整改", overall[:resolved_count]], styles: styles[:row]
      sheet.add_row ["进行中", overall[:in_progress_count]], styles: styles[:row]
      sheet.add_row ["已逾期", overall[:overdue_count]], styles: styles[:row]
      sheet.add_row ["整改完成率", "#{overall[:rate]}%"], styles: highlight_style(overall[:rate] >= 90, styles)
      sheet.add_row ["目标值", "#{overall[:target_rate]}%"], styles: styles[:row]
      sheet.add_row ["是否达标", overall[:target_met] ? "是" : "否"], styles: styles[:row]
      sheet.add_row ["与目标差值", "#{overall[:delta_vs_target]}%"], styles: styles[:row]
      sheet.add_row ["平均解决时长(小时)", overall[:avg_resolution_time] || "N/A"], styles: styles[:row]
    end

    wb.add_worksheet(name: "按严重等级") do |sheet|
      sheet.add_row ["严重等级", "异常数", "已完成", "完成率", "已逾期"], styles: styles[:header]
      result[:by_severity].each do |severity, data|
        label = I18n.t("severities.#{severity}", default: severity.to_s.humanize)
        sheet.add_row [label, data[:count], data[:resolved], "#{data[:rate]}%", data[:overdue]], styles: styles[:row]
      end
    end

    wb.add_worksheet(name: "按审计类型") do |sheet|
      sheet.add_row ["审计类型", "异常数", "已完成", "完成率"], styles: styles[:header]
      result[:by_audit_type].each do |_type, data|
        sheet.add_row [data[:label], data[:count], data[:resolved], "#{data[:rate]}%"], styles: styles[:row]
      end
    end

    wb.add_worksheet(name: "日趋势") do |sheet|
      sheet.add_row ["日期", "新增异常", "当日完成", "当日完成率", "累计完成率"], styles: styles[:header]
      result[:trend].each do |day|
        sheet.add_row [
          I18n.l(day[:date]),
          day[:total],
          day[:resolved],
          "#{day[:rate]}%",
          "#{day[:cumulative_rate]}%"
        ], styles: styles[:row]
      end
    end

    add_exception_details_sheet(wb, criteria, period, styles) if criteria["include_exception_details"]

    export_caliber_to_sheet(wb, export_record, caliber, styles)

    save_package(package, export_record)
  end

  def build_audit_summary(export_record, criteria, period)
    audits = Audit.includes(:supplier, :creator)
      .where(created_at: period[:start].beginning_of_day..period[:end].end_of_day)
    audits = audits.where(supplier_id: criteria["supplier_ids"]) if criteria["supplier_ids"].present?
    audits = audits.where(audit_type: criteria["audit_types"]) if criteria["audit_types"].present?
    audits = audits.where(status: criteria["statuses"]) if criteria["statuses"].present?

    rect_calc = RectificationRateCalculator.call(audits, period, include_details: false)

    package = Axlsx::Package.new
    wb = package.workbook
    styles = define_styles(wb)

    wb.add_worksheet(name: "审计汇总") do |sheet|
      sheet.add_row ["审计项目汇总报告"], styles: styles[:title]
      sheet.add_row [], styles: styles[:blank]
      sheet.add_row ["统计周期", "#{I18n.l(period[:start])} 至 #{I18n.l(period[:end])}"], styles: styles[:row]
      sheet.add_row ["审计项目总数", audits.count], styles: styles[:row]
      sheet.add_row ["已完成", audits.completed.count], styles: styles[:row]
      sheet.add_row ["进行中", audits.pending.count + audits.in_progress.count], styles: styles[:row]
      sheet.add_row ["已拒绝", audits.where(status: :rejected).count], styles: styles[:row]
      sheet.add_row ["整改完成率", rect_calc.success? ? "#{rect_calc.result[:overall][:rate]}%" : "N/A"], styles: styles[:row]
      sheet.add_row [], styles: styles[:blank]

      sheet.add_row ["审计ID", "标题", "供应商", "审计类型", "状态", "创建人",
                     "创建时间", "开始时间", "结束时间", "证据完整度", "检查项完成率"], styles: styles[:header]

      audits.find_each do |audit|
        sheet.add_row [
          audit.id.to_s[0..7],
          audit.title,
          audit.supplier&.name,
          I18n.t("audit_types.#{audit.audit_type}", default: audit.audit_type.humanize),
          I18n.t("audit_statuses.#{audit.status}", default: audit.status.humanize),
          audit.creator&.name,
          I18n.l(audit.created_at, format: :short),
          audit.start_at ? I18n.l(audit.start_at, format: :short) : "",
          audit.end_at ? I18n.l(audit.end_at, format: :short) : "",
          "#{audit.evidence_completeness}%",
          "#{audit.checklist_progress}%"
        ], styles: styles[:row]
      end
    end

    if criteria["include_caliber_note"] != "false"
      audit_caliber = ExportRecord::CALIBER_NOTES[:audit_completeness]
      export_caliber_to_sheet(wb, export_record, audit_caliber, styles)
    end

    save_package(package, export_record)
  end

  def build_exception_summary(export_record, criteria, period)
    exceptions = ExceptionOrder.includes(audit: [:supplier], handler: [])
      .where(created_at: period[:start].beginning_of_day..period[:end].end_of_day)
    exceptions = exceptions.where(severity: criteria["severities"]) if criteria["severities"].present?

    package = Axlsx::Package.new
    wb = package.workbook
    styles = define_styles(wb)

    wb.add_worksheet(name: "异常单汇总") do |sheet|
      sheet.add_row ["异常单汇总报告"], styles: styles[:title]
      sheet.add_row [], styles: styles[:blank]
      sheet.add_row ["统计周期", "#{I18n.l(period[:start])} 至 #{I18n.l(period[:end])}"], styles: styles[:row]
      sheet.add_row ["异常单总数", exceptions.count], styles: styles[:row]
      sheet.add_row ["已解决", exceptions.resolved.count], styles: styles[:row]
      sheet.add_row ["开放中", exceptions.open.count], styles: styles[:row]
      sheet.add_row ["已逾期", exceptions.overdue.count], styles: styles[:row]
      sheet.add_row [], styles: styles[:blank]

      sheet.add_row ["异常单ID", "标题", "严重等级", "状态", "关联审计", "供应商",
                     "处理人", "创建时间", "截止时间", "解决时间", "解决时长(小时)"], styles: styles[:header]

      exceptions.find_each do |ex|
        sheet.add_row [
          ex.id.to_s[0..7],
          ex.title,
          I18n.t("severities.#{ex.severity}", default: ex.severity.humanize),
          I18n.t("exception_statuses.#{ex.status}", default: ex.status.humanize),
          ex.audit&.title,
          ex.audit&.supplier&.name,
          ex.handler&.name || "待分派",
          I18n.l(ex.created_at, format: :short),
          ex.due_at ? I18n.l(ex.due_at, format: :short) : "",
          ex.resolved_at ? I18n.l(ex.resolved_at, format: :short) : "",
          ex.resolution_time ? (ex.resolution_time * 24).round(1) : ""
        ], styles: styles[:row]
      end
    end

    rect_calc = RectificationRateCalculator.call(nil, period, include_details: false)
    if criteria["include_caliber_note"] != "false" && rect_calc.success?
      export_caliber_to_sheet(wb, export_record, rect_calc.result[:caliber_note], styles)
    end

    save_package(package, export_record)
  end

  def build_supplier_audit(export_record, criteria, period)
    supplier_ids = criteria["supplier_ids"].presence
    suppliers = Supplier.includes(audits: [:exception_orders, :creator])
    suppliers = suppliers.where(id: supplier_ids) if supplier_ids

    package = Axlsx::Package.new
    wb = package.workbook
    styles = define_styles(wb)

    wb.add_worksheet(name: "供应商审计总览") do |sheet|
      sheet.add_row ["供应商审计报告"], styles: styles[:title]
      sheet.add_row [], styles: styles[:blank]

      sheet.add_row ["供应商编码", "供应商名称", "联系人", "联系电话",
                     "状态", "材料完整度", "审计次数", "未完成审计",
                     "异常单数", "整改完成率"], styles: styles[:header]

      suppliers.find_each do |supplier|
        audits = supplier.audits.where(created_at: period[:start].beginning_of_day..period[:end].end_of_day)
        exceptions = supplier.audits.flat_map(&:exception_orders)
        rect_rate = if exceptions.any?
                      resolved = exceptions.count { |e| %w[resolved closed].include?(e.status.to_s) }
                      "#{(resolved.to_f / exceptions.count * 100).round(1)}%"
                    else
                      "N/A"
                    end

        sheet.add_row [
          supplier.code,
          supplier.name,
          supplier.contact_person,
          supplier.phone,
          I18n.t("supplier_statuses.#{supplier.status}", default: supplier.status.humanize),
          "#{supplier.material_completeness}%",
          audits.count,
          audits.where.not(status: %w[approved archived rejected]).count,
          exceptions.count,
          rect_rate
        ], styles: styles[:row]
      end
    end

    save_package(package, export_record)
  end

  def build_full_audit_record(export_record, criteria, period)
    audits = Audit.includes(
      :supplier, :creator, :template,
      :evidence_attachments, :checklist_items,
      :exception_orders, :state_transition_logs
    ).where(created_at: period[:start].beginning_of_day..period[:end].end_of_day)
    audits = audits.where(supplier_id: criteria["supplier_ids"]) if criteria["supplier_ids"].present?

    package = Axlsx::Package.new
    wb = package.workbook
    styles = define_styles(wb)

    wb.add_worksheet(name: "审计项目") do |sheet|
      sheet.add_row ["审计项目完整信息"], styles: styles[:title]
      sheet.add_row [], styles: styles[:blank]
      sheet.add_row ["审计ID", "标题", "供应商", "审计类型", "状态", "创建人",
                     "创建时间", "开始时间", "结束时间", "结论", "通报模板",
                     "证据附件数", "检查项总数", "异常单数"], styles: styles[:header]
      audits.find_each do |audit|
        sheet.add_row [
          audit.id.to_s,
          audit.title,
          audit.supplier&.name,
          audit.audit_type,
          audit.status_text,
          audit.creator&.name,
          I18n.l(audit.created_at, format: :long),
          audit.start_at ? I18n.l(audit.start_at, format: :long) : "",
          audit.end_at ? I18n.l(audit.end_at, format: :long) : "",
          audit.conclusion.to_s[0..200],
          audit.template&.name,
          audit.evidence_attachments.count,
          audit.checklist_items.count,
          audit.exception_orders.count
        ], styles: styles[:row]
      end
    end

    wb.add_worksheet(name: "检查清单") do |sheet|
      sheet.add_row ["审计ID", "检查项编码", "内容", "状态", "所需证据", "核验人", "核验时间", "备注"], styles: styles[:header]
      audits.each do |audit|
        audit.checklist_items.each do |item|
          sheet.add_row [
            audit.id.to_s,
            item.item_code,
            item.content,
            item.status,
            item.evidence_required,
            item.checked_by&.name,
            item.checked_at ? I18n.l(item.checked_at, format: :long) : "",
            item.remark.to_s[0..200]
          ], styles: styles[:row]
        end
      end
    end

    wb.add_worksheet(name: "证据附件") do |sheet|
      sheet.add_row ["审计ID", "附件名称", "类型", "文件大小", "上传人", "上传时间", "说明"], styles: styles[:header]
      audits.each do |audit|
        audit.evidence_attachments.each do |att|
          sheet.add_row [
            audit.id.to_s,
            att.name,
            att.file_type || att.evidence_type,
            att.file_size_human || "",
            att.uploader&.name,
            I18n.l(att.created_at, format: :long),
            att.description.to_s[0..200]
          ], styles: styles[:row]
        end
      end
    end

    wb.add_worksheet(name: "状态变更日志") do |sheet|
      sheet.add_row ["关联对象", "变更前状态", "变更后状态", "操作人", "操作时间", "备注", "元数据"], styles: styles[:header]
      audits.each do |audit|
        audit.state_transition_logs.oldest.each do |log|
          sheet.add_row [
            "审计: #{audit.title[0..30]}",
            log.from_state,
            log.to_state,
            log.operator&.name || "系统",
            I18n.l(log.created_at, format: :long),
            log.remark.to_s[0..200],
            log.metadata.to_s[0..200]
          ], styles: styles[:row]
        end
        audit.exception_orders.each do |ex|
          ex.state_transition_logs.oldest.each do |log|
            sheet.add_row [
              "异常单: #{ex.title[0..30]}",
              log.from_state,
              log.to_state,
              log.operator&.name || "系统",
              I18n.l(log.created_at, format: :long),
              log.remark.to_s[0..200],
              log.metadata.to_s[0..200]
            ], styles: styles[:row]
          end
        end
      end
    end

    save_package(package, export_record)
  end

  def add_exception_details_sheet(wb, criteria, period, styles)
    exceptions = ExceptionOrder.includes(audit: [:supplier], handler: [])
      .where(created_at: period[:start].beginning_of_day..period[:end].end_of_day)

    wb.add_worksheet(name: "异常单明细") do |sheet|
      sheet.add_row ["异常单ID", "标题", "严重等级", "状态", "关联审计",
                     "供应商", "处理人", "创建时间", "截止时间", "解决时间",
                     "影响范围", "责任认定", "处理结论"], styles: styles[:header]
      exceptions.find_each do |ex|
        sheet.add_row [
          ex.id.to_s,
          ex.title,
          I18n.t("severities.#{ex.severity}", default: ex.severity.humanize),
          I18n.t("exception_statuses.#{ex.status}", default: ex.status.humanize),
          ex.audit&.title,
          ex.audit&.supplier&.name,
          ex.handler&.name || "待分派",
          I18n.l(ex.created_at, format: :long),
          ex.due_at ? I18n.l(ex.due_at, format: :long) : "",
          ex.resolved_at ? I18n.l(ex.resolved_at, format: :long) : "",
          ex.impact_scope.to_s[0..500],
          ex.responsibility.to_s[0..500],
          ex.conclusion.to_s[0..500]
        ], styles: styles[:row]
      end
    end
  end

  def define_styles(wb)
    {
      title: wb.styles.add_style(
        font_name: "Noto Sans SC",
        sz: 16,
        b: true,
        alignment: { horizontal: :center, vertical: :center },
        bg_color: "1E40AF",
        fg_color: "FFFFFF",
        height: 24
      ),
      header: wb.styles.add_style(
        font_name: "Noto Sans SC",
        sz: 11,
        b: true,
        bg_color: "E0E7FF",
        fg_color: "1E3A8A",
        alignment: { horizontal: :center, vertical: :center, wrap_text: true },
        border: { style: :thin, color: "94A3B8" }
      ),
      row: wb.styles.add_style(
        font_name: "Noto Sans SC",
        sz: 10,
        alignment: { horizontal: :left, vertical: :center, wrap_text: true },
        border: { style: :thin, color: "CBD5E1" }
      ),
      highlight_good: wb.styles.add_style(
        font_name: "Noto Sans SC",
        sz: 10,
        b: true,
        fg_color: "059669",
        bg_color: "D1FAE5",
        alignment: { horizontal: :left, vertical: :center, wrap_text: true },
        border: { style: :thin, color: "CBD5E1" }
      ),
      highlight_bad: wb.styles.add_style(
        font_name: "Noto Sans SC",
        sz: 10,
        b: true,
        fg_color: "DC2626",
        bg_color: "FEE2E2",
        alignment: { horizontal: :left, vertical: :center, wrap_text: true },
        border: { style: :thin, color: "CBD5E1" }
      ),
      caliber: wb.styles.add_style(
        font_name: "JetBrains Mono",
        sz: 10,
        alignment: { horizontal: :left, vertical: :top, wrap_text: true },
        bg_color: "FEF3C7",
        border: { style: :thin, color: "FCD34D" }
      ),
      caliber_header: wb.styles.add_style(
        font_name: "Noto Sans SC",
        sz: 12,
        b: true,
        bg_color: "F59E0B",
        fg_color: "FFFFFF",
        alignment: { horizontal: :left, vertical: :center }
      ),
      blank: wb.styles.add_style(height: 8)
    }
  end

  def highlight_style(good, styles)
    good ? styles[:highlight_good] : styles[:highlight_bad]
  end

  def add_caliber_note_sheet(sheet, note, styles)
    sheet.add_row ["=== 口径说明 ==="], styles: styles[:caliber_header]
    note.each_line do |line|
      sheet.add_row [line.chomp], styles: styles[:caliber]
    end
  end

  def export_caliber_to_sheet(wb, export_record, caliber, styles)
    wb.add_worksheet(name: "口径说明") do |sheet|
      sheet.add_row ["导出文件口径说明"], styles: styles[:title]
      sheet.add_row [], styles: styles[:blank]
      sheet.add_row ["导出类型", export_type_label], styles: styles[:row]
      sheet.add_row ["导出ID", export_record.id.to_s], styles: styles[:row]
      sheet.add_row ["导出时间", I18n.l(export_record.created_at, format: :long)], styles: styles[:row]
      sheet.add_row ["导出人", export_record.user.name], styles: styles[:row]
      sheet.add_row ["文件有效期至", export_record.expired_at ? I18n.l(export_record.expired_at, format: :long) : "长期有效"], styles: styles[:row]
      sheet.add_row [], styles: styles[:blank]
      add_caliber_note_sheet(sheet, caliber, styles)
    end
  end

  def save_package(package, export_record)
    temp_dir = Rails.root.join("tmp", "exports")
    FileUtils.mkdir_p(temp_dir)

    file_name = "#{export_record.export_type}_#{export_record.id}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"
    file_path = temp_dir.join(file_name)

    package.serialize(file_path.to_s)

    file_data = File.open(file_path)
    blob = ActiveStorage::Blob.create_and_upload!(
      io: file_data,
      filename: file_name,
      content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    file_size = File.size(file_path)
    file_url = Rails.application.routes.url_helpers.rails_blob_url(blob, only_path: true)

    export_record.mark_completed!(file_url, file_size, file_name)

    File.delete(file_path) if File.exist?(file_path)

    { file_url: file_url, file_size: file_size, file_name: file_name }
  end
end
