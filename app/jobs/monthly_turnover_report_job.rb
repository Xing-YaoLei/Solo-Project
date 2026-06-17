class MonthlyTurnoverReportJob < ApplicationJob
  queue_as :reports

  def perform(report_id)
    report = MonthlyTurnoverReport.find(report_id)
    report.update!(status: "generating")

    report_month = report.report_month
    start_date = report_month.beginning_of_month
    end_date = report_month.end_of_month
    filter_conditions = report.filter_conditions_hash
    generated_by = report.generated_by

    spots = ParkingSpot.all
    spots = spots.by_zone(filter_conditions["zone"]) if filter_conditions["zone"].present?
    spots = spots.by_spot_type(filter_conditions["spot_type"]) if filter_conditions["spot_type"].present?

    turnover_data = spots.map do |spot|
      bills = spot.parking_bills.where(check_out_at: start_date..end_date)
      {
        spot_number: spot.spot_number,
        zone: spot.zone,
        spot_type: spot.spot_type,
        total_bills: bills.count,
        paid_bills: bills.paid.count,
        unpaid_bills: bills.unpaid.count,
        total_revenue: bills.paid.sum(:amount),
        turnover_rate: spot.turnover_rate(start_date: start_date, end_date: end_date)
      }
    end

    total_bills = turnover_data.sum { |d| d[:total_bills] }
    total_revenue = turnover_data.sum { |d| d[:total_revenue] }
    avg_turnover = spots.any? ? turnover_data.sum { |d| d[:turnover_rate] } / spots.size : 0

    summary = {
      total_spots: spots.count,
      total_bills: total_bills,
      total_revenue: total_revenue,
      average_turnover_rate: avg_turnover.round(2),
      occupancy_rate: (spots.occupied.count.to_f / spots.count * 100).round(2)
    }

    file_path = generate_excel(report, turnover_data, summary, filter_conditions, generated_by)

    report.update!(status: "completed", file_url: file_path)
  rescue => e
    report.update!(status: "failed", error_message: e.message) if report.present?
    raise e
  end

  private

  FILTER_LABELS = {
    "zone" => "区域",
    "spot_type" => "车位类型"
  }.freeze

  SPOT_TYPE_LABELS = {
    "regular" => "普通",
    "reserved" => "预留",
    "disabled" => "无障碍",
    "ev" => "充电桩"
  }.freeze

  def filter_label(key)
    FILTER_LABELS[key] || key
  end

  def filter_value_display(key, value)
    return SPOT_TYPE_LABELS[value] || value
  end

  def generate_excel(report, turnover_data, summary, filter_conditions, generated_by)
    require "axlsx"

    file_name = "turnover_report_#{report.report_month.strftime('%Y%m')}.xlsx"
    temp_file = Rails.root.join("tmp", file_name)

    Axlsx::Package.new do |p|
      p.workbook.add_worksheet(name: "车位周转报告") do |sheet|
        title_style = sheet.styles.add_style(sz: 14, b: true)
        header_style = sheet.styles.add_style(bg_color: "4472C4", fg_color: "FFFFFF", b: true)
        info_style = sheet.styles.add_style(b: true)

        sheet.add_row ["物业园区车位周转月度报告"], style: title_style
        sheet.add_row []
        sheet.add_row ["报告月份", report.display_month], style: [info_style]
        sheet.add_row ["生成时间", report.generated_at.strftime("%Y-%m-%d %H:%M:%S")], style: [info_style]
        sheet.add_row ["操作人", generated_by], style: [info_style]
        sheet.add_row []

        sheet.add_row ["筛选条件"], style: [info_style]
        filter_conditions.each do |key, value|
          next if value.blank?
          sheet.add_row ["  #{filter_label(key)}", filter_value_display(key, value)]
        end
        sheet.add_row []

        sheet.add_row ["汇总统计"], style: [info_style]
        sheet.add_row ["总车位数", summary[:total_spots]]
        sheet.add_row ["总账单数", summary[:total_bills]]
        sheet.add_row ["总收入", "¥#{summary[:total_revenue]}"]
        sheet.add_row ["平均周转率", summary[:average_turnover_rate].to_s]
        sheet.add_row ["占用率", "#{summary[:occupancy_rate]}%"]
        sheet.add_row []

        sheet.add_row %w[车位号 区域 类型 总账单 已付 未付 收入 周转率], style: header_style
        turnover_data.each do |d|
          sheet.add_row [
            d[:spot_number],
            d[:zone],
            SPOT_TYPE_LABELS[d[:spot_type]] || d[:spot_type],
            d[:total_bills],
            d[:paid_bills],
            d[:unpaid_bills],
            "¥#{d[:total_revenue]}",
            d[:turnover_rate].round(2).to_s
          ]
        end
      end

      p.serialize(temp_file.to_s)
    end

    temp_file.to_s
  end
end
