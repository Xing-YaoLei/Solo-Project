class DashboardController < ApplicationController
  def index
    @status_counts = WasteReport.group(:status).count
    @monthly_cost = WasteReport.where(report_date: Time.current.all_month).sum(:total_cost)
    @abnormal_count = AbnormalReport.unresolved.count
    @recent_reports = WasteReport.recent.limit(10)
  end
end
