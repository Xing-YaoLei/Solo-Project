class ReportsController < ApplicationController
  before_action :require_user
  before_action :require_reviewer, except: [:index]

  def index
    redirect_to daily_summary_reports_path
  end

  def daily_summary
    @start_date = params[:start_date]&.to_date || 7.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.today
    @source = params[:source]

    @daily_summaries = DailySummary.date_range(@start_date, @end_date)
                                    .by_source(@source)
                                    .order(summary_date: :desc)
                                    .page(params[:page])
                                    .per(31)

    @aggregated = DailySummary.aggregate_by_period(@start_date, @end_date, @source)
  end

  def performance
    @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.today

    @aggregated = DailySummary.aggregate_by_period(@start_date, @end_date)

    @operator_performance = @aggregated[:by_operator]
    @source_performance = @aggregated[:by_source]
  end

  def abnormal_analysis
    @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.today

    @aggregated = DailySummary.aggregate_by_period(@start_date, @end_date)

    @abnormal_reasons = @aggregated[:by_abnormal_reason]
    @product_tags = @aggregated[:by_product_tag]
    @shortage_trend = ShortageRecord.includes(:pickup_order)
                                     .where(created_at: @start_date.beginning_of_day..@end_date.end_of_day)
                                     .group_by_day(:created_at, range: @start_date..@end_date)
                                     .count
  end
end
