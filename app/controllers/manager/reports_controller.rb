module Manager
  class ReportsController < BaseController
    def overview
      authorize Settlement, :index?

      @total_settlements = policy_scope(Settlement).count
      @total_amount = policy_scope(Settlement).completed.sum(:merchant_amount)
      @total_merchants = Merchant.count
      @total_riders = User.rider.count

      @settlements_by_status = policy_scope(Settlement).group(:status).count
      @settlements_by_month = policy_scope(Settlement).group_by_month(:created_at, format: "%Y-%m").count
      @amount_by_month = policy_scope(Settlement).completed.group_by_month(:created_at, format: "%Y-%m").sum(:merchant_amount)

      @top_merchants = policy_scope(Settlement).completed
                                .group(:merchant_id)
                                .sum(:merchant_amount)
                                .sort_by { |_, v| -v }
                                .first(10)
                                .to_h

      @sensitive_fields = sensitive_fields_for(:city_manager)
    end

    def payment_cycle
      authorize Settlement, :index?

      @period = params[:period] || Date.today.strftime("%Y-%m")
      start_date = Date.parse("#{@period}-01")
      end_date = start_date.end_of_month

      @q = policy_scope(Settlement).by_period(@period).ransack(params[:q])
      scope = @q.result.includes(:merchant, :handler, :discrepancies).order(payment_date: :asc)
      @pagy, @settlements = pagy(scope)

      @total_amount = policy_scope(Settlement).by_period(@period).sum(:merchant_amount)
      @settlement_count = @pagy.count
      @with_difference_count = policy_scope(Settlement).by_period(@period).with_difference.count

      @by_status = policy_scope(Settlement).by_period(@period).group(:status).count
      @by_merchant = policy_scope(Settlement).by_period(@period)
                                 .group(:merchant_id)
                                 .sum(:merchant_amount)
                                 .sort_by { |_, v| -v }
                                 .first(10)
                                 .to_h

      @sensitive_fields = sensitive_fields_for(:city_manager)
    end

    def by_date
      authorize Settlement, :index?

      @start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today

      @settlements_by_date = policy_scope(Settlement).by_payment_date(@start_date, @end_date)
                                          .group_by_day(:payment_date)
                                          .count

      @amount_by_date = policy_scope(Settlement).by_payment_date(@start_date, @end_date)
                                   .group_by_day(:payment_date)
                                   .sum(:merchant_amount)

      @q = policy_scope(Settlement).by_payment_date(@start_date, @end_date).ransack(params[:q])
      scope = @q.result.includes(:merchant, :handler).order(payment_date: :desc)
      @pagy, @settlements = pagy(scope)

      @total_amount = policy_scope(Settlement).by_payment_date(@start_date, @end_date).sum(:merchant_amount)
      @settlement_count = @pagy.count

      @sensitive_fields = sensitive_fields_for(:city_manager)
    end

    def by_owner
      authorize Settlement, :index?

      @period = params[:period] || Date.today.strftime("%Y-%m")

      @by_handler = policy_scope(Settlement).by_period(@period)
                                .group(:handler_id)
                                .count
                                .sort_by { |_, v| -v }
                                .to_h

      @amount_by_handler = policy_scope(Settlement).by_period(@period).completed
                                     .group(:handler_id)
                                     .sum(:merchant_amount)
                                     .sort_by { |_, v| -v }
                                     .to_h

      @discrepancies_by_handler = policy_scope(Discrepancy).joins(:settlement)
                                           .where(settlements: { period: @period })
                                           .group("settlements.handler_id")
                                           .count

      @handlers = User.cs.includes(:assigned_todo_items)
      @q = policy_scope(Settlement).by_period(@period).ransack(params[:q])
      scope = @q.result.includes(:merchant, :handler).order(handler_id: :asc, period: :desc)
      @pagy, @settlements = pagy(scope)

      @sensitive_fields = sensitive_fields_for(:city_manager)
    end
  end
end
