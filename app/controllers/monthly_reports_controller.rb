class MonthlyReportsController < ApplicationController
  require "csv"

  def index
    @selected_month = Date.parse(params[:month]) rescue Date.current.beginning_of_month
    @selected_property_id = params[:property_id]
    @monthly_reports = MonthlyReport.includes(:property).order(report_month: :desc)
    @monthly_reports = @monthly_reports.for_month(@selected_month) if params[:month].present?
    @monthly_reports = @monthly_reports.for_property(@selected_property_id) if @selected_property_id.present?
    @available_months = MonthlyReport.distinct.pluck(:report_month).sort.reverse
  end

  def show
    @monthly_report = MonthlyReport.find(params[:id])
  end

  def generate
    month = Date.parse(params[:month]) rescue Date.current.beginning_of_month
    MonthlyReport.generate_for_month!(month)
    redirect_to monthly_reports_path(month: month.strftime("%Y-%m")), notice: "月度复盘报告已生成"
  end

  def download
    @selected_month = Date.parse(params[:month]) rescue Date.current.beginning_of_month
    @selected_property_id = params[:property_id]
    @monthly_reports = MonthlyReport.includes(:property).for_month(@selected_month)
    @monthly_reports = @monthly_reports.for_property(@selected_property_id) if @selected_property_id.present?

    filters = {
      month: @selected_month.strftime("%Y年%m月"),
      property: @selected_property_id ? Property.find(@selected_property_id)&.name : "全部物业"
    }.compact

    csv_content = generate_csv(@monthly_reports, filters)

    reporter = current_user rescue User.first
    file_name = "monthly_report_#{@selected_month.strftime("%Y%m")}_#{Time.current.strftime("%Y%m%d%H%M%S")}.csv"

    ReportDownload.create!(
      reporter: reporter,
      report_type: "monthly_occupancy",
      file_name: file_name,
      filters: filters,
      generated_at: Time.current
    )

    send_data csv_content, filename: file_name, type: "text/csv; charset=utf-8"
  end

  private

  def generate_csv(reports, filters)
    CSV.generate(headers: true) do |csv|
      csv << ["筛选条件"]
      filters.each do |key, value|
        csv << ["#{key}:", value]
      end
      csv << ["生成时间:", Time.current.strftime("%Y-%m-%d %H:%M:%S")]
      csv << ["操作人:", (current_user&.name rescue User.first&.name)]
      csv << []
      csv << ["物业名称", "统计月份", "总房间数", "已占用房间数", "入住率", "总收入"]
      reports.each do |report|
        csv << [
          report.property&.name,
          report.month_display,
          report.total_rooms,
          report.occupied_rooms,
          report.occupancy_rate_display,
          report.total_revenue
        ]
      end
    end
  end
end
