class MonthlyReportJob < ApplicationJob
  queue_as :low_priority

  def perform(event_id = nil, month: nil, year: nil)
    target_month = month || 1.month.ago.month
    target_year = year || 1.month.ago.year

    events = event_id ? Event.where(id: event_id) : Event.where(status: %w[active completed])
    events.find_each do |event|
      generate_report(event, target_month, target_year)
    end
  end

  private

  def generate_report(event, month, year)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month

    report_service = CheckInEfficiencyReportService.new(event, start_date, end_date)
    stats = report_service.stats
    orders = report_service.scoped_orders

    return if orders.none?

    records = report_service.check_in_records
    generate_xlsx(event, stats, records, report_service.filter_description, start_date, end_date)
  end

  def generate_xlsx(event, stats, records, filter_description, start_date, end_date)
    filename = "核销效率报告_#{event.name}_#{start_date.strftime('%Y%m')}.xlsx"
    generation_time = Time.current.strftime("%Y-%m-%d %H:%M:%S")

    axlsx_package = Axlsx::Package.new
    workbook = axlsx_package.workbook
    header_style = workbook.styles.add_style bg_color: "2F5496", fg_color: "FFFFFF", b: true, alignment: { horizontal: :center }

    workbook.add_worksheet(name: "报告元信息") do |sheet|
      sheet.add_row ["筛选口径", filter_description], style: [header_style, nil]
      sheet.add_row ["生成时间", generation_time], style: [header_style, nil]
      sheet.add_row ["操作者", "系统自动生成（每月1日定时任务）"], style: [header_style, nil]
      sheet.add_row []
      sheet.add_row ["总订单数", stats[:total_orders]], style: [header_style, nil]
      sheet.add_row ["已核销数", stats[:checked_in]], style: [header_style, nil]
      sheet.add_row ["核销率", "#{stats[:rate].round(2)}%"], style: [header_style, nil]
    end

    workbook.add_worksheet(name: "票种核销明细") do |sheet|
      sheet.add_row ["票种名称", "总订单数", "已核销数", "核销率"], style: header_style
      stats[:by_ticket_type].each do |tt|
        sheet.add_row [tt[:name], tt[:total], tt[:checked_in], "#{tt[:rate]}%"]
      end
    end

    workbook.add_worksheet(name: "核销方式统计") do |sheet|
      sheet.add_row ["核销方式", "数量"], style: header_style
      stats[:by_method].each do |method, count|
        sheet.add_row [method, count]
      end
    end

    workbook.add_worksheet(name: "每日核销趋势") do |sheet|
      sheet.add_row ["日期", "核销数量"], style: header_style
      stats[:daily_trend].each do |date, count|
        sheet.add_row [date.to_s, count]
      end
    end

    filepath = Rails.root.join("tmp", filename)
    axlsx_package.serialize(filepath)
    filepath
  end
end
