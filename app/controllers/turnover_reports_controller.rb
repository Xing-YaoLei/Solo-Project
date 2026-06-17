class TurnoverReportsController < ApplicationController
  def index
    @reports = MonthlyTurnoverReport.recent
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

    report = MonthlyTurnoverReportJob.perform_now(report_month, generated_by, filter_conditions)

    send_file report.file_url,
              filename: "turnover_report_#{report_month.gsub('-', '')}.xlsx",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  end

  def download
    report = MonthlyTurnoverReport.find(params[:id])
    send_file report.file_url,
              filename: "turnover_report_#{report.report_month.strftime('%Y%m')}.xlsx",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  end
end
