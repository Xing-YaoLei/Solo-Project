class TurnoverReportsController < ApplicationController
  def index
    @reports = MonthlyTurnoverReport.recent
  end

  def show
    @report = MonthlyTurnoverReport.find(params[:id])
  end

  def new
    @zones = ParkingSpot.distinct.pluck(:zone)
  end

  def create
    report_month = params[:report_month]
    generated_by = params[:generated_by] || "system"
    filter_conditions = {
      "zone" => params[:zone],
      "spot_type" => params[:spot_type]
    }.compact

    report = MonthlyTurnoverReport.create!(
      report_month: Date.parse(report_month),
      generated_by: generated_by,
      filter_conditions: filter_conditions,
      generated_at: Time.current,
      status: "pending"
    )

    MonthlyTurnoverReportJob.perform_later(report.id)

    redirect_to turnover_reports_path, notice: "报告生成中，请稍后刷新页面查看"
  end

  def download
    report = MonthlyTurnoverReport.find(params[:id])
    if report.completed? && report.file_url.present?
      send_file report.file_url,
                filename: "turnover_report_#{report.report_month.strftime('%Y%m')}.xlsx",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else
      redirect_to turnover_reports_path, alert: "报告尚未生成完成"
    end
  end
end
