module Rider
  class DeliveryOrdersController < BaseController
    before_action :set_delivery_order, only: [ :show, :update ]

    def index
      authorize DeliveryOrder, :index?

      @q = policy_scope(DeliveryOrder).by_rider(current_user.id).ransack(params[:q])
      scope = @q.result.includes(:merchant).recent
      if params[:status].present?
        if params[:status] == 'in_progress'
          scope = scope.in_delivery
        else
          scope = scope.by_status(params[:status])
        end
      end
      if params[:delivery_date].present?
        date = Date.parse(params[:delivery_date])
        scope = scope.by_delivery_date(date.beginning_of_day, date.end_of_day)
      end
      @pagy, @delivery_orders = pagy(scope)

      @pending_count = policy_scope(DeliveryOrder).by_rider(current_user.id).pending.count
      @in_progress_count = policy_scope(DeliveryOrder).by_rider(current_user.id).where(status: [ :assigned, :picked_up ]).count
      @delivered_count = policy_scope(DeliveryOrder).by_rider(current_user.id).delivered.count
    end

    def show
      authorize @delivery_order, :show?

      @settlement_items = @delivery_order.settlement_items.includes(:settlement)
    end

    def update
      authorize @delivery_order, :update?

      if @delivery_order.update(delivery_order_params)
        redirect_to rider_delivery_orders_path, notice: "订单状态已更新。"
      else
        redirect_to rider_delivery_orders_path, alert: "更新失败，请重试。"
      end
    end

    private

    def set_delivery_order
      @delivery_order = policy_scope(DeliveryOrder).find(params[:id])
    end

    def delivery_order_params
      params.require(:delivery_order).permit(:status)
    end
  end
end
