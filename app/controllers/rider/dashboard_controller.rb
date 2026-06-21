module Rider
  class DashboardController < BaseController
    def index
      authorize DeliveryOrder, :index?

      @pending_orders = policy_scope(DeliveryOrder).pending.count
      @assigned_orders = policy_scope(DeliveryOrder).assigned.count
      @picked_up_orders = policy_scope(DeliveryOrder).picked_up.count
      @delivered_orders = policy_scope(DeliveryOrder).delivered.count
      @cancelled_orders = policy_scope(DeliveryOrder).cancelled.count

      @today_orders = policy_scope(DeliveryOrder).by_delivery_date(Date.today.beginning_of_day, Date.today.end_of_day).count
      @today_earnings = policy_scope(DeliveryOrder).by_delivery_date(Date.today.beginning_of_day, Date.today.end_of_day).delivered.sum(:amount)
      @this_week_orders = policy_scope(DeliveryOrder).by_delivery_date(1.week.ago.beginning_of_day, Date.today.end_of_day).delivered.count
      @this_week_earnings = policy_scope(DeliveryOrder).by_delivery_date(1.week.ago.beginning_of_day, Date.today.end_of_day).delivered.sum(:amount)

      @my_pending_orders = policy_scope(DeliveryOrder).by_rider(current_user.id).pending.recent.limit(10)
      @my_completed_orders = policy_scope(DeliveryOrder).by_rider(current_user.id).delivered.recent.limit(10)

      @sensitive_fields = sensitive_fields_for(:rider)
    end
  end
end
