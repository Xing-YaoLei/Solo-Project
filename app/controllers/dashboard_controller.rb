class DashboardController < ApplicationController
  def index
    authorize :dashboard, :index?

    if current_user.manager?
      @total_packages = Package.active.count
      @total_orders = Order.count
      @total_revenue = Order.confirmed.sum(:total_amount)
      @oversold_orders_count = Order.oversold.count
      @packages = Package.active.order(sold_count: :desc).limit(5)

      @conversion_data = build_conversion_data
    else
      @my_orders = current_user.orders.order(created_at: :desc).limit(10)
      @pending_orders = current_user.orders.pending.count
      @today_check_ins = current_user.orders.where("check_in_date = ?", Date.today).count
      @oversold_orders_count = current_user.orders.oversold.count
    end
  end

  private

  def build_conversion_data
    last_30_days = (30.days.ago.to_date..Date.today).to_a
    data = {}

    last_30_days.each do |date|
      data[date] = 0
    end

    orders_by_day = Order.confirmed
                          .where("DATE(created_at) >= ?", 30.days.ago.to_date)
                          .group("DATE(created_at)")
                          .count

    orders_by_day.each do |date, count|
      data[date.to_date] = count if data.key?(date.to_date)
    end

    data
  end
end
