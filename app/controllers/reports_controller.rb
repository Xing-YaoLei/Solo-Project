class ReportsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_manager!

  def index
    @events = Event.active.recent
  end

  def check_in_efficiency
    @event = Event.find(params[:event_id])
    @start_date = Date.parse(params[:start_date]) rescue @event.start_time.to_date
    @end_date = Date.parse(params[:end_date]) rescue @event.end_time.to_date

    @check_in_records = @event.check_in_records.by_date_range(@start_date, @end_date).includes(:ticket_order, :ticket_type, :operator)
    @ticket_types = @event.ticket_types.includes(:check_in_records, :ticket_orders)

    @stats = {
      total_orders: @event.ticket_orders.where(status: %w[paid checked_in]).where(created_at: @start_date..@end_date.end_of_day).count,
      checked_in: @check_in_records.count,
      rate: calculate_rate(@event, @check_in_records),
      by_method: @check_in_records.group(:check_in_method).count,
      by_ticket_type: calculate_by_ticket_type(@event, @check_in_records),
      daily_trend: calculate_daily_trend(@check_in_records)
    }

    respond_to do |format|
      format.html
      format.xlsx do
        generate_xlsx
      end
    end
  end

  private

  def authorize_manager!
    unless current_user.admin? || current_user.manager?
      redirect_to root_path, alert: t("common.unauthorized")
    end
  end

  def calculate_rate(event, records)
    total = event.ticket_orders.where(status: %w[paid checked_in]).count
    return 0 if total.zero?
    records.distinct.count(:ticket_order_id).to_f / total * 100
  end

  def calculate_by_ticket_type(event, records)
    event.ticket_types.map do |tt|
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

  def calculate_daily_trend(records)
    records.group_by_day(:check_in_time).count
  end

  def generate_xlsx
    filename = "核销效率报告_#{@event.name}_#{@start_date}_#{@end_date}.xlsx"
    filters = "活动: #{@event.name}, 时间范围: #{@start_date} ~ #{@end_date}"

    axlsx_package = Axlsx::Package.new
    workbook = axlsx_package.workbook

    header_style = workbook.styles.add_style bg_color: "2F5496", fg_color: "FFFFFF", b: true, alignment: { horizontal: :center }

    workbook.add_worksheet(name: "报告元信息") do |sheet|
      sheet.add_row ["筛选口径", filters], style: [header_style, nil]
      sheet.add_row ["生成时间", Time.current.strftime("%Y-%m-%d %H:%M:%S")], style: [header_style, nil]
      sheet.add_row ["操作者", current_user.email], style: [header_style, nil]
      sheet.add_row []
      sheet.add_row ["总订单数", @stats[:total_orders]], style: [header_style, nil]
      sheet.add_row ["已核销数", @stats[:checked_in]], style: [header_style, nil]
      sheet.add_row ["核销率", "#{@stats[:rate].round(2)}%"], style: [header_style, nil]
    end

    workbook.add_worksheet(name: "票种核销明细") do |sheet|
      sheet.add_row ["票种名称", "总订单数", "已核销数", "核销率"], style: header_style
      @stats[:by_ticket_type].each do |tt|
        sheet.add_row [tt[:name], tt[:total], tt[:checked_in], "#{tt[:rate]}%"]
      end
    end

    workbook.add_worksheet(name: "核销方式统计") do |sheet|
      sheet.add_row ["核销方式", "数量"], style: header_style
      @stats[:by_method].each do |method, count|
        sheet.add_row [method, count]
      end
    end

    workbook.add_worksheet(name: "每日核销趋势") do |sheet|
      sheet.add_row ["日期", "核销数量"], style: header_style
      @stats[:daily_trend].each do |date, count|
        sheet.add_row [date.to_s, count]
      end
    end

    workbook.add_worksheet(name: "核销记录明细") do |sheet|
      sheet.add_row ["订单号", "购票人", "票种", "核销方式", "核销时间", "操作人", "备注"], style: header_style
      @check_in_records.each do |r|
        sheet.add_row [
          r.ticket_order.order_no,
          r.ticket_order.buyer_name,
          r.ticket_type.name,
          r.check_in_method,
          r.check_in_time.strftime("%Y-%m-%d %H:%M:%S"),
          r.operator.email,
          r.note
        ]
      end
    end

    send_data axlsx_package.to_stream.read, filename: filename, type: "application/xlsx"
  end
end
