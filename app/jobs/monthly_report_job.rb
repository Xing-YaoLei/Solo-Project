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

    records = event.check_in_records.by_date_range(start_date, end_date)
    return if records.none?

    ticket_types = event.ticket_types.includes(:check_in_records, :ticket_orders)

    stats = {
      total_orders: event.ticket_orders.where(status: %w[paid checked_in]).where(created_at: start_date..end_date.end_of_day).count,
      checked_in: records.count,
      rate: calculate_rate(event, records),
      by_method: records.group(:check_in_method).count,
      by_ticket_type: calculate_by_ticket_type(event, records, ticket_types),
      daily_trend: records.group_by_day(:check_in_time).count
    }

    generate_xlsx(event, stats, records, start_date, end_date)
  end

  def calculate_rate(event, records)
    total = event.ticket_orders.where(status: %w[paid checked_in]).count
    return 0 if total.zero?
    records.distinct.count(:ticket_order_id).to_f / total * 100
  end

  def calculate_by_ticket_type(event, records, ticket_types)
    ticket_types.map do |tt|
      checked = records.where(ticket_type: tt).distinct.count(:ticket_order_id)
      total = tt.ticket_orders.where(status: %w[paid checked_in]).count
      {
        name: tt.name,
        total: total,
        checked_in: checked,
        rate: total.zero? ? 0 : (checked.to_f / total * 100).round(2)
      }
    end
  end

  def generate_xlsx(event, stats, records, start_date, end_date)
    filename = "核销效率报告_#{event.name}_#{start_date.strftime('%Y%m')}.xlsx"
    filters = "活动: #{event.name}, 时间范围: #{start_date} ~ #{end_date}, 自动生成"

    axlsx_package = Axlsx::Package.new
    workbook = axlsx_package.workbook
    header_style = workbook.styles.add_style bg_color: "2F5496", fg_color: "FFFFFF", b: true, alignment: { horizontal: :center }

    workbook.add_worksheet(name: "报告元信息") do |sheet|
      sheet.add_row ["筛选口径", filters], style: [header_style, nil]
      sheet.add_row ["生成时间", Time.current.strftime("%Y-%m-%d %H:%M:%S")], style: [header_style, nil]
      sheet.add_row ["操作者", "系统自动生成"], style: [header_style, nil]
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
