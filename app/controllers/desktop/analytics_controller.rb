class Desktop::AnalyticsController < ApplicationController
  def index
    @secondary_consumption_total = SecondaryConsumption.total_amount
    @secondary_consumption_count = SecondaryConsumption.count
    @customer_count = SecondaryConsumption.total_customers
    @top_sources = SecondaryConsumption.group_by_source
    @daily_data = SecondaryConsumption.group_by_day(30.days.ago, Date.today)
    @top_merchants = MerchantContract
      .left_joins(:secondary_consumptions)
      .group("merchant_contracts.id")
      .order("COUNT(secondary_consumptions.id) DESC")
      .limit(10)
  end

  def secondary_consumption
    @q = SecondaryConsumption.ransack(params[:q])
    @secondary_consumptions = @q.result
      .recent
      .page(params[:page])
      .per(50)

    @total_amount = @q.result.total_amount
    @total_count = @q.result.count
    @by_source = @q.result.group_by_source
  end
end
