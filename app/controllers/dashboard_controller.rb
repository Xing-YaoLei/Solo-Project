class DashboardController < ApplicationController
  def index
    authorize :dashboard, :index?

    if current_user.manager?
      @total_packages = Package.active.count
      @total_orders = Order.count
      @total_revenue = Order.confirmed.sum(:total_amount)
      @oversold_orders_count = Order.oversold.count
      @packages = Package.active.order(sold_count: :desc).limit(5)

      @package_conversion_trend = build_package_conversion_trend
      @package_conversion_ranking = build_package_conversion_ranking
    else
      @my_orders = current_user.orders.order(created_at: :desc).limit(10)
      @pending_orders = current_user.orders.pending.count
      @today_check_ins = current_user.orders.where("check_in_date = ?", Date.today).count
      @oversold_orders_count = current_user.orders.oversold.count
    end
  end

  private

  def build_package_conversion_trend
    top_packages = Package.active.order(sold_count: :desc).limit(3)
    start_date = 30.days.ago.to_date
    end_date = Date.today
    dates = (start_date..end_date).to_a

    top_packages.map do |package|
      daily_data = {}
      cumulative_sold = package.orders.confirmed.where("DATE(created_at) < ?", start_date).sum(:quantity)

      dates.each do |date|
        day_orders = package.orders.confirmed.where("DATE(created_at) = ?", date).sum(:quantity)
        cumulative_sold += day_orders
        conversion_rate = package.total_inventory > 0 ? ((cumulative_sold.to_f / package.total_inventory.to_f) * 100).round(2) : 0
        daily_data[date] = conversion_rate
      end

      { name: package.name, data: daily_data }
    end
  end

  def build_package_conversion_ranking
    Package.active.order(sold_count: :desc).limit(5).each_with_object({}) do |package, hash|
      hash[package.name] = package.conversion_rate
    end
  end
end
