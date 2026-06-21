module Rider
  class DeliveryOrdersController < BaseController
    before_action :set_delivery_order, only: [ :show ]

    def index
      authorize DeliveryOrder, :index?

      @q = policy_scope(DeliveryOrder).by_rider(current_user.id).ransack(params[:q])
      @delivery_orders = @q.result.includes(:merchant)
                           .recent.page(params[:page])

      @pending_count = policy_scope(DeliveryOrder).by_rider(current_user.id).pending.count
      @in_progress_count = policy_scope(DeliveryOrder).by_rider(current_user.id).where(status: [ :assigned, :picked_up ]).count
      @delivered_count = policy_scope(DeliveryOrder).by_rider(current_user.id).delivered.count
    end

    def show
      authorize @delivery_order, :show?

      @settlement_items = @delivery_order.settlement_items.includes(:settlement)
    end

    private

    def set_delivery_order
      @delivery_order = policy_scope(DeliveryOrder).find(params[:id])
    end
  end
end
