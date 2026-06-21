module Rider
  class SettlementsController < BaseController
    before_action :set_settlement, only: [ :show ]

    def index
      authorize Settlement, :index?

      settlement_ids = policy_scope(DeliveryOrder).by_rider(current_user.id)
                              .joins(:settlement_items)
                              .pluck("DISTINCT settlement_items.settlement_id")

      @settlements = Settlement.where(id: settlement_ids)
                               .includes(:merchant)
                               .recent.page(params[:page])

      @sensitive_fields = sensitive_fields_for(:rider)
    end

    def show
      authorize @settlement, :show?

      @settlement_items = @settlement.settlement_items
                                     .joins(:delivery_order)
                                     .where(delivery_orders: { rider_id: current_user.id })
                                     .includes(:delivery_order)

      @sensitive_fields = sensitive_fields_for(:rider)
    end

    private

    def set_settlement
      @settlement = Settlement.find(params[:id])
    end
  end
end
