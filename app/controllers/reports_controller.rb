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

    @report_service = CheckInEfficiencyReportService.new(@event, @start_date, @end_date)
    @stats = @report_service.stats
    @check_in_records = @report_service.check_in_records
    @ticket_types = @event.ticket_types.includes(:check_in_records, :ticket_orders)
    @filter_description = @report_service.filter_description

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

  def generate_xlsx
    filename = "核销效率报告_#{@event.name}_#{@start_date}_#{@end_date}.xlsx"
    generation_time = Time.current.strftime("%Y-%m-%d %H:%M:%S")
    operator_email = current_user.email

    axlsx_package = Axlsx::Package.new
    workbook = axlsx_package.workbook

    header_style = workbook.styles.add_style bg_color: "2F5496", fg_color: "FFFFFF", b: true, alignment: { horizontal: :center }

    workbook.add_worksheet(name: "报告元信息") do |sheet|
      sheet.add_row ["筛选口径", @filter_description], style: [header_style, nil]
      sheet.add_row ["生成时间", generation_time], style: [header_style, nil]
      sheet.add_row ["操作者", operator_email], style: [header_style, nil]
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
