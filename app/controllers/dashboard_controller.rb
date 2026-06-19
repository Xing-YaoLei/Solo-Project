class DashboardController < ApplicationController
  def index
    @heat_points_count = HeatPoint.active.count
    @guide_contents_count = GuideContent.published.count
    @performances_count = Performance.scheduled.count + Performance.ongoing.count
    @merchant_contracts_count = MerchantContract.active.count
    @pending_todos_count = current_user.assigned_todos.pending.count
    @open_cancellations_count = PerformanceCancellation.open.count

    @recent_todos = current_user.assigned_todos.recent.limit(5)
    @recent_processing_records = ProcessingRecord.recent.limit(10)
    @upcoming_performances = Performance.upcoming.limit(5)

    @secondary_consumption_today = SecondaryConsumption
      .where(transaction_time: Date.today.all_day)
      .sum(:amount_cents)
  end
end
