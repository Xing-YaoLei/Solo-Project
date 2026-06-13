class ReportsController < ApplicationController
  before_action :require_user
  before_action :require_reviewer, except: [:index, :daily_summary]

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

    date_range = @start_date.beginning_of_day..@end_date.end_of_day

    @source_performance = PickupOrder.where(created_at: date_range)
                                       .group(:source)
                                       .count
                                       .sort_by { |_, v| -v }
                                       .to_h

    all_by_operator = PickupOrder.where(created_at: date_range)
                                  .group(:operator_id)
                                  .count

    completed_by_operator = PickupOrder.where(created_at: date_range)
                                .where(status: ['completed', 'closed'])
                                .group(:operator_id)
                                .count

    on_time_by_operator = PickupOrder.where(created_at: date_range)
                                      .where(status: ['completed', 'closed'])
                                      .select { |o| o.on_time? }
                                      .group_by(&:operator_id)
                                      .transform_values(&:count)

    @operator_performance = {}
    all_by_operator.each do |operator_id, total|
      next unless operator_id
      user = User.find_by(id: operator_id)
      next unless user
      completed = completed_by_operator[operator_id] || 0
      on_time = on_time_by_operator[operator_id] || 0
      rate = completed > 0 ? (on_time.to_f / completed * 100).round(2) : 0
      @operator_performance[user.name] = { id: user.id, total: total, completed: completed, on_time: on_time, rate: rate }
    end

    @total_orders = PickupOrder.where(created_at: date_range).count
    @completed_orders = PickupOrder.where(created_at: date_range).where(status: ['completed', 'closed']).count

    shortage_by_operator = ShortageRecord.joins(:pickup_order)
                                          .where(pickup_orders: { created_at: date_range })
                                          .group(:operator_id)
                                          .count
    @operator_shortage = {}
    shortage_by_operator.each do |operator_id, count|
      next unless operator_id
      user = User.find_by(id: operator_id)
      next unless user
      @operator_shortage[user.name] = count
    end
  end

  def abnormal_analysis
    @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.today

    date_range = @start_date.beginning_of_day..@end_date.end_of_day

    shortage_records = ShortageRecord.where(created_at: date_range)

    @abnormal_reasons = shortage_records.group(:reason)
                                         .count
                                         .sort_by { |_, v| -v }
                                         .to_h

    @abnormal_orders_by_reason = {}
    @abnormal_reasons.each do |reason, _count|
      @abnormal_orders_by_reason[reason] = PickupOrder.joins(:shortage_records)
                                                       .where(shortage_records: { reason: reason })
                                                       .where(created_at: date_range)
                                                       .includes(:pickup_items, :operator)
                                                       .order(created_at: :desc)
                                                       .limit(10)
    end

    @product_tags = PickupItem.joins(:pickup_order)
                              .where(pickup_orders: { created_at: date_range })
                              .group(:product_tag)
                              .sum(:actual_quantity)
                              .sort_by { |_, v| -v }
                              .to_h

    @shortage_trend = shortage_records.group_by_day(:created_at, range: @start_date..@end_date)
                                       .count

    @shortage_orders_count = shortage_records.distinct.count(:pickup_order_id)
    @shortage_total = shortage_records.sum(:shortage_quantity)
  end
end
